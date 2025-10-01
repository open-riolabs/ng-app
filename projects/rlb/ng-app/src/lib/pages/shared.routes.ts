import { Routes } from '@angular/router';
import {
	CmsContentComponent,
	CookiesComponent,
	NotFoundComponent,
	PrivacyComponent,
	SupportComponent,
	TermsAndConditionsComponent
} from '.';
import { PagesConfiguration } from '../configuration';
import { AppSelectorComponent } from './apps/app-selector/app-selector.component';
import { UserAccountComponent } from './apps/user-account/user-account.component';
import { SettingsCoreComponent } from './settings/settings-core/settings-core.component';
import { SettingsListComponent } from './settings/settings-list/settings-list.component';
import { DEFAULT_ROUTES_CONFIG } from "./default-routes.config";

export function getDefaultRoutes(config?: PagesConfiguration): Routes {
	const defaultRoutes =  DEFAULT_ROUTES_CONFIG
		.filter(defaultRouteConfig => !defaultRouteConfig.configKey || (config && config[defaultRouteConfig.configKey]))
		.map(route => {
			switch (route.path) {
				case 'setting': return { path: 'setting', component: SettingsListComponent };
				case 'setting/general': return { path: 'setting/general', component: SettingsCoreComponent };
				case 'apps': return { path: 'apps', component: AppSelectorComponent };
				case 'profile': return { path: 'profile', component: UserAccountComponent };
				case 'content': return { path: 'content', component: CmsContentComponent };
				case 'cookies': return { path: 'cookies', component: CookiesComponent };
				case 'notFound': return { path: 'notFound', component: NotFoundComponent };
				case 'privacy': return { path: 'privacy', component: PrivacyComponent };
				case 'support': return { path: 'support', component: SupportComponent };
				case 'terms': return { path: 'terms', component: TermsAndConditionsComponent };
				default: throw new Error(`No component mapped for route ${route.path}`);
			}
		});
	return defaultRoutes;
}

