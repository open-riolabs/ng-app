import { Routes } from '@angular/router';
import {
  CmsContentComponent,
  CookiesComponent,
  NotFoundComponent,
  PrivacyComponent,
  SupportComponent,
  TermsAndConditionsComponent,
} from '.';
import { PagesConfiguration } from '../configuration';
import { AppSelectorComponent } from './apps/app-selector/app-selector.component';
import { UserAccountComponent } from './apps/user-account/user-account.component';
import { SettingsCoreComponent } from './settings/settings-core/settings-core.component';
import { SettingsListComponent } from './settings/settings-list/settings-list.component';
import { DEFAULT_ROUTES_CONFIG } from './default-routes.config';
import { oauthGuard } from '../auth';
import { ForbiddenComponent } from './forbidden/forbidden.component';

export function getDefaultRoutes(config?: PagesConfiguration): Routes {
  const defaultRoutes = DEFAULT_ROUTES_CONFIG.filter(
    defaultRouteConfig =>
      !defaultRouteConfig.configKey || (config && config[defaultRouteConfig.configKey]),
  ).map(route => {
    switch (route.path) {
      case 'settings':
        return { path: 'settings', component: SettingsListComponent, canActivate: [oauthGuard] };
      case 'settings/general':
        return {
          path: 'settings/general',
          component: SettingsCoreComponent,
          canActivate: [oauthGuard],
        };
      case 'apps':
        return { path: 'apps', component: AppSelectorComponent, canActivate: [oauthGuard] };
      case 'profile':
        return { path: 'profile', component: UserAccountComponent, canActivate: [oauthGuard] };
      case 'content':
        return { path: 'content', component: CmsContentComponent };
      case 'cookies':
        return { path: 'cookies', component: CookiesComponent };
      case 'notFound':
        return { path: 'notFound', component: NotFoundComponent };
      case 'forbidden':
        return { path: 'forbidden', component: ForbiddenComponent };
      case 'privacy':
        return { path: 'privacy', component: PrivacyComponent };
      case 'support':
        return { path: 'support', component: SupportComponent };
      case 'terms':
        return { path: 'terms', component: TermsAndConditionsComponent };
      default:
        throw new Error(`No component mapped for route ${route.path}`);
    }
  });
  return defaultRoutes;
}
