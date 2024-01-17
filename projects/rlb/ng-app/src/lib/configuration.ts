import { InjectionToken, Type } from "@angular/core";
import { SidebarMode } from "@rlb/ng-bootstrap/lib/components/sidebar/sidebar-mode";
export const RLB_CFG = 'options';
export const RLB_CFG_CMS = new InjectionToken<CmsConfiguration>(`${RLB_CFG}:cms`);
export const RLB_CFG_I18N = new InjectionToken<InternationalizationConfiguration>(`${RLB_CFG}:i18n`);
export const RLB_CFG_PAGES = new InjectionToken<PagesConfiguration>(`${RLB_CFG}:pages`);
export const RLB_CFG_ENV = new InjectionToken<EnvironmentConfiguration>(`${RLB_CFG}:env`);
export const RLB_CFG_AUTH = new InjectionToken<AuthConfiguration>(`${RLB_CFG}:auth`);

export const RLB_APP_NAVCOMP = new InjectionToken<NavbarComponents>(`RLB_APP_NAVCOMP`);

export interface NavbarComponents {
  left: {
    component: Type<any>,
    name: string,
  }[],
  right: {
    component: Type<any>,
    name: string,
  }[]
}

export interface CmsConfiguration {
  endpoint: string;
  chacheDuration: number;
  useAppLanguage: boolean;
  contentLanguages: string[];
  markdown: 'ignore' | 'html' | 'text';
}

export interface AuthConfiguration {
  configId: string;
  issuer: string;
  redirectUrlLogin: string;
  redirectUrlLogout: string;
  clientId: string;
  scope: string;
  showDebugInformation: boolean;
  allowedUrls: string[];
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
  }
}

export interface EnvironmentConfiguration {
  appLogo: string;
  appTitle: string;
  sidebarMode?: SidebarMode | 'none';
  navbarDisabled?: boolean;
  baseUrl: string;
  ssr: boolean;
  phone: boolean;
  errorDialogName?: string;
  errorToastName?: string;
  errorToastContainer?: string;
}

export interface IConfiguration {
  environment?: EnvironmentConfiguration;
  cms?: CmsConfiguration;
  auth?: AuthConfiguration;
  i18n?: InternationalizationConfiguration;
  pages?: PagesConfiguration;
  endpoints?: { [key: string]: string };
}

export type ProjectConfiguration<T = { [k: string]: any }> = IConfiguration & { production: boolean } & T;
