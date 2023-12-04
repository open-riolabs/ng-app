import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { AbstractLoggerService, AbstractSecurityStorage, AuthInterceptor, AuthModule, LogLevel, provideAuth } from "angular-auth-oidc-client";
import { LoggerService } from "./services/logger.service";
import { TokenStoreService } from "./providers/token-store.service";
import { AuthConfiguration } from "../configuration";

export function provideCodeBrowserAuth(auth: AuthConfiguration | undefined, debug?: boolean): EnvironmentProviders {
  if (!auth) return makeEnvironmentProviders([]);
  return makeEnvironmentProviders([
    AuthModule,
    provideAuth({
      config: {
        configId: auth.configId,
        authority: auth.issuer,
        redirectUrl: auth.redirectUrlLogin,
        postLogoutRedirectUri: auth.redirectUrlLogout,
        clientId: auth.clientId,
        scope: auth.scope,
        secureRoutes: auth.allowedUrls,
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        autoUserInfo: true,
        renewUserInfoAfterTokenRenew: true,
        renewTimeBeforeTokenExpiresInSeconds: 30,
        logLevel: debug ? LogLevel.Debug : LogLevel.None,
      }
    }),
    { provide: 'options:auth', useValue: auth },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: AbstractLoggerService, useClass: LoggerService },
    { provide: AbstractSecurityStorage, useClass: TokenStoreService }
  ])
}