import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { EnvironmentProviders, makeEnvironmentProviders, Provider } from "@angular/core";
import {
	AbstractLoggerService,
	AbstractSecurityStorage,
	AuthInterceptor,
	AuthModule,
	LogLevel,
	provideAuth
} from "angular-auth-oidc-client";
import { AuthConfiguration, RLB_CFG_AUTH } from "../configuration";
import { TokenCookiesService } from "./providers/token-cookies.service";
import { TokenSessionService } from "./providers/token-session.service";
import { TokenStoreService } from "./providers/token-store.service";
import { AppLoggerService } from "../services/apps/app-logger.service";
import { TokenOauthInterceptor } from "./token-oauth-interceptor";

export function provideRlbCodeBrowserOAuth(auth: AuthConfiguration | undefined): EnvironmentProviders {
  if (!auth || auth.protocol !== 'oauth') return makeEnvironmentProviders([]);
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: RLB_CFG_AUTH, useValue: auth },
    { provide: AbstractLoggerService, useClass: AppLoggerService },
    AuthModule,
    provideAuth({
      config: auth.providers.map((_auth) => ({
        configId: _auth.configId,
        authority: _auth.issuer,
        redirectUrl: _auth.redirectUrlLogin,
        postLogoutRedirectUri: _auth.redirectUrlLogout,
        clientId: _auth.clientId,
        scope: _auth.scope,
        secureRoutes: auth.allowedUrls,
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        autoUserInfo: true,
        renewUserInfoAfterTokenRenew: true,
        ignoreNonceAfterRefresh: true,
        renewTimeBeforeTokenExpiresInSeconds: 30,
        logLevel: _auth.debug ? LogLevel.Debug : LogLevel.Error,
      }))
    }),
  ];
  if (auth.interceptor === 'oauth-code-all') {
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true });
  }
  if (auth.interceptor === 'oauth-code-ep') {
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: TokenOauthInterceptor, multi: true });
  }
  if (auth.storage === 'cookies') {
    providers.push({ provide: AbstractSecurityStorage, useClass: TokenCookiesService });
  }
  if (auth.storage === 'localStorage') {
    providers.push({ provide: AbstractSecurityStorage, useClass: TokenStoreService },);
  }
  if (auth.storage === 'sessionStorage') {
    providers.push({ provide: AbstractSecurityStorage, useClass: TokenSessionService },);
  }

  return makeEnvironmentProviders(providers);
}
