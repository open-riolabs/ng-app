import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppContextActions, AuthActions, BaseState } from '../../store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AppInfo, AppViewMode } from './app';
import { AppLoggerService, LoggerContext } from "./app-logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEFAULT_ROUTES_CONFIG } from "../../pages/default-routes.config";

interface AppConfig {
	route: ActivatedRoute
	appsConfig: AppInfo<any>[]
	apps: AppInfo<any>[]
}

interface AppMatched {
	type: string
	routes: string[],
	viewMode: AppViewMode | undefined
}

@Injectable({
  providedIn: 'root'
})
export class AppsService {
	private logger: LoggerContext;
	
  constructor(
    private store: Store<BaseState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
		private loggerService: AppLoggerService,
    @Inject(RLB_CFG_AUTH) @Optional() confAuth: AuthConfiguration | undefined
  ) {
		this.logger = this.loggerService.for(this.constructor.name);
		this.logger.log('AppsService initialized');
		
    this.initAuthProviders(store, confAuth);
		this.initRouterListener()
  }

  get currentDomain() {
    return window.location.hostname;
  }
	
	get apps() {
		return this.store.selectSignal(state => state[appContextFeatureKey].apps)()
			.filter(app => app.id && (app.domains === undefined || app.domains == null || app.domains.includes(this.currentDomain)));
	}
	
	get currentApp() {
		const app = this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
		this.logger.log('Current app from store:', app);
		return app;
	}

  selectApp(app?: AppInfo, viewMode?: 'app' | 'settings', url?: string) {
    const currentApp = this.currentApp;
		if (!app) {
			this.logger.warn('Deselecting app (null).');
			this.store.dispatch(AppContextActions.setCurrentApp({ app: null }));
			return;
		}
		if (currentApp && currentApp.id === app.id && currentApp.viewMode === viewMode) {
			this.logger.info('App already selected with same id and viewMode. Skipping dispatch.');
			return;
		}
		this.logger.warn('Dispatching setCurrentApp with:', { app, mode: viewMode, url });
		this.store.dispatch(AppContextActions.setCurrentApp({ app, mode: viewMode, url }));
  }
	
	private initAuthProviders(store: Store<BaseState>, confAuth?: AuthConfiguration) {
		if (!confAuth?.providers?.length) {
			this.logger.warn('No auth providers configured.');
			return;
		}
		
		if (confAuth?.providers && confAuth.providers.length === 1) {
			this.logger.info('Single auth provider detected:', confAuth.providers[0]);
			store.dispatch(AuthActions.setCurrentProvider({ currentProvider: confAuth.providers[0].configId }));
			return
		}
		
		this.logger.info('Multiple auth providers detected, checking by domain:', this.currentDomain);
		
		const authProvidersMatched = confAuth.providers.filter(provider => provider.domains?.includes(this.currentDomain));
		
		if (authProvidersMatched && authProvidersMatched.length === 1) {
			this.logger.info('Auth provider matched by domain:', authProvidersMatched[0]);
			store.dispatch(AuthActions.setCurrentProvider({ currentProvider: authProvidersMatched[0].configId }));
		} else if (authProvidersMatched && authProvidersMatched.length > 1) {
			this.logger.warn(`Multiple auth providers found for the current domain: ${this.currentDomain}. Please specify a single provider in the configuration.`);
		} else {
			this.logger.warn(`No auth provider found for the current domain: ${this.currentDomain}.`);
		}
	}
	
	private initRouterListener() {
		this.router.events
			.pipe(
				filter(event => event instanceof NavigationEnd),
				switchMap(() => this.resolveRouteAndApps()),
				takeUntilDestroyed()
			)
			.subscribe(data => this.handleResolvedApps(data));
	}
	
	// Core logic
	
	private resolveRouteAndApps(): Observable<AppConfig | null> {
		const route = this.findDeepestChild(this.activatedRoute);
		
		if (!route.routeConfig) {
			this.logger.warn('Route without config detected:', route);
			return of(null);
		}
		
		const appRoutes: AppMatched[] | undefined = this.apps
			?.map(app => ({
				type: app.type,
				routes: app.routes || [],
				viewMode: app.viewMode,
			}));
		
		const path = route.routeConfig?.path;
		let appRoutesMatched: AppMatched[] = []
		this.logger.info("isDefault route: ", this.isDefaultRoute(path!))
		if (path && !this.isDefaultRoute(path)) {
			appRoutesMatched = appRoutes?.filter(app =>
				app.routes?.some(r =>r.includes(path))
			);
		}
		
		this.logger.info('Route config path:', path, 'Matched appRoute:', appRoutesMatched);
		
		return this.store.select(state => state[appContextFeatureKey].apps).pipe(
			map(apps => appRoutesMatched.length
				? { route, appsConfig: appRoutesMatched, apps } as AppConfig
				: null
			))
	}
	
	private handleResolvedApps(data: AppConfig | null) {
		const route = this.findDeepestChild(this.activatedRoute);
		const storedId = this.getStoredAppId();
		
		if (data?.apps?.some(app => !app.id)) {
			this.logger.error('Some apps are not finalized. Please finalize apps before using AppsService.');
			return;
		}
		
		if (!data || !data.apps || data.apps.length === 0) {
			this.logger.warn(`No unique app found for route: ${route.routeConfig?.path ? route.routeConfig?.path : "'/'"} - show core`);
			// const globalDefaultApp = this.apps[0];
			this.selectApp(undefined);
			return;
		}
		
		const matchedApps = data.apps.filter(app =>
			app.routes?.some(r =>r.includes(route.routeConfig?.path!)) ||
			app.core?.url === '/' + route.routeConfig?.path
		);
		
		let appToSelect: AppInfo | undefined;
		
		if (matchedApps.length === 1) {
			appToSelect = matchedApps[0];
			this.logger.info('Single app matched route:', appToSelect);
		} else if (matchedApps.length > 1) {
			appToSelect = matchedApps.find(a => a.id === storedId) || matchedApps[0];
			this.logger.info('Multiple apps matched route, selected:', appToSelect);
		} else {
			appToSelect = data.apps[0];
			this.logger.info('No app matched route. Falling back to default app:', appToSelect);
		}
		
		const qp = new URLSearchParams(route.snapshot.queryParams).toString();
		const url = route.snapshot.url.map(segment => segment.path).join('/') + (qp ? `?${qp}` : '');
		
		const viewMode = this.isSettingsRoute(route) ? 'settings' : 'app';
		
		this.selectApp(appToSelect, viewMode, url);
	}
	
	private findDeepestChild(route: ActivatedRoute): ActivatedRoute {
		while (route.firstChild) route = route.firstChild;
		this.logger.info('Activated deepest child route:', route);
		return route;
	}
	
	private getStoredAppId(): string | null {
		try {
			return localStorage.getItem('c-app-id');
		} catch (e) {
			this.logger.warn('LocalStorage not available:', e);
			return null;
		}
	}
	
	private isSettingsRoute(route: ActivatedRoute): boolean {
		return route.routeConfig?.path?.includes('settings') ?? false;
	}
	
	private isDefaultRoute(route: string): boolean {
		return DEFAULT_ROUTES_CONFIG
			.some(r => r.path.includes(route));
	}
}
