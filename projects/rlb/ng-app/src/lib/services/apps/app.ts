export interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  enabled: boolean;
  auth: boolean;
  settings: AppItemSettings;
}

export interface AppItemSettings {
  title: string;
  description: string;
  url: string;
  icon: string;
}
