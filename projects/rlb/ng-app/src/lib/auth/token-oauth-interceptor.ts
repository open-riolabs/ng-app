import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable, switchMap, map } from 'rxjs';
import { AuthenticationService } from "./services/auth.service";
import { IConfiguration, RLB_CFG } from "../configuration";

@Injectable()
export class TokenOauthInterceptor implements HttpInterceptor {

  constructor(
    private authenticationService: AuthenticationService,
    @Inject(RLB_CFG) private appconfig: IConfiguration
  ) { }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const endpoints = !this.appconfig.endpoints ? [] : Object.values(this.appconfig.endpoints).filter(e => e.auth && !e.wss)
    if (!endpoints.some(e => request.url.includes(e.baseUrl))) {
      return next.handle(request);
    }
    return this.authenticationService.accessToken$.pipe(
      switchMap(token => {
        if (token) {
          const newRequest = request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(newRequest);
        }
        return next.handle(request);
      })
    );
  }
}
