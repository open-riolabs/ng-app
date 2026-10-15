import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionInstallationFailedEvent, VersionReadyEvent } from '@angular/service-worker';
import { filter, map, merge, switchMap } from 'rxjs';
import { ModalService } from '@open-rlb/ng-bootstrap';
import { LanguageService } from '../i18n/language.service';
import { AppLoggerService, LoggerContext } from '../apps/app-logger.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdaterService {
  private readonly updates = inject(SwUpdate);
  private readonly modalService = inject(ModalService);
  private readonly languageService = inject(LanguageService);
  private readonly loggerService = inject(AppLoggerService);
  private readonly logger: LoggerContext = this.loggerService.for(this.constructor.name);

  private readonly _newVersionAvailable = signal(false);
  readonly newVersionAvailable = this._newVersionAvailable.asReadonly();

  get newVersionAvailable$() {
    return toObservable(this._newVersionAvailable);
  }

  constructor() {
    this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => (evt.type === 'VERSION_READY')),
        takeUntilDestroyed()
      ).subscribe(() => this._newVersionAvailable.set(true));

    // After a failed install the service worker keeps serving the old version and tells the page
    // nothing: without this log, a deploy that never arrives looks exactly like no deploy.
    this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionInstallationFailedEvent => (evt.type === 'VERSION_INSTALLATION_FAILED')),
        takeUntilDestroyed()
      ).subscribe((evt) =>
        this.logger.error(`Service worker failed to install version ${evt.version.hash}:`, evt.error));

    this.updates.unrecoverable
      .pipe(takeUntilDestroyed())
      .subscribe((evt) =>
        this.logger.error('Service worker is in an unrecoverable state, the page must be reloaded:', evt.reason));
  }

  update() {
    this.updates.activateUpdate()
      .then(() => this.reloadPage());
  }

  async checkForUpdates() {
    return await this.updates.checkForUpdate();
  }

  checkWithDialog() {
    const versionReady$ = this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => {
          const result = evt.type === 'VERSION_READY';
          return result;
        }),
        switchMap(() =>
          this.modalService.openSimpleModal(
            this.languageService.translate('core.pwa.newVersionAvailable'),
            this.languageService.translate('core.pwa.updateMessage'),
            this.languageService.translate('core.pwa.updateNow'),
            this.languageService.translate('core.pwa.update'),
            this.languageService.translate('core.pwa.later'))
        ),
        filter((res) => res?.reason === 'ok'),
        map(() => this.updates.activateUpdate().then(() => this.reloadPage()))
      );

    // Angular's guidance for an unrecoverable state: the cached version is broken and only a full
    // reload can fetch a working one, so the user is told and the page reloads on confirmation.
    const unrecoverable$ = this.updates.unrecoverable
      .pipe(
        switchMap(() =>
          this.modalService.openSimpleModal(
            this.languageService.translate('core.pwa.reloadRequired'),
            this.languageService.translate('core.pwa.unrecoverableMessage'),
            undefined,
            this.languageService.translate('core.pwa.reload'),
            'warning')
        ),
        filter((res) => res?.reason === 'ok'),
        map(() => this.reloadPage())
      );

    return merge(versionReady$, unrecoverable$);
  }

  /** The only place that reloads the page, so specs can stop a reload that would restart Karma. */
  protected reloadPage(): void {
    document.location.reload();
  }
}
