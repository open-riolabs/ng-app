import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { ModalCloseReason, ModalResult, ModalService } from '@open-rlb/ng-bootstrap';
import { Subject } from 'rxjs';
import { AppLoggerService } from '../apps/app-logger.service';
import { LanguageService } from '../i18n/language.service';
import { PwaUpdaterService } from './pwa-updater.service';

/** Stands in for the real SwUpdate, which needs a registered service worker Karma doesn't have. */
class FakeSwUpdate {
  readonly versionUpdates = new Subject<VersionEvent>();
  readonly unrecoverable = new Subject<UnrecoverableStateEvent>();
  readonly isEnabled = true;
  activations = 0;

  activateUpdate(): Promise<boolean> {
    this.activations++;
    return Promise.resolve(true);
  }

  checkForUpdate(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

// A real reload would restart the Karma page, so the spec counts reloads instead.
@Injectable()
class TestPwaUpdaterService extends PwaUpdaterService {
  reloads = 0;

  protected override reloadPage(): void {
    this.reloads++;
  }
}

describe('PwaUpdaterService', () => {
  let updates: FakeSwUpdate;
  let modals: { title: string; body: string; header?: string; ok?: string; type?: string }[];
  let modalReason: ModalCloseReason;
  let errors: any[][];

  function build(): TestPwaUpdaterService {
    updates = new FakeSwUpdate();
    modals = [];
    modalReason = 'ok';
    errors = [];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        TestPwaUpdaterService,
        { provide: SwUpdate, useValue: updates },
        {
          provide: ModalService,
          useValue: {
            openSimpleModal: (title: string, body: string, header?: string, ok?: string, type?: string) => {
              modals.push({ title, body, header, ok, type });
              const result = new Subject<ModalResult<void>>();
              queueMicrotask(() => {
                result.next({ reason: modalReason, result: undefined });
                result.complete();
              });
              return result;
            },
          },
        },
        // Keys come back untranslated, so the spec checks which keys a consumer must provide.
        { provide: LanguageService, useValue: { translate: (key: string) => key } },
        {
          provide: AppLoggerService,
          useValue: {
            for: () => ({
              error: (...args: any[]) => errors.push(args),
              warn: () => undefined,
              info: () => undefined,
              debug: () => undefined,
              log: () => undefined,
            }),
          },
        },
      ],
    });

    return TestBed.inject(TestPwaUpdaterService);
  }

  /** Lets the fake modal answer and any activateUpdate().then(...) settle. */
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve));

  describe('when the service worker reaches an unrecoverable state', () => {
    it('asks the user to reload and reloads once they confirm', async () => {
      const service = build();
      service.checkWithDialog().subscribe();

      updates.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'Hash mismatch in /index.html' });
      await settle();

      expect(modals).toEqual([{
        title: 'core.pwa.reloadRequired',
        body: 'core.pwa.unrecoverableMessage',
        header: undefined,
        ok: 'core.pwa.reload',
        type: 'warning',
      }]);
      expect(service.reloads).toBe(1);
      expect(updates.activations).toBe(0);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Hash mismatch in /index.html');
    });

    it('does not reload when the user closes the dialog', async () => {
      const service = build();
      service.checkWithDialog().subscribe();
      modalReason = 'close';

      updates.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'Hash mismatch in /index.html' });
      await settle();

      expect(modals.length).toBe(1);
      expect(service.reloads).toBe(0);
    });
  });

  describe('when a new version is downloaded', () => {
    it('flags the version and, once confirmed, activates it and reloads, logging nothing', async () => {
      const service = build();
      service.checkWithDialog().subscribe();

      updates.versionUpdates.next({
        type: 'VERSION_READY',
        currentVersion: { hash: 'old' },
        latestVersion: { hash: 'new' },
      });
      await settle();

      expect(service.newVersionAvailable()).toBeTrue();
      expect(modals.map((m) => m.title)).toEqual(['core.pwa.newVersionAvailable']);
      expect(updates.activations).toBe(1);
      expect(service.reloads).toBe(1);
      expect(errors).toEqual([]);
    });

    it('logs the version hash and the error when it fails to install, and offers no update', async () => {
      const service = build();
      service.checkWithDialog().subscribe();

      updates.versionUpdates.next({
        type: 'VERSION_INSTALLATION_FAILED',
        version: { hash: '3f2a9c' },
        error: "Hash mismatch (cacheBustedFetchFromNetwork): https://example.test/index.html: expected 'a', got 'b'",
      });
      await settle();

      expect(errors.length).toBe(1);
      expect(errors[0].join(' ')).toContain('3f2a9c');
      expect(errors[0].join(' ')).toContain('Hash mismatch (cacheBustedFetchFromNetwork)');
      expect(service.newVersionAvailable()).toBeFalse();
      expect(modals).toEqual([]);
      expect(service.reloads).toBe(0);
    });

    it('logs a failed install even when the update dialog is not enabled', () => {
      build();

      updates.versionUpdates.next({
        type: 'VERSION_INSTALLATION_FAILED',
        version: { hash: '3f2a9c' },
        error: 'Network error',
      });

      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('Network error');
    });
  });
});
