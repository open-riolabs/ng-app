import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, Provider } from "@angular/core";
import {
  AbstractLoggerService,
  AbstractSecurityStorage,
  AuthInterceptor,
  AuthModule,
  provideAuth
} from "angular-auth-oidc-client";
import { AuthConfiguration, RLB_CFG_AUTH } from "../configuration";
import { TokenCookiesService } from "./providers/token-cookies.service";
import { TokenSessionService } from "./providers/token-session.service";
import { TokenStoreService } from "./providers/token-store.service";
import { AppLoggerService } from "../services/apps/app-logger.service";
import { TokenOauthInterceptor } from "./token-oauth-interceptor";
import { CompanyInterceptor } from "./company.interceptor";
import { TokenOauthRetryInterceptor } from "./renewal/token-oauth-retry.interceptor";
import { TokenRenewalService } from "./renewal/token-renewal.service";
import { AuthenticationService } from "./services/auth.service";

export function provideRlbCodeBrowserOAuth(auth: AuthConfiguration | undefined): EnvironmentProviders {
  if (!auth || auth.protocol !== 'oauth') return makeEnvironmentProviders([]);
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: RLB_CFG_AUTH, useValue: auth },
    { provide: AbstractLoggerService, useClass: AppLoggerService },
    AuthModule,
    provideAuth({
      config: auth.providers.map((_auth) => ({
        ..._auth,
        secureRoutes: auth.allowedUrls,
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        autoUserInfo: true,
        renewUserInfoAfterTokenRenew: true,
        ignoreNonceAfterRefresh: true,
        renewTimeBeforeTokenExpiresInSeconds: 30,
      }))
    }),
  ];
  if (auth.interceptor === 'oauth-code-all') {
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true });
  }
  if (auth.interceptor === 'oauth-code-ep') {
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: TokenOauthInterceptor, multi: true });
  }
  if (auth.interceptor === 'oauth-code-ep-retry') {
    // Replaces TokenOauthInterceptor rather than stacking on it: it attaches the token itself.
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: TokenOauthRetryInterceptor, multi: true });
    if (auth.renewal?.autoStart !== false) {
      providers.push(
        provideAppInitializer(() => {
          const renewal = inject(TokenRenewalService);
          // authenticated$ emits only once some configuration is authenticated, and completes
          // either way, so a guest session never starts the watchdog. It is a ReplaySubject, so
          // subscribing after checkAuthMultiple has already run still works.
          inject(AuthenticationService).authenticated$.subscribe(() => renewal.start());
        }),
      );
    }
  }
  if (auth.enableCompanyInterceptor) {
    providers.push({ provide: HTTP_INTERCEPTORS, useClass: CompanyInterceptor, multi: true });
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
