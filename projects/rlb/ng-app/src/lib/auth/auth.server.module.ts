import { NgModule } from '@angular/core';
import { AbstractLoggerService, AbstractSecurityStorage, AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';
import { TokenCookiesService } from './providers/token-cookies.service';
import { authCodeFlowConfig } from './authentication.config';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppLoggerService } from '../services/apps/app-logger.service';


@NgModule({
  declarations: [],
  imports: [
    AuthModule.forRoot(authCodeFlowConfig),
  ],
  exports: [
    AuthModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: AbstractLoggerService, useClass: AppLoggerService },
    { provide: AbstractSecurityStorage, useClass: TokenCookiesService }]
})
export class AuthServerModule { }
