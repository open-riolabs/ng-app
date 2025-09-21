import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';
import { AuthenticationService } from './auth.service';

const SESSION_RT = 'RT';
const SESSION_AT = 'AT';
const TOKEN_URL = `protocol/openid-connect/token`;

export interface Token {
  access_token: string | null;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string | null;
  refresh_token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OauthPasswordService implements HttpInterceptor {

  private timer: any = null;
  private _onUpdateToken: ((token: string | null) => void) | null = null;
  //private _user: User | null = null

  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticationService: AuthenticationService) {
    this.initRefreshToken().catch(e => console.error("Error in refresh token", e));
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authenticationService.config.allowedUrls.some(o => req.url.includes(o))) {
      const token = this.access_token;
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }
    return next.handle(req);
  }

  private get access_token() {
    const r = sessionStorage.getItem(SESSION_AT);
    return typeof r === 'string' && r !== '' ? r : null;
  }

  private set access_token(val: string | null) {
    if (val === undefined || val === null || val === '')
      sessionStorage.removeItem(SESSION_AT);
    else
      sessionStorage.setItem(SESSION_AT, val);
  }

  private get refresh_token() {
    const r = sessionStorage.getItem(SESSION_RT);
    return typeof r === 'string' && r !== '' ? r : null;
  }

  private set refresh_token(val: string | null) {
    if (val === undefined || val === null || val === '')
      sessionStorage.removeItem(SESSION_RT);
    else
      sessionStorage.setItem(SESSION_RT, val);
  }

  public get accessToken() {
    return this.access_token;
  }

  // public get user() {
  //   return this._user
  // }

  public set onUpdateToken(v: ((token: string | null) => void) | null) {
    this._onUpdateToken = v;
  }

  public async login(username: string, password: string) {
    const t = await this._login(username, password);
    this.refresh_token = t.refresh_token;
    this.access_token = t.access_token;
    if (typeof this._onUpdateToken === 'function') {
      this._onUpdateToken(this.access_token);
    }
    // if (this._user === null) {
    //   this._user = await lastValueFrom(this.users.apiV1UsersGetSelfGet())
    // }
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.timer = setInterval(async () => {
      try {
        var r = await this._refreshToken(this.refresh_token);
        this.refresh_token = r.refresh_token;
        this.access_token = r.access_token;
        if (typeof this._onUpdateToken === 'function') {
          this._onUpdateToken(this.access_token);
        }
        // if (this._user === null) {
        //   this._user = await lastValueFrom(this.users.apiV1UsersGetSelfGet())
        // }
      }
      catch (e) {
        console.warn("Refresh token fail");
      }
    }, t.expires_in * 1000 - 60000);
    return t;
  }

  public loggedIn() {
    return !!this.access_token;
  }

  public logout() {
    this.refresh_token = null;
    this.access_token = null;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async _login(username: string, password: string): Promise<Token> {
    if (!this.authenticationService.currentProvider) throw new Error("No authentication provider configured");
    let body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', 'addubby');
    body.set('scope', 'addubby-order');
    body.set('username', username);
    body.set('password', password);
    return await lastValueFrom(this.httpClient.post<Token>(`${this.authenticationService.currentProvider.issuer}/${TOKEN_URL}`, body.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    }));
  }

  private async _refreshToken(token: string | null): Promise<Token> {
    if (!this.authenticationService.currentProvider) throw new Error("No authentication provider configured");
    let body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', this.authenticationService.currentProvider.clientId);
    if (token)
      body.set('refresh_token', token);
    return await lastValueFrom(this.httpClient.post<Token>(`${this.authenticationService.currentProvider.issuer}/${TOKEN_URL}`, body.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    }));
  }

  private async initRefreshToken() {
    if (this.refresh_token) {
      var r = await this._refreshToken(this.refresh_token);
      this.refresh_token = r.refresh_token;
      this.access_token = r.access_token;
      // if (this._user === null) {
      //   this._user = await lastValueFrom(this.users.apiV1UsersGetSelfGet())
      // }
      if (typeof this._onUpdateToken === 'function') {
        this._onUpdateToken(this.access_token);
      }
      this.timer = setInterval(async () => {
        try {
          var r = await this._refreshToken(this.refresh_token);
          this.refresh_token = r.refresh_token;
          this.access_token = r.access_token;
          // if (this._user === null) {
          //   this._user = await lastValueFrom(this.users.apiV1UsersGetSelfGet())
          // }
          if (typeof this._onUpdateToken === 'function') {
            this._onUpdateToken(this.access_token);
          }
        }
        catch (e) {
          console.warn("Refresh token fail");
        }
      }, r.expires_in * 1000 - 60000);
    }
  }
}
