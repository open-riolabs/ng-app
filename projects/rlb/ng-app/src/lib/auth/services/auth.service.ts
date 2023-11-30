import { Injectable, NgZone } from '@angular/core'
import { Router } from '@angular/router'
import { map, Observable } from 'rxjs'
import { OidcSecurityService } from 'angular-auth-oidc-client'
import { CookiesService } from '../../services'
import { UserInfo } from '../user-info'

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
    private router: Router) {

    // if (Capacitor.isNativePlatform()) {
    //   console.log('Capacitor is native platform')
    //   App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
    //     await this.zone.run(async () => {
    //       const _url = `${environment.baseUrl}/${url.slice(url.indexOf('?'))}`
    //       const [{ accessToken, idToken, isAuthenticated, userData }] = await lastValueFrom(this.oidcSecurityService.checkAuthMultiple(_url))
    //       if (isAuthenticated) {
    //         this._currentUser = userData
    //         this._isAuthenticated = isAuthenticated
    //         this._accessToken = accessToken
    //         this._idToken = idToken
    //         const redirect = cookiesService.getCookie('loginRedirectUrl') || '/'
    //         cookiesService.deleteCookie('loginRedirectUrl')
    //         await this.router.navigate([redirect])
    //       }
    //     })
    //   });
    // } else {
    oidcSecurityService.checkAuthMultiple().subscribe(([{ isAuthenticated, userData, accessToken, idToken }]) => {
      if (isAuthenticated) {
        const redirect = cookiesService.getCookie('loginRedirectUrl') || '/'
        cookiesService.deleteCookie('loginRedirectUrl')
        this.router.navigate([redirect])
      }
      this._currentUser = userData
      this._isAuthenticated = isAuthenticated
      this._accessToken = accessToken
      this._idToken = idToken
    });
    //}

  }

  public get isAuthenticated$(): Observable<boolean> {
    return this.oidcSecurityService.isAuthenticated$.pipe(map(o => o.isAuthenticated))
  }

  public login(config: string) {
    this.cookiesService.setCookie('loginRedirectUrl', this.router.url, 1)
    // electron
    if (typeof (process) !== 'undefined' &&
      typeof (process?.version) !== 'undefined' &&
      typeof (process?.versions['electron']) !== undefined) {
      const urlHandler = (authUrl: string) => {
        console.log(authUrl)
        this.modal = window.open(authUrl, '_blank', 'nodeIntegration=no');
      };
      return this.oidcSecurityService.authorize(config, { urlHandler });
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
      this.oidcSecurityService.authorize(config);
    }
  }

  logout() {
    this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
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
