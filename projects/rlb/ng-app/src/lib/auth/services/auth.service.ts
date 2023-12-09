import { Inject, Injectable, NgZone, Optional } from '@angular/core'
import { Router } from '@angular/router'
import { map, Observable, tap } from 'rxjs'
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client'
import { CookiesService } from '../../services'
import { UserInfo } from '../user-info'
import { AuthConfiguration, EnvironmentConfiguration, RLB_CFG_AUTH, RLB_CFG_ENV } from '../../configuration'

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  modal!: Window | null;

  private _currentUser!: UserInfo
  private _isAuthenticated!: boolean
  private _accessToken!: string
  private _idToken!: string

  constructor(
    private oidcSecurityService: OidcSecurityService,
    private cookiesService: CookiesService,
    private zone: NgZone,
    private router: Router,
    @Optional() @Inject(RLB_CFG_ENV) private envConfig: EnvironmentConfiguration,
    @Optional() @Inject(RLB_CFG_AUTH) private authConfig: AuthConfiguration
  ) {
    this.init()
  }

  public init() {
    if (this.envConfig?.featursMode !== 'store') {
      // if (Capacitor.isNativePlatform()) {
      //   console.log('Capacitor is native platform')
      //   App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
      //     await this.zone.run(async () => {
      //       const _url = `${environment.baseUrl}/${url.slice(url.indexOf('?'))}`
      //       this.authorize(_url).subscribe();
      //     })
      //   });
      // } else {
      this.authorize().subscribe();
      //}
    }
  }


  public authorize(url?: string | undefined): Observable<LoginResponse[]> {
    return this.oidcSecurityService.checkAuthMultiple(url)
      .pipe(tap(([{ isAuthenticated, userData, accessToken, idToken }]) => {
        if (isAuthenticated) {
          const redirect = this.cookiesService.getCookie('loginRedirectUrl') || '/'
          this.cookiesService.deleteCookie('loginRedirectUrl')
          this.router.navigate([redirect])
        }
        this._currentUser = userData
        this._isAuthenticated = isAuthenticated
        this._accessToken = accessToken
        this._idToken = idToken
      }))
  }

  public get isAuthenticated$(): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated$.pipe(map(o => o.isAuthenticated))
  }

  public login() {
    this.cookiesService.setCookie('loginRedirectUrl', this.router.url, 1)
    // electron
    if (typeof (process) !== 'undefined' &&
      typeof (process?.version) !== 'undefined' &&
      typeof (process?.versions['electron']) !== undefined) {
      const urlHandler = (authUrl: string) => {
        console.log(authUrl)
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
    return this.oidcSecurityService.logoff(this.authConfig?.configId)
  }

  public get currentUser$(): Observable<UserInfo> {
    return this.oidcSecurityService.userData$.pipe(map(o => o.userData))
  }

  public get snapshot() {
    return {
      isAuthenticated: this._isAuthenticated,
      userData: this._currentUser,
      accessToken: this._accessToken,
      idToken: this._idToken
    }
  }
}
