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

export interface AuthConfiguration {
  protocol: 'oauth';
  storage: 'cookies' | 'localStorage' | 'sessionStorage';
  interceptor?: 'oauth-code-all' | 'oauth-code-ep' | 'none';
  enableCompanyInterceptor?: boolean;
  allowedUrls: string[];
  providers: ProviderConfiguration[];
}

export interface InternationalizationConfiguration {
  availableLangs: string[];
  defaultLanguage: string;
  useLanguageBrowser: boolean;
  storeSelectedLanguage: boolean;
  cookieStoreName: string;
}

export interface PagesConfiguration {
  [key: string]: {
    path: string;
  };
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
