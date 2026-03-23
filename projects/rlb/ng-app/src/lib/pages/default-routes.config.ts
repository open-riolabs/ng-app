import { PagesConfiguration } from '../configuration';
import { CanActivateFn } from '@angular/router';

export interface DefaultRouteConfig {
  path: string;
  configKey?: keyof PagesConfiguration;
  canActivate?: Array<CanActivateFn>;
}

export const DEFAULT_ROUTES_CONFIG: DefaultRouteConfig[] = [
  { path: 'settings' },
  { path: 'settings/general' },
  { path: 'apps' },
  { path: 'profile' },
  { path: 'content', configKey: 'content' },
  { path: 'cookies', configKey: 'cookies' },
  { path: 'notFound', configKey: 'notFound' },
  { path: 'privacy', configKey: 'privacy' },
  { path: 'support', configKey: 'support' },
  { path: 'terms', configKey: 'terms' },
];
