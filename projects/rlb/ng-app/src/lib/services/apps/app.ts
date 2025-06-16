
export type AppViewMode = 'app' | 'settings';
export interface AppInfo<T = any> {
  id?: string;
  type: string;
  enabled: boolean;
  core?: AppDetails;
  settings?: AppDetails;
  viewMode?: AppViewMode;
  routes?: string[];
  domains?: string[];
  navigationUrl?: string;
  data?: T;
}

export interface AppDetails {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}
