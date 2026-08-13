import { DOCUMENT } from '@angular/common';
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AbstractSecurityStorage, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthConfiguration, ProviderConfiguration, RLB_CFG_AUTH } from '../configuration';
import { AppLoggerService, AppStorageService, CookiesService } from '../services';
import { AdminApiService } from '../services/acl/user-resources.service';
import { AclStore } from '../store/acl/acl.store';
import { bootSessionRestorer, oidcConfigsFor, provideRlbCodeBrowserOAuth } from './auth.provider';
import { RLB_BOOT_SESSION_RESTORER } from './renewal/boot-session-restore';
import { AuthenticationService } from './services/auth.service';

const provider = (configId: string, extra?: Partial<ProviderConfiguration>): ProviderConfiguration =>
  ({ configId, authority: `https://login.example.com/realms/${configId}`, ...extra }) as
    ProviderConfiguration;

const authConfig = (
  interceptor: AuthConfiguration['interceptor'],
  providers: ProviderConfiguration[] = [provider('dashboard-realm')],
): AuthConfiguration => ({
  protocol: 'oauth',
  storage: 'localStorage',
  interceptor,
  allowedUrls: ['https://api.example.com'],
  providers,
});

describe('oidcConfigsFor', () => {
  it('leaves the library renewing on its own under every other interceptor', () => {
    // The behaviour every consumer on 'oauth-code-ep' / 'oauth-code-all' has today: nothing else
    // renews their token, so the library's periodic check has to.
    for (const interceptor of ['oauth-code-all', 'oauth-code-ep', 'none', undefined] as const) {
      const [config] = oidcConfigsFor(authConfig(interceptor));

      expect(config.silentRenew)
        .withContext(`interceptor: ${interceptor}`)
        .toBeTrue();
    }
  });

  it('switches the library renewal off when the watchdog owns it', () => {
    // Two renewers against one refresh token, and only the watchdog's attempts restore storage after
    // the library wipes it: through an outage the unguarded one ends the session (audit F8).
    const configs = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('dashboard-realm'), provider('partner-realm')]),
    );

    expect(configs.map(config => config.silentRenew)).toEqual([false, false]);
  });

  it('lets a provider ask for the library renewal back', () => {
    // The escape hatch this function exists for: silentRenew used to be pinned after the spread, so
    // a host could not override it from its environment at all.
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('legacy-realm', { silentRenew: true })]),
    );

    expect(config.silentRenew).toBeTrue();
  });

  it('pins everything else whatever the provider says', () => {
    // These carry the flow the whole kit assumes — refresh tokens, code flow, user info on renewal.
    // A provider silently turning one off would break renewal in a way no spec below would catch.
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [
        provider('partner-realm', {
          responseType: 'id_token token',
          useRefreshToken: false,
          autoUserInfo: false,
          secureRoutes: ['https://elsewhere.example.com'],
        }),
      ]),
    );

    expect(config.responseType).toBe('code');
    expect(config.useRefreshToken).toBeTrue();
    expect(config.autoUserInfo).toBeTrue();
    expect(config.renewUserInfoAfterTokenRenew).toBeTrue();
    expect(config.ignoreNonceAfterRefresh).toBeTrue();
    expect(config.renewTimeBeforeTokenExpiresInSeconds).toBe(30);
    expect(config.secureRoutes).toEqual(['https://api.example.com']);
  });

  it('keeps what the provider itself declares', () => {
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('partner-realm', { clientId: 'partner' })]),
    );

    expect(config.configId).toBe('partner-realm');
    expect(config.clientId).toBe('partner');
    expect(config.authority).toBe('https://login.example.com/realms/partner-realm');
  });
});

const CONFIG_ID = 'partner-realm';

/** The library's per-config storage entry, reduced to what the watchdog reads from it. */
const storedState = (refreshToken: string): string =>
  JSON.stringify({ authnResult: { refresh_token: refreshToken } });

/** In-memory stand-in for the kit's TokenStoreService. */
class StorageStub {
  private readonly entries = new Map<string, string>();

  read(key: string): string | null {
    return this.entries.get(key) ?? null;
  }
  write(key: string, value: string): void {
    this.entries.set(key, value);
  }
  remove(key: string): void {
    this.entries.delete(key);
  }
  clear(): void {
    this.entries.clear();
  }
}

/** Fails every refresh the way the library does: wiping storage before the error surfaces. */
class WipingOidcStub {
  forceCalls = 0;
  storage?: StorageStub;

  getAccessToken(): Observable<string> {
    return of('');
  }

  checkAuthMultiple(): Observable<never[]> {
    return of([]);
  }

  forceRefreshSession(): Observable<{ accessToken: string }> {
    this.forceCalls++;
    this.storage?.remove(CONFIG_ID);
    return throwError(() => new Error('OidcService code request https://login.example.com'));
  }
}

describe('bootSessionRestorer', () => {
  it('renews through the watchdog, so a wipe on failure is put back', async () => {
    // The reason this delegates rather than calling oidc.forceRefreshSession itself. A reload during
    // an outage would otherwise destroy the refresh token that makes the session recoverable at all.
    const storage = new StorageStub();
    const oidc = new WipingOidcStub();
    oidc.storage = storage;
    storage.write(CONFIG_ID, storedState('offline-token'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: OidcSecurityService, useValue: oidc },
        { provide: AbstractSecurityStorage, useValue: storage },
        { provide: AuthenticationService, useValue: { currentProvider: { configId: CONFIG_ID } } },
        { provide: RLB_CFG_AUTH, useValue: {} },
      ],
    });
    const restorer = bootSessionRestorer(TestBed.inject(Injector));

    expect(restorer.canRestore()).toBeTrue();
    await expectAsync(firstValueFrom(restorer.refresh())).toBeRejected();

    expect(oidc.forceCalls).toBe(1);
    expect(storage.read(CONFIG_ID)).toBe(storedState('offline-token'));
  });

  it('has nothing to try with once storage is empty', () => {
    const storage = new StorageStub();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: OidcSecurityService, useValue: new WipingOidcStub() },
        { provide: AbstractSecurityStorage, useValue: storage },
        { provide: AuthenticationService, useValue: { currentProvider: { configId: CONFIG_ID } } },
        { provide: RLB_CFG_AUTH, useValue: {} },
      ],
    });

    expect(bootSessionRestorer(TestBed.inject(Injector)).canRestore()).toBeFalse();
  });
});

/**
 * Everything `AuthenticationService` needs, stubbed.
 *
 * The real providers register an app initializer that starts the watchdog, and TestBed runs it —
 * so building the configuration at all pulls in the whole service graph behind it.
 */
const authServiceStubs = () => [
  { provide: OidcSecurityService, useValue: new WipingOidcStub() },
  { provide: AbstractSecurityStorage, useValue: new StorageStub() },
  { provide: Store, useValue: { selectSignal: () => () => null, dispatch: () => undefined } },
  { provide: Router, useValue: { url: '/', navigateByUrl: () => undefined } },
  { provide: CookiesService, useValue: {} },
  {
    provide: AppStorageService,
    useValue: { writeLocal: () => undefined, readLocal: () => null, removeLocal: () => undefined },
  },
  { provide: AdminApiService, useValue: {} },
  { provide: AclStore, useValue: { loadACL: () => of(null), resources: () => null } },
  {
    provide: AppLoggerService,
    useValue: {
      for: () => ({
        error: () => undefined,
        warn: () => undefined,
        info: () => undefined,
        debug: () => undefined,
        log: () => undefined,
      }),
    },
  },
  { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: 'partner.example.com' } } } },
];

describe('provideRlbCodeBrowserOAuth — the boot restorer', () => {
  /** Whether a configuration ends up with a restorer registered at all. */
  function restorerFor(auth: AuthConfiguration) {
    TestBed.resetTestingModule();
    // The stubs come after, so they win over what the real providers register.
    TestBed.configureTestingModule({
      providers: [provideRlbCodeBrowserOAuth(auth), ...authServiceStubs()],
    });
    return TestBed.inject(RLB_BOOT_SESSION_RESTORER, null, { optional: true });
  }

  const withRenewal = (renewal: AuthConfiguration['renewal']): AuthConfiguration => ({
    ...authConfig('oauth-code-ep-retry'),
    renewal,
  });

  it('is on by default under the interceptor that owns renewal', () => {
    expect(restorerFor(authConfig('oauth-code-ep-retry'))).not.toBeNull();
  });

  it('is absent under every other interceptor', () => {
    // No watchdog runs there, so there is no snapshot-protected path to renew through.
    for (const interceptor of ['oauth-code-all', 'oauth-code-ep', 'none', undefined] as const) {
      expect(restorerFor(authConfig(interceptor)))
        .withContext(`interceptor: ${interceptor}`)
        .toBeNull();
    }
  });

  it('can be turned off', () => {
    expect(restorerFor(withRenewal({ restoreOnBoot: false }))).toBeNull();
  });

  it('survives being asked for from the constructor of the service it points back at', () => {
    // TokenRenewalService injects AuthenticationService, which injects this token. Resolving the
    // watchdog inside the factory rather than inside its methods makes that a cycle (NG0200).
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: RLB_BOOT_SESSION_RESTORER,
          useFactory: () => bootSessionRestorer(TestBed.inject(Injector)),
        },
        ...authServiceStubs(),
        { provide: RLB_CFG_AUTH, useValue: { providers: [provider(CONFIG_ID)] } },
      ],
    });

    expect(() => TestBed.inject(AuthenticationService)).not.toThrow();
  });
});
