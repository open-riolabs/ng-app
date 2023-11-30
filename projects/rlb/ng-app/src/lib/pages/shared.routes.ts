import { Routes } from '@angular/router';
import { PagesConfiguration } from '../configuration';
import { CmsContentComponent, CookiesComponent, NotFoundComponent, PrivacyComponent, SupportComponent, TermsAndConditionsComponent } from '.';

export function getDefaultRoutes(config: PagesConfiguration): Routes {
  const defaultRoutes: Routes = [];
  if (config['content']?.path) {
    defaultRoutes.push({ path: config['content'].path, component: CmsContentComponent });
  }
  if (config['cookies']?.path) {
    defaultRoutes.push({ path: config['cookies'].path, component: CookiesComponent });
  }
  if (config['notFound']?.path) {
    defaultRoutes.push({ path: config['notFound'].path, component: NotFoundComponent });
  }
  if (config['privacy']?.path) {
    defaultRoutes.push({ path: config['privacy'].path, component: PrivacyComponent });
  }
  if (config['support']?.path) {
    defaultRoutes.push({ path: config['support'].path, component: SupportComponent });
  }
  if (config['terms']?.path) {
    defaultRoutes.push({ path: config['terms'].path, component: TermsAndConditionsComponent });
  }
  return defaultRoutes;
}
