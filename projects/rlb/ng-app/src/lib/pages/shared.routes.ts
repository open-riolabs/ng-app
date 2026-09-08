import { Route, Routes } from '@angular/router';
import { CmsContentComponent } from './cms-content/cms-content.component';
import { CookiesComponent } from './cookies/cookies.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { SupportComponent } from './support/support.component';
import { TermsAndConditionsComponent } from './terms-and-conditions/terms-and-conditions.component';
import { PagesConfiguration } from '../configuration';
import { AppSelectorComponent } from './apps/app-selector/app-selector.component';
import { UserAccountComponent } from './apps/user-account/user-account.component';
import { SettingsCoreComponent } from './settings/settings-core/settings-core.component';
import { SettingsListComponent } from './settings/settings-list/settings-list.component';
import { DEFAULT_ROUTES_CONFIG, DefaultRouteConfig } from './default-routes.config';
import { oauthGuard } from '../auth/guards/oauth.guard';
import { pagePermissionGuard } from '../auth/guards/permission.guard';
import { ForbiddenComponent } from './forbidden/forbidden.component';

/**
 * Pages that are never ACL-gated, whatever the config says: they are where a denial *lands*.
 * Guarding them is a redirect loop.
 */
const UNGATEABLE_PATHS = ['forbidden', 'notFound'];

export function getDefaultRoutes(config?: PagesConfiguration): Routes {
  const defaultRoutes = DEFAULT_ROUTES_CONFIG.filter(
    defaultRouteConfig =>
      !defaultRouteConfig.configKey || (config && config[defaultRouteConfig.configKey]),
  ).map(routeConfig => withPageAcl(buildRoute(routeConfig.path), routeConfig, config));
  return defaultRoutes;
}

function buildRoute(path: string): Route {
  switch (path) {
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
      throw new Error(`No component mapped for route ${path}`);
  }
}

/**
 * Adds the ACL guard when the page's config entry declares an `action`.
 *
 * Absent `action` leaves the route exactly as it was — every configuration written before this
 * existed omits it, and an upgrade must not start hiding chrome. The same action gates the settings
 * button that links here, so a denied user never sees the entry in the first place; the guard is
 * for deep links and for anyone who bookmarked the page before losing the grant.
 */
function withPageAcl(
  route: Route,
  routeConfig: DefaultRouteConfig,
  config?: PagesConfiguration,
): Route {
  const action = routeConfig.configKey ? config?.[routeConfig.configKey]?.action : undefined;
  if (!action || UNGATEABLE_PATHS.includes(routeConfig.path)) return route;

  return {
    ...route,
    canActivate: [...(route.canActivate ?? []), pagePermissionGuard(action)],
  };
}
