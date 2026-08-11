import { Injectable, Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { ProviderConfiguration, RLB_CFG_ACL, RLB_CFG_AUTH } from '../../configuration';
import { AclStore } from '../../store/acl/acl.store';
import { AppLoggerService } from './app-logger.service';
import { AppsService } from './apps.service';

/** AppsService reads window.location.hostname directly, so specs match against the real one. */
const HERE = window.location.hostname;

const provider = (configId: string, domains?: string[]): ProviderConfiguration =>
  ({ configId, domains }) as ProviderConfiguration;

// isDevMode() is true under Karma, so both branches need a subclass to pin it either way.
@Injectable()
class DevAppsService extends AppsService {
  protected override isDevelopmentMode(): boolean {
    return true;
  }
}

@Injectable()
class ProdAppsService extends AppsService {
  protected override isDevelopmentMode(): boolean {
    return false;
  }
}

describe('AppsService.initAuthProviders', () => {
  let dispatched: any[];
  let errors: string[];
  let warnings: string[];

  /** Builds AppsService against a provider list; `stored` models a provider already settled. */
  function build(options: {
    providers?: ProviderConfiguration[];
    stored?: string | null;
    devMode?: boolean;
  }): AppsService {
    dispatched = [];
    errors = [];
    warnings = [];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DevAppsService,
        ProdAppsService,
        {
          provide: Store,
          useValue: {
            selectSignal: () => signal(options.stored ?? null),
            dispatch: (action: any) => dispatched.push(action),
          },
        },
        { provide: Router, useValue: { events: EMPTY, url: '/' } },
        { provide: ActivatedRoute, useValue: { snapshot: {}, children: [] } },
        { provide: AclStore, useValue: { resources: () => null, loadACL: () => of(null) } },
        { provide: RLB_CFG_ACL, useValue: null },
        { provide: RLB_CFG_AUTH, useValue: { providers: options.providers ?? [] } },
        {
          provide: AppLoggerService,
          useValue: {
            for: () => ({
              error: (...args: any[]) => errors.push(args.join(' ')),
              warn: (...args: any[]) => warnings.push(args.join(' ')),
              info: () => undefined,
              debug: () => undefined,
              log: () => undefined,
            }),
          },
        },
      ],
    });

    const token: Type<AppsService> = options.devMode ? DevAppsService : ProdAppsService;
    return TestBed.inject(token);
  }

  it('leaves a provider the initializer already settled alone', () => {
    build({ providers: [provider('a'), provider('b')], stored: 'a' });

    expect(dispatched).toEqual([]);
    expect(errors).toEqual([]);
  });

  it('selects the only configured provider', () => {
    build({ providers: [provider('only-realm')] });

    expect(dispatched.length).toBe(1);
    expect(dispatched[0].currentProvider).toBe('only-realm');
  });

  it('selects the provider that claims this domain', () => {
    build({ providers: [provider('elsewhere', ['other.example.com']), provider('here', [HERE])] });

    expect(dispatched.length).toBe(1);
    expect(dispatched[0].currentProvider).toBe('here');
  });

  it('warns, but does not fail, when no providers are configured', () => {
    build({ providers: [], devMode: true });

    expect(warnings.join(' ')).toContain('No auth providers configured');
    expect(errors).toEqual([]);
  });

  describe('when no provider claims this domain', () => {
    const mismatched = [
      provider('a', ['a.example.com']),
      provider('b', ['b.example.com']),
    ];

    it('logs at error level and selects nothing, in production', () => {
      // The old behaviour was a console warning followed by an app that stayed silently
      // unauthenticated for the life of the page: every guard bounced, and login() authorized
      // against whichever configuration was registered first.
      build({ providers: mismatched });

      expect(dispatched).toEqual([]);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain(HERE);
    });

    it('throws in dev, so the deployment error surfaces at bootstrap', () => {
      expect(() => build({ providers: mismatched, devMode: true })).toThrowError(new RegExp(HERE));
    });
  });

  describe('when two providers claim this domain', () => {
    const clashing = [provider('a', [HERE]), provider('b', [HERE])];

    it('names both rather than picking one', () => {
      build({ providers: clashing });

      expect(dispatched).toEqual([]);
      expect(errors[0]).toContain('a, b');
    });

    it('throws in dev', () => {
      expect(() => build({ providers: clashing, devMode: true })).toThrowError(/a, b/);
    });
  });
});
