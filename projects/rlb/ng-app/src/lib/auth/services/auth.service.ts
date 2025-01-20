import { Inject, Injectable, NgZone, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { CookiesService } from '../../services';
import { AuthConfiguration, EnvironmentConfiguration, RLB_CFG_AUTH, RLB_CFG_ENV } from '../../configuration';
import { ParseJwtService } from './parse-jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService implements OnInit {
  modal!: Window | null;
  private authSnapshot: { isAuthenticated: boolean; userData: any; accessToken?: string; idToken?: string; refreshToken?: string; } =
    { isAuthenticated: false, userData: null, accessToken: undefined, idToken: undefined, refreshToken: undefined, };

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private cookiesService: CookiesService,
    private router: Router,
    private readonly parseJwtService: ParseJwtService,
    @Optional() @Inject(RLB_CFG_ENV) private envConfig: EnvironmentConfiguration,
    @Optional() @Inject(RLB_CFG_AUTH) private authConfig: AuthConfiguration
  ) {

  }

  ngOnInit() {
    this.oidcSecurityService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.authSnapshot.isAuthenticated = isAuthenticated;
    });

    this.oidcSecurityService.userData$.subscribe(({ userData }) => {
      this.authSnapshot.userData = userData;
    });

    this.oidcSecurityService.getAccessToken().subscribe((accessToken) => {
      this.authSnapshot.accessToken = accessToken;
    });

    this.oidcSecurityService.getIdToken().subscribe((idToken) => {
      this.authSnapshot.idToken = idToken;
    });

    this.oidcSecurityService.getRefreshToken().subscribe((refreshToken) => {
      this.authSnapshot.refreshToken = refreshToken;
    });
  }

  public authorize(url?: string | undefined): Observable<LoginResponse[]> {
    // if (Capacitor.isNativePlatform()) {
    //   console.log('Capacitor is native platform')
    //   App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
    //     await this.zone.run(async () => {
    //       const _url = `${environment.baseUrl}/${url.slice(url.indexOf('?'))}`
    //       this.authorize(_url).subscribe();
    //     })
    //   });
    // } else {
    return this.oidcSecurityService.checkAuthMultiple(url)
      .pipe(tap(([{ isAuthenticated, userData, accessToken, idToken }]) => {
        if (isAuthenticated) {
          const redirect = this.cookiesService.getCookie('loginRedirectUrl');
          if (redirect) {
            this.cookiesService.deleteCookie('loginRedirectUrl');
            this.router.navigate([redirect]);
          }
        }
      }));
    //}
  }

  public login() {
    this.cookiesService.setCookie('loginRedirectUrl', this.router.url || '/', 1);
    // electron
    if (typeof (process) !== 'undefined' &&
      typeof (process?.version) !== 'undefined' &&
      typeof (process?.versions['electron']) !== undefined) {
      const urlHandler = (authUrl: string) => {
        console.log(authUrl);
        this.modal = window.open(authUrl, '_blank', 'nodeIntegration=no');
      };
      return this.oidcSecurityService.authorize(this.authConfig?.configId, { urlHandler });
    }
    // capacitor
    // else if (Capacitor.isNativePlatform()) {
    //   const urlHandler = async (url: string) => {
    //     console.log('opening', url);
    //     await Browser.open({ url, windowName: '_self' })
    //   };
    //   this.oidcSecurityService.authorize(config, { urlHandler });
    // }
    // browser
    else {
      return this.oidcSecurityService.authorize(this.authConfig?.configId);
    }
  }

  logout() {
    this.oidcSecurityService.logoff(this.authConfig?.configId).subscribe((result) => console.log(result));
  }

  logout$() {
    return this.oidcSecurityService.logoff(this.authConfig?.configId);
  }

  public get userInfo$(): Observable<any> {
    return this.oidcSecurityService.userData$.pipe(map((userData) => userData.userData));
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated$.pipe(map((isAuthenticated) => isAuthenticated.isAuthenticated));
  }

  public get accessToken$(): Observable<string | undefined> {
    return this.oidcSecurityService.getAccessToken();
  }

  public get idToken$(): Observable<string | undefined> {
    return this.oidcSecurityService.getIdToken();
  }

  public get refreshToken$(): Observable<string | undefined> {
    return this.oidcSecurityService.getRefreshToken();
  }

  public get oidc(): OidcSecurityService {
    return this.oidcSecurityService;
  }

  public get snapshot() {
    return this.authSnapshot;
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
