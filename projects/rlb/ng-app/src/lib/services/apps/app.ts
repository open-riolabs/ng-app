export interface AppInfo<T = any> {
  id: string;
  enabled: boolean;
  core?: AppDetails;
  settings?: AppInfoSettings;
  data?: T;
}

export interface AppDetails {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}

export interface AppInfoSettings {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}
