import { InjectionToken, Type } from '@angular/core';
import { OpenIdConfiguration } from 'angular-auth-oidc-client';
import { LogLevel } from './services';

// export const RLB_CFG = 'rlb.options';
export const RLB_CFG = new InjectionToken<ProjectConfiguration>('rlb.options');
export const RLB_CFG_CMS = new InjectionToken<CmsConfiguration>(`${RLB_CFG}:cms`);
export const RLB_CFG_I18N = new InjectionToken<InternationalizationConfiguration>(
  `${RLB_CFG}:i18n`,
);
export const RLB_CFG_PAGES = new InjectionToken<PagesConfiguration>(`${RLB_CFG}:pages`);
export const RLB_CFG_ENV = new InjectionToken<EnvironmentConfiguration>(`${RLB_CFG}:env`);
export const RLB_CFG_AUTH = new InjectionToken<AuthConfiguration>(`${RLB_CFG}:auth`);
export const RLB_APP_NAVCOMP = new InjectionToken<NavbarComponents>(`rlb.app.navcomp`);
export const RLB_APP_SIDEBARCOMP = new InjectionToken<SidebarComponents>(`rlb.app.sidebarcomp`);
export const RLB_CFG_ACL = new InjectionToken<AclConfiguration>(`${RLB_CFG}:acl`);

/**
 * Which chrome surface a custom navbar component is currently rendered in.
 * Provided by the shell around each component outlet. Inject it with
 * `{ optional: true }` — components registered before this token existed
 * simply don't see it.
 */
export type NavSurface = 'navbar' | 'mobile-menu';
export const RLB_NAV_SURFACE = new InjectionToken<NavSurface>('rlb.nav.surface');

export type AuthUrlHandler = (url: string) => void | Promise<void>;
export const RLB_AUTH_URL_HANDLER = new InjectionToken<AuthUrlHandler>('rlb.auth.urlHandler');

export interface InterceptorMapping {
  // Key: The name of the Query Parameter to add to the request
  // Value: The property name to look for in Store data object
  [k: string]: string;
}

export interface ProviderAclConfiguration {
  endpointKey: string;
  path: string;
}

export interface AclConfiguration {
  // endpointKey: string; // The key in the 'endpoints'
  // path: string;        // The path
  interceptorMapping?: InterceptorMapping;
  businessIdKey: string; // The key in the Store data object to match with businessId
  resourceIdKey: string; // The key in the Store data object to match with resourceId
}

export interface ProviderConfiguration extends OpenIdConfiguration {
  configId: string;
  domains?: string[];
  roleClaim?: (data: any) => string | string[];
  acl?: ProviderAclConfiguration;
}

export interface NavbarComponent {
  component: Type<any>;
  name: string;
}

export interface NavbarComponents {
  left: NavbarComponent[];
  right: NavbarComponent[];
  /**
   * Components available to the mobile menu (offcanvas below the `lg` breakpoint),
   * activated with `NavbarActions.setMobileItems`. Falls back to `right` when omitted,
   * so an app can register one component for both surfaces and branch on
   * {@link RLB_NAV_SURFACE}.
   */
  mobile?: NavbarComponent[];
}

export interface SidebarComponents {
  footer: {
    component: Type<any>;
    name: string;
  }[];
}

export interface CmsConfiguration {
  endpoint: string;
  chacheDuration: number;
  useAppLanguage: boolean;
  contentLanguages: string[];
  markdown: 'ignore' | 'html' | 'text';
}

/**
 * Tuning for the `'oauth-code-ep-retry'` interceptor and the token watchdog behind it.
 *
 * The defaults are the ones this design was audited with; change them only with a reason.
 */
export interface TokenRenewalConfiguration {
  /**
   * How far ahead of expiry to renew, in seconds. Default 90.
   *
   * Wide enough that the retry ladder below has room to run before the token actually expires: at
   * the defaults the first three retries all land with time to spare.
   *
   * This used to be justified as staying ahead of the 30s the OIDC library uses for its own periodic
   * check, on the reasoning that ours would land first and the library's would then find a fresh
   * token and stand down. That only held while ours succeeded — through an outage it never does, and
   * the library's unguarded check went on to destroy the refresh token. The library's check is
   * switched off under this interceptor now, so there is no second renewer to stay ahead of.
   */
  renewLeadSeconds?: number;
  /** Waits between the first failed attempts, in seconds. Default `[5, 20, 60]`. */
  retryDelaysSeconds?: number[];
  /** Cadence of the slow heartbeat once the ladder above is spent, in seconds. Default 120. */
  transientRetrySeconds?: number;
  /**
   * How long to keep retrying one outage before standing down, in seconds. Default 1800.
   *
   * A dead refresh token is indistinguishable from an unreachable host by the time the failure
   * arrives — the library replaces the provider's response body with its own `Error` — so this
   * budget, not any classification of the error, is what stops a rejected token being retried
   * forever. The interceptor still recovers on the next 401.
   *
   * It also bounds how long `oauthGuard` will let a signed-out-looking session keep navigating: for
   * as long as the watchdog is working on an outage the user stays in the app, and once it stands
   * down they are sent to the login page. Lower this if you would rather a revoked session reached
   * the login page sooner, at the cost of giving up on a long outage sooner too.
   */
  maxOutageSeconds?: number;
  /** Start the watchdog once the user is authenticated. Default true. */
  autoStart?: boolean;
  /**
   * Renew once at bootstrap when the stored access token has expired but a refresh token outlived
   * it. Default true.
   *
   * This is what makes a session survive the browser being closed. The OIDC library decides
   * authentication at startup by reading storage — an expired access token means unauthenticated,
   * and it never tries the refresh token it is holding. So a user coming back the next morning is
   * sent to the login host, and only stays signed in for as long as the provider's own SSO cookie
   * outlives the tab. Past that they get a login form, with a perfectly good refresh token still in
   * storage. With `offline_access` in the provider's `scope` and `storage: 'localStorage'`, one
   * renewal here is the difference between that and a session that lasts as long as the refresh
   * token does.
   *
   * A failed attempt leaves the startup exactly as it is without this: unauthenticated, guards
   * redirecting. The refresh token survives it — the renewal runs through the watchdog's
   * snapshot-protected path — so reloading during an outage cannot destroy the stored session.
   */
  restoreOnBoot?: boolean;
  /**
   * Paths on authenticated endpoints that anonymous callers may legitimately reach, matched as
   * substrings of the request URL (e.g. `['/register']`).
   *
   * The interceptor otherwise refuses to send a request to an authenticated endpoint without a
   * token; registration and similar front-door calls happen before an account exists and would
   * fail. Default `[]`.
   */
  publicPaths?: string[];
}

export interface AuthConfiguration {
  protocol: 'oauth';
  storage: 'cookies' | 'localStorage' | 'sessionStorage';
  /**
   * Which HTTP interceptor attaches the token.
   *
   * - `'oauth-code-all'` — the OIDC library's own, matching `allowedUrls`.
   * - `'oauth-code-ep'` — attaches to the `endpoints` marked `auth`. Sends the request anyway when
   *   there is no token, so the backend sees an anonymous call.
   * - `'oauth-code-ep-retry'` — as above, plus: never sends an authenticated request without a
   *   token, retries a 401 once with a fresh one, and keeps a watchdog renewing the token so a
   *   single failed refresh cannot end renewal for the life of the page. Tune with {@link renewal}.
   *
   * `'oauth-code-ep-retry'` also switches the OIDC library's own `silentRenew` off, because the
   * watchdog owns renewal in that mode and two renewers spending one refresh token is how a session
   * dies mid-outage. Set `silentRenew: true` on an individual provider to put it back.
   */
  interceptor?: 'oauth-code-all' | 'oauth-code-ep' | 'oauth-code-ep-retry' | 'none';
  enableCompanyInterceptor?: boolean;
  allowedUrls: string[];
  providers: ProviderConfiguration[];
  /** Only read when {@link interceptor} is `'oauth-code-ep-retry'`. */
  renewal?: TokenRenewalConfiguration;
}

export interface InternationalizationConfiguration {
  availableLangs: string[];
  defaultLanguage: string;
  useLanguageBrowser: boolean;
  storeSelectedLanguage: boolean;
  cookieStoreName: string;
}

export interface PageConfiguration {
  path: string;
  /**
   * ACL action required to see this page — the entry in the settings dropdown and list, and the
   * route itself (guarded with `pagePermissionGuard`). A list grants on **any** of its actions.
   *
   * Omitted means visible to everyone, which is what every configuration written before this
   * existed says. The check is "does the user hold it on any resource", not "in the current app":
   * these pages belong to no app, and while one is open there is no current app to scope to.
   *
   * Routes the kit does not register — `status`, `logger`, anything else the consumer owns — get
   * their button gated here, but you have to put `pagePermissionGuard` on the route yourself.
   */
  action?: string | string[];
}

export interface PagesConfiguration {
  [key: string]: PageConfiguration;
}

/**
 * Per-status messages `ErrorManagementService` renders for a failed HTTP call.
 *
 * For an `HttpErrorResponse` the lookup is, first group that resolves a message wins:
 * `{keyPrefix}.{status}` → `{keyPrefix}.default` → the backend's own text
 * (`"{status}: {message}"` under an `HttpErrorResponse` title), which is what the handler has
 * always shown. A key ngx-translate cannot resolve counts as a miss, so a consumer opts in one
 * status at a time just by adding keys to its i18n files — nothing has to be configured here.
 *
 * Each group holds `title`, `message` and an optional `messageRetry` used instead of `message`
 * when the wait is known (see {@link defaultRetryMinutes}); `messageRetry` may interpolate
 * `{{minutes}}`, `{{seconds}}` and `{{status}}`.
 */
export interface HttpErrorMessagesConfiguration {
  /** i18n namespace holding the per-status groups. Default `'errors.http'`. */
  keyPrefix?: string;
  /**
   * How long to say the caller must wait when the response carries no usable `Retry-After`.
   *
   * `Retry-After` is not a CORS-safelisted response header: a cross-origin gateway has to name it
   * in `Access-Control-Expose-Headers` or the browser hides it and every 429 looks like it has
   * none. Without either, only the `message` variant of a group can be used.
   */
  defaultRetryMinutes?: number;
  /**
   * Window in ms within which the same (output, title, message) is shown once.
   *
   * A rate limit rejects every request already in flight, so without this the user gets one modal
   * per request instead of one modal. Default 1000; set `0` to show every error.
   */
  dedupeMs?: number;
}

export interface EnvironmentConfiguration {
  appLogo: string;
  appTitle: string;
  navbarDisabled?: boolean;
  baseUrl: string;
  ssr: boolean;
  phone: boolean;
  errorDialogName?: string;
  errorDialogSize?: 'sm' | 'lg' | 'xl' | 'md';
  errorToastName?: string;
  errorToastContainer?: string;
  httpErrors?: HttpErrorMessagesConfiguration;
  pwaUpdateEnabled?: boolean;
  logLevel?: LogLevel;
}

export interface Endpoint {
  baseUrl: string;
  healthPath: string;
  auth?: boolean;
  wss?: boolean;
}

export interface IConfiguration {
  environment?: EnvironmentConfiguration;
  cms?: CmsConfiguration;
  auth?: AuthConfiguration;
  i18n?: InternationalizationConfiguration;
  pages?: PagesConfiguration;
  acl?: AclConfiguration;
  endpoints?: { [key: string]: Endpoint };
}

export type ProjectConfiguration<T = { [k: string]: any }> = IConfiguration & {
  production: boolean;
} & T;
