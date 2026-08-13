import { DOCUMENT } from '@angular/common';
import { inject, Inject, Injectable, isDevMode, Optional, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import {
  catchError,
  EMPTY,
  lastValueFrom,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  tap,
} from 'rxjs';
import {
  AuthConfiguration,
  AuthUrlHandler,
  EnvironmentConfiguration,
  IConfiguration,
  RLB_AUTH_URL_HANDLER,
  RLB_CFG,
  RLB_CFG_AUTH,
  RLB_CFG_ENV,
} from '../../configuration';
import { AppLoggerService, AppStorageService, CookiesService, LoggerContext } from '../../services';
import { AuthActions, authsFeatureKey, BaseState } from '../../store';
import { ParseJwtService } from './parse-jwt.service';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { AclStore } from '../../store/acl/acl.store';
import {
  describeProviderResolutionFailure,
  ProviderResolution,
  resolveProvider,
} from './provider-resolution';
// Imported from the file rather than the renewal barrel: that barrel also exports the watchdog,
// which imports this service, and the cycle would be back.
import { BootSessionRestorer, RLB_BOOT_SESSION_RESTORER } from '../renewal/boot-session-restore';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  modal!: Window | null;
  private logger: LoggerContext;
  private readonly aclStore = inject(AclStore);
  private readonly document = inject(DOCUMENT);
  private readonly _authReady$ = new ReplaySubject<void>(1);
  public readonly authReady$ = this._authReady$.asObservable();
  private readonly _authenticated$ = new ReplaySubject<void>(1);
  public readonly authenticated$ = this._authenticated$.asObservable();

  /** Reasons already reported, so a broken configuration logs once instead of once per call. */
  private readonly reportedFailures = new Set<string>();

  private storedProviderId!: Signal<string | null | undefined>;

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private cookiesService: CookiesService,
    private router: Router,
    private readonly parseJwtService: ParseJwtService,
    private readonly store: Store<BaseState>,
    private readonly log: AppLoggerService,
    private readonly localStorage: AppStorageService,
    private readonly adminApi: AdminApiService,
    @Optional() @Inject(RLB_CFG_ENV) private envConfig: EnvironmentConfiguration,
    @Optional() @Inject(RLB_CFG_AUTH) private authConfig: AuthConfiguration,
    @Optional() @Inject(RLB_CFG) private appconfig: IConfiguration,
    @Optional() @Inject(RLB_AUTH_URL_HANDLER) private authUrlHandler: AuthUrlHandler | null,
    @Optional() @Inject(RLB_BOOT_SESSION_RESTORER) private bootRestorer: BootSessionRestorer | null,
  ) {
    this.logger = this.log.for(this.constructor.name);
    this.storedProviderId = this.store.selectSignal(
      state => state[authsFeatureKey].currentProvider,
    );
    this.logger.log('AuthenticationService initialized');
  }

  public get oidc(): OidcSecurityService {
    return this.oidcSecurityService;
  }

  get config(): AuthConfiguration {
    return this.authConfig;
  }

  private get hostname(): string {
    return this.document.defaultView?.location.hostname ?? '';
  }

  /** A method rather than a field, so specs can override it to exercise the production branch. */
  protected isDevelopmentMode(): boolean {
    return isDevMode();
  }

  private resolve(): ProviderResolution {
    return resolveProvider(this.authConfig?.providers, this.storedProviderId(), this.hostname);
  }

  /**
   * The provider this page is using, or undefined when none resolves.
   *
   * Read speculatively — from templates, and from `KeycloakProfileService` for its base URL — so it
   * stays quiet and never throws. {@link resolvedConfigId} is the loud path.
   */
  get currentProvider() {
    return this.resolve().provider;
  }

  /**
   * The configId to hand the OIDC library, or undefined when none resolves.
   *
   * Never returns undefined *to the library*: callers must skip the call instead. Passing undefined
   * makes `getConfig` fall back to the first registered configuration, so on a domain whose
   * provider failed to resolve every token read, login and logout would silently target a different
   * realm — one holding none of this tenant's tokens. That is invisible wherever environments share
   * a realm (dev, staging) and only bites in production, which is exactly how it reached production.
   *
   * A misconfigured domain throws in dev and logs at error level in prod. Having no providers at
   * all is not a misconfiguration — it is an app without auth — so that stays silent.
   */
  private resolvedConfigId(operation: string): string | undefined {
    const resolution = this.resolve();
    if (resolution.provider) return resolution.provider.configId;
    if (resolution.reason === 'no-providers') return undefined;

    const message = describeProviderResolutionFailure(
      resolution,
      this.hostname,
      this.authConfig?.providers,
      operation,
    );
    if (this.isDevelopmentMode()) throw new Error(message);

    if (!this.reportedFailures.has(resolution.reason)) {
      this.reportedFailures.add(resolution.reason);
      this.logger.error(message);
    }
    return undefined;
  }

  public checkAuthMultiple(url?: string | undefined): Observable<LoginResponse[]> {
    return this.oidc.checkAuthMultiple(url).pipe(
      switchMap(responses => this.restoreSessionIfPossible(responses)),
      switchMap((responses: LoginResponse[]) => {
        let authenticatedConfig = responses.find(o => o.isAuthenticated);

        if (authenticatedConfig && authenticatedConfig.configId) {
          this.store.dispatch(
            AuthActions.setCurrentProvider({ currentProvider: authenticatedConfig.configId }),
          );
          const activeProviderConfig = this.authConfig?.providers.find(
            p => p.configId === authenticatedConfig?.configId,
          );
          return this.aclStore.loadACL(activeProviderConfig?.acl).pipe(
            tap(() => this.handleRedirect()),
            map(() => responses),
          );
        } else {
          // GUEST/ANONYMOUS USER: Trigger loadACL with undefined.
          return this.aclStore.loadACL(undefined).pipe(map(() => responses));
        }
      }),
      tap({
        next: (responses) => {
          this._authReady$.next();
          if (responses.some(r => r.isAuthenticated)) {
            this._authenticated$.next();
          }
          this._authenticated$.complete();
        },
        error: () => {
          this._authReady$.next();
          this._authenticated$.complete();
        },
      }),
    );
  }

  /**
   * One renewal before a startup with expired tokens is called a guest session.
   *
   * The library decides authentication by reading storage: an expired access token is
   * unauthenticated, and the refresh token sitting next to it is never tried. That is fine while a
   * tab stays open — the watchdog renews long before expiry — but a browser that was closed comes
   * back past it every time, and the user is sent to the login host to be recognised by its SSO
   * cookie. Once that cookie is gone they get a login form, holding a refresh token that would
   * have worked. Renewing here is what makes `offline_access` mean anything.
   *
   * Only reached when nothing is authenticated, so a callback page — where the library has just
   * exchanged a code and says so — is left alone, and no refresh runs alongside that exchange.
   * A success is indistinguishable from an ordinary authenticated startup downstream: the same ACL
   * load, the same redirect handling, the same `authenticated$`, and so the watchdog starts as
   * usual. A failure leaves the startup as it would have been, with the refresh token restored by
   * the path in {@link BootSessionRestorer.refresh}.
   *
   * This runs inside the app initializer, so it is finished before the router's first navigation
   * and no guard can see the in-between state — true while the host leaves initial navigation on
   * its default, and worth knowing before turning that off.
   */
  private restoreSessionIfPossible(responses: LoginResponse[]): Observable<LoginResponse[]> {
    if (responses.some(response => response.isAuthenticated)) return of(responses);

    // Quiet resolution: the store has nothing in it this early, so this is the hostname match, and
    // a domain no provider claims is already reported by every other path.
    const provider = this.currentProvider;
    if (!provider || !this.bootRestorer?.canRestore()) return of(responses);

    this.logger.log('access token expired at startup, renewing from the stored refresh token');
    return this.bootRestorer.refresh().pipe(
      map(token => {
        // An empty token means the renewal resolved without one, which is a failure like any other.
        if (!token) return responses;

        this.logger.log('session restored without a trip to the login host');
        return responses.map(response =>
          response.configId === provider.configId
            ? { ...response, isAuthenticated: true, accessToken: token }
            : response,
        );
      }),
      // The startup must finish either way: a rejected refresh token is a guest session, not a
      // failed bootstrap.
      catchError(() => of(responses)),
    );
  }

  public login(targetUrl?: string) {
    const configId = this.resolvedConfigId('login');
    // No provider means no realm to send the user to. Authorizing anyway would use whichever
    // configuration is registered first and bring them back still unauthenticated, which reads as
    // an endless login loop rather than as the configuration error it is.
    if (!configId) return;

    const returnUrl = targetUrl || this.router.url || '/';
    this.localStorage.writeLocal('loginRedirectUrl', returnUrl);
    this.logger.log(`call login method, loginRedirectUrl: ${returnUrl}`);

    const urlHandler = this.electronUrlHandler ?? this.authUrlHandler;
    if (urlHandler) {
      return this.oidc.authorize(configId, { urlHandler });
    }
    return this.oidc.authorize(configId);
  }

  private get electronUrlHandler(): AuthUrlHandler | null {
    const proc = (globalThis as any)['process'];
    if (proc?.version !== undefined && proc?.versions?.['electron'] !== undefined) {
      return (authUrl: string) => {
        this.modal = window.open(authUrl, '_blank', 'nodeIntegration=no');
      };
    }
    return null;
  }

  async logout() {
    const configId = this.resolvedConfigId('logout');
    // Guarded before lastValueFrom: an EMPTY logoff would reject with EmptyError.
    if (!configId) return;
    await lastValueFrom(this.oidc.logoff(configId));
  }

  logout$() {
    const configId = this.resolvedConfigId('logout');
    if (!configId) return EMPTY;
    return this.oidc.logoff(configId);
  }

  public get userInfo$(): Observable<any> {
    const configId = this.resolvedConfigId('userInfo$');
    if (!configId) return of(null);

    return this.oidc.userData$.pipe(
      map(userData => {
        const user = userData.allUserData.find(o => o.configId === configId);
        return user ? user.userData : null;
      }),
    );
  }

  public get isAuthenticated$(): Observable<boolean> {
    const configId = this.resolvedConfigId('isAuthenticated$');
    if (!configId) return of(false);

    return this.oidc.isAuthenticated$.pipe(
      map(
        isAuthenticated =>
          isAuthenticated.allConfigsAuthenticated.find(o => o.configId === configId)
            ?.isAuthenticated || false,
      ),
    );
  }

  public get accessToken$(): Observable<string | undefined> {
    const configId = this.resolvedConfigId('accessToken$');
    return configId ? this.oidc.getAccessToken(configId) : of(undefined);
  }

  public get idToken$(): Observable<string | undefined> {
    const configId = this.resolvedConfigId('idToken$');
    return configId ? this.oidc.getIdToken(configId) : of(undefined);
  }

  public get refreshToken$(): Observable<string | undefined> {
    const configId = this.resolvedConfigId('refreshToken$');
    return configId ? this.oidc.getRefreshToken(configId) : of(undefined);
  }

  public get roles$(): Observable<string[]> {
    return this.accessToken$.pipe(
      map(token => this.parseJwtService.parseJwt(token)),
      map(payload => payload['roles'] as string[]),
    );
  }

  public matchRoles(roles: string[]): Observable<boolean> {
    return this.accessToken$.pipe(
      map(token => this.parseJwtService.parseJwt(token)),
      map(payload => payload['roles'] as string[]),
      map(userRoles => roles.some(role => userRoles.includes(role))),
    );
  }

  private handleRedirect() {
    const redirect = this.localStorage.readLocal('loginRedirectUrl');
    if (redirect) {
      this.localStorage.removeLocal('loginRedirectUrl');
      setTimeout(() => {
        this.router.navigateByUrl(redirect, { replaceUrl: true });
      }, 0);
    }
  }
}
