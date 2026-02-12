import { inject, Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { lastValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  AuthConfiguration,
  EnvironmentConfiguration,
  IConfiguration,
  RLB_CFG,
  RLB_CFG_AUTH,
  RLB_CFG_ENV
} from '../../configuration';
import { AppLoggerService, AppStorageService, CookiesService, LoggerContext } from '../../services';
import { AuthActions, authsFeatureKey, BaseState } from '../../store';
import { ParseJwtService } from './parse-jwt.service';
import { AdminApiService } from "../../services/acl/user-resources.service";
import { AclStore } from "../../store/acl/acl.store";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  modal!: Window | null;
  private logger: LoggerContext;
  private readonly aclStore = inject(AclStore);

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
    @Optional() @Inject(RLB_CFG) private appconfig: IConfiguration
  ) {
    this.logger = this.log.for(this.constructor.name);
    this.logger.log('AuthenticationService initialized');
  }

  public get oidc(): OidcSecurityService {
    return this.oidcSecurityService;
  }

  get config(): AuthConfiguration {
    return this.authConfig;
  }

  get currentProvider() {
    const currentProvider = this.store.selectSignal((state) => state[authsFeatureKey].currentProvider)();
    return this.authConfig?.providers.find((provider) => provider.configId === currentProvider);
  }

  public checkAuthMultiple(url?: string | undefined): Observable<LoginResponse[]> {
    return this.oidc.checkAuthMultiple(url).pipe(
      switchMap((responses: LoginResponse[]) => {
        const authenticatedConfig = responses.find(o => o.isAuthenticated);

        if (authenticatedConfig && authenticatedConfig.configId) {

          this.store.dispatch(AuthActions.setCurrentProvider({
            currentProvider: authenticatedConfig.configId
          }));

          if (this.appconfig.acl) {
            // SignalStore methods can trigger the API call
            return this.aclStore.loadACL().pipe(
              tap(() => this.handleRedirect()),
              map(() => responses))
          } else {
            this.handleRedirect();
            return of(responses);
          }
        }

        return of(responses);
      })
    );
  }

  public login(targetUrl?: string) {
    const returnUrl = targetUrl || this.router.url || '/';
    // this.cookiesService.setCookie('loginRedirectUrl', returnUrl, 1);
    this.localStorage.writeLocal('loginRedirectUrl', returnUrl);
    this.logger.log(`call login method, loginRedirectUrl: ${returnUrl}`);
    // electron
    if (typeof (process) !== 'undefined' &&
      typeof (process?.version) !== 'undefined' &&
      typeof (process?.versions['electron']) !== undefined) {
      const urlHandler = (authUrl: string) => {
        console.log(authUrl);
        this.modal = window.open(authUrl, '_blank', 'nodeIntegration=no');
      };
      return this.oidc.authorize(this.currentProvider?.configId, { urlHandler });
    }
    // capacitor
    // else if (Capacitor.isNativePlatform()) {
    //   const urlHandler = async (url: string) => {
    //     console.log('opening', url);
    //     await Browser.open({ url, windowName: '_self' })
    //   };
    //   this.oidc.authorize(config, { urlHandler });
    // }
    // browser
    else {
      return this.oidc.authorize(this.currentProvider?.configId);
    }
  }

  async logout() {
    await lastValueFrom(this.oidc.logoff(this.currentProvider?.configId));
  }

  logout$() {
    return this.oidc.logoff(this.currentProvider?.configId);
  }

  public get userInfo$(): Observable<any> {
    return this.oidc.userData$.pipe(map((userData) => {
      const user = userData.allUserData.find(o => o.configId === this.currentProvider?.configId);
      return user ? user.userData : null;
    }));
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this.oidc.isAuthenticated$.pipe(map((isAuthenticated) => {
      // this.logger.log(`oidc isAuthenticated$ check, response: ${JSON.stringify(isAuthenticated)}; looking for isAuthenticated of ${this.currentProvider?.configId} configId`);
      return isAuthenticated.allConfigsAuthenticated.find(o => o.configId === this.currentProvider?.configId)?.isAuthenticated || false;
    }));
  }

  public get accessToken$(): Observable<string | undefined> {
    return this.oidc.getAccessToken(this.currentProvider?.configId);
  }

  public get idToken$(): Observable<string | undefined> {
    return this.oidc.getIdToken(this.currentProvider?.configId);
  }

  public get refreshToken$(): Observable<string | undefined> {
    return this.oidc.getRefreshToken(this.currentProvider?.configId);
  }

  public get roles$(): Observable<string[]> {
    return this.accessToken$.pipe(
      map((token) => (this.parseJwtService.parseJwt(token))),
      map((payload) => payload['roles'] as string[]),
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
