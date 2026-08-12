import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer, Provider } from "@angular/core";
import {
  AbstractLoggerService,
  AbstractSecurityStorage,
  AuthInterceptor,
  AuthModule,
  OpenIdConfiguration,
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

/**
 * The OIDC library configuration each provider is registered with. Exported for its spec — the
 * providers this file returns are opaque `EnvironmentProviders`, so nothing else can read them back.
 *
 * Everything here is written after the spread, so a provider cannot override it — except
 * `silentRenew`, which a host may need to set explicitly. See below.
 */
export function oidcConfigsFor(auth: AuthConfiguration): OpenIdConfiguration[] {
  // Under 'oauth-code-ep-retry' the watchdog owns renewal, so the library's own periodic check is
  // switched off. Leaving it on means two renewers spending one refresh token, and only the
  // watchdog's attempts are snapshot-protected: on a non-network failure the library's check ends in
  // resetAuthorizationData, which erases the refresh token nothing then puts back. Through an outage
  // that costs the session about a minute after the watchdog's first failed attempt.
  const librarySilentRenew = auth.interceptor !== 'oauth-code-ep-retry';

  return auth.providers.map((_auth) => ({
    ..._auth,
    secureRoutes: auth.allowedUrls,
    responseType: 'code',
    useRefreshToken: true,
    autoUserInfo: true,
    renewUserInfoAfterTokenRenew: true,
    ignoreNonceAfterRefresh: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
    // Read back off the provider so a host can put the library's check back if it has a reason to.
    silentRenew: _auth.silentRenew ?? librarySilentRenew,
  }));
}

export function provideRlbCodeBrowserOAuth(auth: AuthConfiguration | undefined): EnvironmentProviders {
  if (!auth || auth.protocol !== 'oauth') return makeEnvironmentProviders([]);
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: RLB_CFG_AUTH, useValue: auth },
    { provide: AbstractLoggerService, useClass: AppLoggerService },
    AuthModule,
    provideAuth({ config: oidcConfigsFor(auth) }),
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
