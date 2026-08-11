import { DOCUMENT } from '@angular/common';
import { Injectable, Type, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, of } from 'rxjs';
import { ProviderConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppLoggerService, AppStorageService, CookiesService } from '../../services';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { AclStore } from '../../store/acl/acl.store';
import { AuthenticationService } from './auth.service';

const DASHBOARD = { configId: 'dashboard-realm', domains: ['app.example.com'] } as ProviderConfiguration;
const PARTNER = { configId: 'partner-realm', domains: ['partner.example.com'] } as ProviderConfiguration;

// isDevMode() is true under Karma, so both branches need a subclass to pin it either way.
@Injectable()
class DevAuthService extends AuthenticationService {
  protected override isDevelopmentMode(): boolean {
    return true;
  }
}

@Injectable()
class ProdAuthService extends AuthenticationService {
  protected override isDevelopmentMode(): boolean {
    return false;
  }
}

describe('AuthenticationService — provider resolution', () => {
  let storedProvider: WritableSignal<string | null>;
  let oidc: jasmine.SpyObj<OidcSecurityService>;
  let errors: string[];

  /** Builds the service on a given hostname, provider list and store state. */
  function build(options: {
    hostname: string;
    providers?: ProviderConfiguration[];
    stored?: string | null;
    devMode?: boolean;
  }): AuthenticationService {
    storedProvider = signal(options.stored ?? null);
    errors = [];

    oidc = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', [
      'authorize',
      'logoff',
      'getAccessToken',
      'getIdToken',
      'getRefreshToken',
    ]);
    oidc.getAccessToken.and.returnValue(of('access-token'));
    oidc.getIdToken.and.returnValue(of('id-token'));
    oidc.getRefreshToken.and.returnValue(of('refresh-token'));
    oidc.logoff.and.returnValue(of(null));
    (oidc as any).isAuthenticated$ = of({
      allConfigsAuthenticated: [
        { configId: 'dashboard-realm', isAuthenticated: true },
        { configId: 'partner-realm', isAuthenticated: true },
      ],
    });
    (oidc as any).userData$ = of({
      allUserData: [{ configId: 'partner-realm', userData: { name: 'partner' } }],
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DevAuthService,
        ProdAuthService,
        { provide: OidcSecurityService, useValue: oidc },
        { provide: Store, useValue: { selectSignal: () => storedProvider, dispatch: () => undefined } },
        { provide: Router, useValue: { url: '/', navigateByUrl: () => undefined } },
        { provide: CookiesService, useValue: {} },
        { provide: AppStorageService, useValue: { writeLocal: () => undefined, readLocal: () => null, removeLocal: () => undefined } },
        { provide: AdminApiService, useValue: {} },
        { provide: AclStore, useValue: { loadACL: () => of(null), resources: () => null } },
        {
          provide: AppLoggerService,
          useValue: {
            for: () => ({
              error: (...args: any[]) => errors.push(args.join(' ')),
              warn: () => undefined,
              info: () => undefined,
              debug: () => undefined,
              log: () => undefined,
            }),
          },
        },
        { provide: RLB_CFG_AUTH, useValue: { providers: options.providers ?? [DASHBOARD, PARTNER] } },
        { provide: DOCUMENT, useValue: { defaultView: { location: { hostname: options.hostname } } } },
      ],
    });

    const token: Type<AuthenticationService> = options.devMode ? DevAuthService : ProdAuthService;
    return TestBed.inject(token);
  }

  it('uses the configId the store settled on', async () => {
    const service = build({ hostname: 'app.example.com', stored: 'partner-realm' });

    await firstValueFrom(service.accessToken$);

    expect(service.currentProvider).toBe(PARTNER);
    expect(oidc.getAccessToken).toHaveBeenCalledWith('partner-realm');
  });

  it('resolves by hostname before the store has settled', async () => {
    const service = build({ hostname: 'partner.example.com' });

    await firstValueFrom(service.accessToken$);

    expect(oidc.getAccessToken).toHaveBeenCalledWith('partner-realm');
  });

  it('uses the only configured provider whatever the hostname', async () => {
    const service = build({ hostname: 'localhost', providers: [DASHBOARD] });

    await firstValueFrom(service.accessToken$);

    expect(oidc.getAccessToken).toHaveBeenCalledWith('dashboard-realm');
  });

  describe('when no provider matches the domain', () => {
    it('never hands the library an undefined configId', async () => {
      // The whole point: getConfig(undefined) silently returns the FIRST registered configuration,
      // so the old code read tokens from — and logged into — a realm holding none of this
      // tenant's sessions. Invisible wherever environments share a realm; only prod differs.
      const service = build({ hostname: 'retired.example.com' });

      expect(await firstValueFrom(service.accessToken$)).toBeUndefined();
      expect(oidc.getAccessToken).not.toHaveBeenCalled();
    });

    it('does not authorize against the wrong realm', () => {
      const service = build({ hostname: 'retired.example.com' });

      service.login('/somewhere');

      expect(oidc.authorize).not.toHaveBeenCalled();
    });

    it('does not log out of the wrong realm', async () => {
      const service = build({ hostname: 'retired.example.com' });

      await service.logout();

      expect(oidc.logoff).not.toHaveBeenCalled();
    });

    it('reports unauthenticated rather than borrowing another realm session', async () => {
      const service = build({ hostname: 'retired.example.com' });

      expect(await firstValueFrom(service.isAuthenticated$)).toBe(false);
      expect(await firstValueFrom(service.userInfo$)).toBeNull();
    });

    it('logs at error level, once per reason', async () => {
      const service = build({ hostname: 'retired.example.com' });

      await firstValueFrom(service.accessToken$);
      await firstValueFrom(service.idToken$);
      await firstValueFrom(service.refreshToken$);

      expect(errors.length).toBe(1);
      expect(errors[0]).toContain('retired.example.com');
    });

    it('throws in dev, where a misconfigured domain is a mistake to fix now', () => {
      const service = build({ hostname: 'retired.example.com', devMode: true });

      expect(() => service.login()).toThrowError(/retired\.example\.com/);
    });

    it('stays quiet when no providers are configured at all', async () => {
      // An app without auth is legitimate; only a domain no provider claims is a misconfiguration.
      const service = build({ hostname: 'app.example.com', providers: [], devMode: true });

      expect(await firstValueFrom(service.accessToken$)).toBeUndefined();
      expect(errors).toEqual([]);
    });
  });

  it('reads tokens and authentication state through the same configId', async () => {
    // These used to disagree: the token getters fell back to providers[0] inside the library while
    // the local find() compared against undefined and reported false.
    const service = build({ hostname: 'partner.example.com' });

    expect(await firstValueFrom(service.isAuthenticated$)).toBe(true);
    expect(await firstValueFrom(service.userInfo$)).toEqual({ name: 'partner' });
    expect(oidc.getAccessToken).not.toHaveBeenCalledWith(undefined as any);
  });
});
