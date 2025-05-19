import { Routes } from '@angular/router';
import { CmsContentComponent, CookiesComponent, NotFoundComponent, PrivacyComponent, SupportComponent, TermsAndConditionsComponent } from '.';
import { PagesConfiguration } from '../configuration';
import { AppSelectorComponent } from './apps/app-selector/app-selector.component';
import { UserAccountComponent } from './apps/user-account/user-account.component';
import { SettingsCoreComponent } from './settings/settings-core/settings-core.component';
import { SettingsListComponent } from './settings/settings-list/settings-list.component';

export function getDefaultRoutes(config?: PagesConfiguration): Routes {
  const defaultRoutes: Routes = [
    { path: 'settings', component: SettingsListComponent },
    { path: 'settings/general', component: SettingsCoreComponent, },
    { path: 'apps', component: AppSelectorComponent },
    { path: 'profile', component: UserAccountComponent }
  ];
  if (config?.['content']?.path) {
    defaultRoutes.push({ path: config?.['content'].path, component: CmsContentComponent });
  }
  if (config?.['cookies']?.path) {
    defaultRoutes.push({ path: config?.['cookies'].path, component: CookiesComponent });
  }
  if (config?.['notFound']?.path) {
    defaultRoutes.push({ path: config?.['notFound'].path, component: NotFoundComponent });
  }
  if (config?.['privacy']?.path) {
    defaultRoutes.push({ path: config?.['privacy'].path, component: PrivacyComponent });
  }
  if (config?.['support']?.path) {
    defaultRoutes.push({ path: config?.['support'].path, component: SupportComponent });
  }
  if (config?.['terms']?.path) {
    defaultRoutes.push({ path: config?.['terms'].path, component: TermsAndConditionsComponent });
  }
  return defaultRoutes;
}
