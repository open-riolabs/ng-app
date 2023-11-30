import { NgModule } from '@angular/core';
import { AbstractLoggerService, AbstractSecurityStorage, AuthInterceptor, AuthModule } from 'angular-auth-oidc-client';
import { TokenStoreService } from './providers/token-store.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoggerService } from './services/logger.service';
import { authCodeFlowConfig } from './authentication.config';

@NgModule({
  declarations: [],
  imports: [
    AuthModule.forRoot(authCodeFlowConfig),
  ],
  exports: [AuthModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: AbstractLoggerService, useClass: LoggerService },
    { provide: AbstractSecurityStorage, useClass: TokenStoreService }],
})
export class AuthBrowserModule { }