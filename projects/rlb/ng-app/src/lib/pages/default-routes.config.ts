import { PagesConfiguration } from '../configuration';

export interface DefaultRouteConfig {
	path: string;
	configKey?: keyof PagesConfiguration;
}

export const DEFAULT_ROUTES_CONFIG: DefaultRouteConfig[] = [
	{ path: 'setting' },
	{ path: 'setting/general' },
	{ path: 'apps' },
	{ path: 'profile' },
	{ path: 'content', configKey: 'content' },
	{ path: 'cookies', configKey: 'cookies' },
	{ path: 'notFound', configKey: 'notFound' },
	{ path: 'privacy', configKey: 'privacy' },
	{ path: 'support', configKey: 'support' },
	{ path: 'terms', configKey: 'terms' },
];