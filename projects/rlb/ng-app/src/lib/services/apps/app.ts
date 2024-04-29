export interface AppInfo {
  id: string;
  enabled: boolean;
  core?: AppDetails;
  settings?: AppInfoSettings;
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
