import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ProviderConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppLoggerService } from '../../services/apps/app-logger.service';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { CookiesService } from '../../services/utils/cookies.service';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { AclStore } from '../../store/acl/acl.store';
import { BootSessionRestorer, RLB_BOOT_SESSION_RESTORER } from '../renewal/boot-session-restore';
import { AuthenticationService } from './auth.service';

const PARTNER = {
  configId: 'partner-realm',
  domains: ['partner.example.com'],
  acl: { endpointKey: 'partner', path: 'acl/resources' },
} as ProviderConfiguration;

const DASHBOARD = {
  configId: 'dashboard-realm',
  domains: ['app.example.com'],
} as ProviderConfiguration;

/** What the library reports for a config it considers signed out. */
const signedOut = (configId: string): LoginResponse =>
  ({ configId, isAuthenticated: false, accessToken: '', idToken: '', userData: null }) as LoginResponse;

/**
 * Startup on the partner host, with the library reporting `responses` and the watchdog standing in
 * for whatever the restorer would do.
 */
function build(options: {
  responses: LoginResponse[];
  restorer?: Partial<BootSessionRestorer> | null;
}) {
  const oidc = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', [
    'checkAuthMultiple',
  ]);
  oidc.checkAuthMultiple.and.returnValue(of(options.responses));

  const restorer =
    options.restorer === null
      ? null
      : jasmine.createSpyObj<BootSessionRestorer>(
          'BootSessionRestorer',
          { canRestore: true, refresh: of('restored-access-token') },
          {},
        );
  if (restorer && options.restorer) Object.assign(restorer, options.restorer);

  const dispatch = jasmine.createSpy('dispatch');
  const loadACL = jasmine.createSpy('loadACL').and.returnValue(of(null));
  const navigateByUrl = jasmine.createSpy('navigateByUrl');

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AuthenticationService,
      { provide: OidcSecurityService, useValue: oidc },
      { provide: Store, useValue: { selectSignal: () => () => null, dispatch } },
      { provide: Router, useValue: { url: '/', navigateByUrl } },
      { provide: CookiesService, useValue: {} },
      {
        provide: AppStorageService,
        useValue: { writeLocal: () => undefined, readLocal: () => null, removeLocal: () => undefined },
      },
      { provide: AdminApiService, useValue: {} },
      { provide: AclStore, useValue: { loadACL, resources: () => null } },
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
      { provide: RLB_CFG_AUTH, useValue: { providers: [DASHBOARD, PARTNER] } },
      {
        provide: DOCUMENT,
        useValue: { defaultView: { location: { hostname: 'partner.example.com' } } },
      },
      ...(restorer ? [{ provide: RLB_BOOT_SESSION_RESTORER, useValue: restorer }] : []),
    ],
  });

  return {
    service: TestBed.inject(AuthenticationService),
    restorer,
    dispatch,
    loadACL,
  };
}

describe('AuthenticationService — restoring a session at startup', () => {
  it('renews when the stored access token expired while the browser was closed', async () => {
    // The whole feature: the library reports signed out because it only ever reads storage, and the
    // refresh token next to the expired one is never tried. Without this the user goes to the login
    // host and stays signed in only for as long as its SSO cookie outlives the tab.
    const { service, restorer, dispatch, loadACL } = build({
      responses: [signedOut('dashboard-realm'), signedOut('partner-realm')],
    });

    const responses = await firstValueFrom(service.checkAuthMultiple());

    expect(restorer!.refresh).toHaveBeenCalledTimes(1);
    expect(responses.find(r => r.configId === 'partner-realm')).toEqual(
      jasmine.objectContaining({ isAuthenticated: true, accessToken: 'restored-access-token' }),
    );
    // Everything downstream must treat it as an ordinary authenticated startup.
    expect(dispatch).toHaveBeenCalled();
    expect(loadACL).toHaveBeenCalledWith(PARTNER.acl);
    await expectAsync(firstValueFrom(service.authenticated$)).toBeResolved();
  });

  it('leaves the other realms alone', async () => {
    // Only the provider this domain resolves to was renewed; marking the rest would hand the shell
    // a session on a realm holding none of this tenant's tokens.
    const { service } = build({
      responses: [signedOut('dashboard-realm'), signedOut('partner-realm')],
    });

    const responses = await firstValueFrom(service.checkAuthMultiple());

    expect(responses.find(r => r.configId === 'dashboard-realm')?.isAuthenticated).toBeFalse();
  });

  it('starts as a guest when the refresh token is rejected', async () => {
    const { service, dispatch, loadACL } = build({
      responses: [signedOut('partner-realm')],
      restorer: { refresh: () => throwError(() => new Error('refresh rejected')) },
    });

    const responses = await firstValueFrom(service.checkAuthMultiple());

    // Unchanged, and the startup still completed: a dead session is not a failed bootstrap.
    expect(responses.every(r => !r.isAuthenticated)).toBeTrue();
    expect(loadACL).toHaveBeenCalledWith(undefined);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('treats a renewal that resolves without a token as a failure', async () => {
    // The shape a wipe leaves behind: the library resolves, but there is no token in it.
    const { service, loadACL } = build({
      responses: [signedOut('partner-realm')],
      restorer: { refresh: () => of('') },
    });

    const responses = await firstValueFrom(service.checkAuthMultiple());

    expect(responses.every(r => !r.isAuthenticated)).toBeTrue();
    expect(loadACL).toHaveBeenCalledWith(undefined);
  });

  it('spends nothing when storage holds no refresh token', async () => {
    const { service, restorer } = build({
      responses: [signedOut('partner-realm')],
      restorer: { canRestore: () => false },
    });

    await firstValueFrom(service.checkAuthMultiple());

    expect(restorer!.refresh).not.toHaveBeenCalled();
  });

  it('does not renew alongside a code exchange', async () => {
    // A callback page: the library has just exchanged the code and says so. Renewing here would
    // spend a refresh token the exchange has only this second issued.
    const { service, restorer } = build({
      responses: [
        { ...signedOut('partner-realm'), isAuthenticated: true, accessToken: 'fresh' } as LoginResponse,
      ],
    });

    await firstValueFrom(service.checkAuthMultiple());

    expect(restorer!.refresh).not.toHaveBeenCalled();
    expect(restorer!.canRestore).not.toHaveBeenCalled();
  });

  it('behaves as it always did where nothing provides a restorer', async () => {
    // Every interceptor other than 'oauth-code-ep-retry': no watchdog exists, so the injection is
    // absent and the startup is the one those consumers have today.
    const { service, loadACL } = build({
      responses: [signedOut('partner-realm')],
      restorer: null,
    });

    const responses = await firstValueFrom(service.checkAuthMultiple());

    expect(responses.every(r => !r.isAuthenticated)).toBeTrue();
    expect(loadACL).toHaveBeenCalledWith(undefined);
  });
});
