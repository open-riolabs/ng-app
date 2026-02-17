
export type AppViewMode = 'app' | 'settings';

export interface AppInfoData {
  appName?: string;
}

export interface AppInfo<T extends AppInfoData = any> {
  id?: string;
  type: string;
  enabled: boolean;
  core?: AppDetails;
  settings?: AppDetails;
  viewMode?: AppViewMode;
  routes?: string[];
  domains?: string[];
  actions?: string[];
  navigationUrl?: string;
  data?: T;
  autoRedirectOnRootEnabled?: boolean;
}

export interface AppDetails {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}
