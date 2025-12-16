import { Inject, Injectable, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoginResponse, OidcSecurityService , OpenIdConfiguration} from 'angular-auth-oidc-client';
import { lastValueFrom, map, Observable, tap } from 'rxjs';
import { AuthConfiguration, EnvironmentConfiguration, RLB_CFG_AUTH, RLB_CFG_ENV } from '../../configuration';
import { AppLoggerService, CookiesService, LoggerContext } from '../../services';
import { AuthActions, authsFeatureKey, BaseState } from '../../store';
import { ParseJwtService } from './parse-jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  modal!: Window | null;
  private logger: LoggerContext;

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private cookiesService: CookiesService,
    private router: Router,
    private readonly parseJwtService: ParseJwtService,
    private readonly store: Store<BaseState>,
    private readonly log: AppLoggerService,
    @Optional() @Inject(RLB_CFG_ENV) private envConfig: EnvironmentConfiguration,
    @Optional() @Inject(RLB_CFG_AUTH) private authConfig: AuthConfiguration
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
    // if (Capacitor.isNativePlatform()) {
    //   console.log('Capacitor is native platform')
    //   App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
    //     await this.zone.run(async () => {
    //       const _url = `${environment.baseUrl}/${url.slice(url.indexOf('?'))}`
    //       this.authorize(_url).subscribe();
    //     })
    //   });
    // } else {
    return this.oidc.checkAuthMultiple(url)
      .pipe(tap(data => {
        this.logger.warn(`oidc checkAuthMultiple check, response: ${JSON.stringify(data)}; looking for at least one isAuthenticated`);
        const authenticatedConfig = data.find(o => o.isAuthenticated);
        if (authenticatedConfig && authenticatedConfig.configId) {
          this.logger.info(`User is authenticated with provider: ${authenticatedConfig.configId}. Updating Store.`);

          // first dispatch to prevent recalculate in apps service
          this.store.dispatch(AuthActions.setCurrentProvider({
            currentProvider: authenticatedConfig.configId
          }));

          // Redirect logic -> clean query params
          const redirect = this.cookiesService.getCookie('loginRedirectUrl');
          this.logger.info(`Correct provider dispatched, redirectUrl: ${redirect}`);
          if (redirect) {
            this.cookiesService.deleteCookie('loginRedirectUrl');
            this.router.navigate([redirect], { queryParams: {} });
          } else {
            this.router.navigate([], {
              queryParams: {},
              replaceUrl: true,
              relativeTo: this.router.routerState.root
            });
          }
        } else {
          this.logger.warn(`No authenticatedConfig found for ${url}`);
        }

        // if (data.some(o => o.isAuthenticated)) {
        //   const redirect = this.cookiesService.getCookie('loginRedirectUrl');
        //   if (redirect) {
        //     this.cookiesService.deleteCookie('loginRedirectUrl');
        //     this.router.navigate([redirect]);
        //   }
        // }
      }));
    //}
  }

  public login() {
    this.cookiesService.setCookie('loginRedirectUrl', this.router.url || '/', 1);
    this.logger.log(`call login method, loginRedirectUrl: ${this.router.url || '/'}`);
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
      this.logger.warn(`oidc isAuthenticated$ check, response: ${JSON.stringify(isAuthenticated)}; looking for isAuthenticated of ${this.currentProvider?.configId} configId`);
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

}
