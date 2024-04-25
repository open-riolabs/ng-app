export interface AppItem {
  id: string;
  enabled: boolean;
  core?: AppDetails;
  settings?: AppItemSettings;
}

export interface AppDetails {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}

export interface AppItemSettings {
  title: string;
  description: string;
  url: string;
  icon: string;
  auth: boolean;
}
