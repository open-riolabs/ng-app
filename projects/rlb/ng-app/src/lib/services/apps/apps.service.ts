import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppContextActions, AuthActions, BaseState } from '../../store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AppInfo } from './app';
import { RlbLoggerService } from "../../auth/services/rlb-logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

interface AppConfig {
	route: ActivatedRoute
	appsConfig: AppInfo<any>[]
	apps: AppInfo<any>[]
}

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  constructor(
    private store: Store<BaseState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
		private logger: RlbLoggerService,
    @Inject(RLB_CFG_AUTH) @Optional() confAuth: AuthConfiguration | undefined
  ) {
		console.log('AppsService initialized');
		
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
		this.logger.logInfo('Current app from store:', app);
		return app;
	}

  selectApp(app?: AppInfo, viewMode?: 'app' | 'settings', url?: string) {
    const currentApp = this.currentApp;
		if (!app) {
			this.logger.logWarning('Deselecting app (null).');
			this.store.dispatch(AppContextActions.setCurrentApp({ app: null }));
			return;
		}
		if (currentApp && currentApp.id === app.id && currentApp.viewMode === viewMode) {
			this.logger.logInfo('App already selected with same id and viewMode. Skipping dispatch.');
			return;
		}
		this.logger.logWarning('Dispatching setCurrentApp with:', { app, mode: viewMode, url });
		this.store.dispatch(AppContextActions.setCurrentApp({ app, mode: viewMode, url }));
  }
	
	private initAuthProviders(store: Store<BaseState>, confAuth?: AuthConfiguration) {
		if (!confAuth?.providers?.length) {
			this.logger.logWarning('No auth providers configured.');
			return;
		}
		
		if (confAuth?.providers && confAuth.providers.length === 1) {
			this.logger.logInfo('Single auth provider detected:', confAuth.providers[0]);
			store.dispatch(AuthActions.setCurrentProvider({ currentProvider: confAuth.providers[0].configId }));
			return
		}
		
		this.logger.logInfo('Multiple auth providers detected, checking by domain:', this.currentDomain);
		
		const authProvidersMatched = confAuth.providers.filter(provider => provider.domains?.includes(this.currentDomain));
		
		if (authProvidersMatched && authProvidersMatched.length === 1) {
			this.logger.logInfo('Auth provider matched by domain:', authProvidersMatched[0]);
			store.dispatch(AuthActions.setCurrentProvider({ currentProvider: authProvidersMatched[0].configId }));
		} else if (authProvidersMatched && authProvidersMatched.length > 1) {
			this.logger.logWarning(`Multiple auth providers found for the current domain: ${this.currentDomain}. Please specify a single provider in the configuration.`);
		} else {
			this.logger.logWarning(`No auth provider found for the current domain: ${this.currentDomain}.`);
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
			this.logger.logWarning('Route without config detected:', route);
			return of(null);
		}
		
		const appRoutes: { type: string; routes: string[]; }[] | undefined = this.apps
			?.map(app => ({
				type: app.type,
				routes: app.routes || [],
			}));
		
		const appRoutesMatched = appRoutes?.filter(app => app.routes?.includes(route.routeConfig?.path!));
		
		this.logger.logInfo('Route config path:', route.routeConfig?.path, 'Matched appRoute:', appRoutesMatched);
		
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
			this.logger.logError('Some apps are not finalized. Please finalize apps before using AppsService.');
			return;
		}
		
		if (!data || !data.apps || data.apps.length === 0) {
			this.logger.logWarning(`No unique app found for route: ${route.routeConfig?.path ? route.routeConfig?.path : "'/'"} - show core`);
			// const globalDefaultApp = this.apps[0];
			this.selectApp(undefined);
			return;
		}
		
		const matchedApps = data.apps.filter(app =>
			app.routes?.includes(route.routeConfig?.path!) ||
			app.core?.url === '/' + route.routeConfig?.path
		);
		
		let appToSelect: AppInfo | undefined;
		
		if (matchedApps.length === 1) {
			appToSelect = matchedApps[0];
			this.logger.logInfo('Single app matched route:', appToSelect);
		} else if (matchedApps.length > 1) {
			appToSelect = matchedApps.find(a => a.id === storedId) || matchedApps[0];
			this.logger.logInfo('Multiple apps matched route, selected:', appToSelect);
		} else {
			appToSelect = data.apps[0];
			this.logger.logInfo('No app matched route. Falling back to default app:', appToSelect);
		}
		
		const qp = new URLSearchParams(route.snapshot.queryParams).toString();
		const url = route.snapshot.url.map(segment => segment.path).join('/') + (qp ? `?${qp}` : '');
		
		const viewMode = this.isSettingsRoute(route) ? 'settings' : 'app';
		
		this.selectApp(appToSelect, viewMode, url);
	}
	
	private findDeepestChild(route: ActivatedRoute): ActivatedRoute {
		while (route.firstChild) route = route.firstChild;
		this.logger.logInfo('Activated deepest child route:', route);
		return route;
	}
	
	private getStoredAppId(): string | null {
		try {
			return localStorage.getItem('c-app-id');
		} catch (e) {
			this.logger.logWarning('LocalStorage not available:', e);
			return null;
		}
	}
	
	private isSettingsRoute(route: ActivatedRoute): boolean {
		return route.routeConfig?.path?.includes('settings') ?? false;
	}
}
