import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, Observable, of, switchMap } from 'rxjs';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppContextActions, AuthActions, authsFeatureKey, BaseState } from '../../store';
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
    const currentProviderInStore = this.store.selectSignal((state) => state[authsFeatureKey].currentProvider)();

    if (currentProviderInStore) {
      this.logger.info(`Auth provider already set to '${currentProviderInStore}' by Initializer. AppsService initAuthProviders skipping init.`);
      return;
    }

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

		const fullPath = this.getFullPath(route);
    this.logger.info(`Full path for route resolution: '${fullPath}'`);

		// if (!fullPath) {
		// 	this.logger.warn('No valid path found, treating as default route:', route);
		// 	return of(null);
		// }

		const appRoutes: AppInfo[] | undefined = this.apps?.map(app => ({
			type: app.type,
			routes: app.routes || [],
			viewMode: app.viewMode,
			enabled: app.enabled,
      core: app.core
    }));

		let appRoutesMatched: AppInfo[] = [];

		if (fullPath && !this.isDefaultRoute(fullPath)) {
			appRoutesMatched = appRoutes?.filter(app =>
				app.routes?.some(r => r.includes(fullPath))
			) ?? [];
		}

		this.logger.info('Route fullPath:', fullPath, 'Matched appRoute:', appRoutesMatched);

    return this.store.select(state => state[appContextFeatureKey].apps).pipe(
      // waiting for all "finalizeApp" dispatches
      filter(apps => {
        if (!apps || apps.length === 0) return true;
        const allFinalized = !apps.some(app => !app.id);
        if (!allFinalized) {
          this.logger.info('Waiting for apps initialization (finalizeApp)...');
        }
        return allFinalized;
      }),
      // Return config in there are matched apps, or it's root route case
      map(apps => {
        if (appRoutesMatched.length > 0 || fullPath === '') {
          return { route, appsConfig: appRoutesMatched, apps } as AppConfig;
        }
        return null;
      })
    );
	}

  private handleResolvedApps(data: AppConfig | null) {
    const route = this.findDeepestChild(this.activatedRoute);
    const storedId = this.getStoredAppId();

    // Check if it is a root route
    const currentPath = route.snapshot.url.map(s => s.path).join('/');
    const isRoot = currentPath === '';

    if (data?.apps?.some(app => !app.id)) {
      this.logger.error('Some apps are not finalized...');
      return;
    }

    if (!data || !data.apps || data.apps.length === 0) {
      this.logger.warn(`No apps found (or data is null). Path: '${currentPath}'`);
      this.selectApp(undefined);
      return;
    }

    // domain filter
    const domainApps = data.apps.filter(app =>
      !app.domains || app.domains?.some((domain) => domain.includes(this.currentDomain))
    );

    if (domainApps.length === 0) {
      this.logger.warn(`No apps allowed for domain: ${this.currentDomain}`);
      this.selectApp(undefined);
      return;
    }

    // Auto-redirect logic
    // if there is a root route and only 1 app matched -> auto redirect on app home page
    if (isRoot && domainApps.length === 1) {
      const singleApp = domainApps[0];
      const targetUrl = singleApp.core?.url;

      if (targetUrl && targetUrl !== '/' && targetUrl !== '') {
        this.logger.info(`[AutoRedirect] Single app detected at root. Redirecting to: ${targetUrl}`);

        this.router.navigate([targetUrl], {
          queryParams: route.snapshot.queryParams,
          replaceUrl: true
        });

        // break flow, to prevent selectApp
        return;
      }
    }

    const matchedApps: AppInfo[] = domainApps
      .filter(app =>
        app.routes?.some(r => r.includes(route.routeConfig?.path!)) ||
        app.core?.url === '/' + route.routeConfig?.path ||
        (isRoot && app.core?.url)
      );

    let appToSelect: AppInfo | undefined;

    if (matchedApps.length === 1) {
      appToSelect = matchedApps[0];
      this.logger.info('Single app matched route:', appToSelect);
    } else if (matchedApps.length > 1) {
      appToSelect = matchedApps.find(a => a.id === storedId) || matchedApps[0];
      this.logger.info('Multiple apps matched route, selected:', appToSelect);
    } else {
      appToSelect = domainApps[0];
      this.logger.info('No specific route match. Falling back to domain default:', appToSelect);
    }

    const qp = new URLSearchParams(route.snapshot.queryParams).toString();
    const url = currentPath + (qp ? `?${qp}` : '');

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

	private getFullPath(route: ActivatedRoute): string {
		const segments: string[] = [];
		let current: ActivatedRoute | null = route.root;

		while (current) {
			const path = current.routeConfig?.path;
			if (path && path !== '') segments.push(path);
			current = current.firstChild ?? null;
		}

		return segments.join('/');
	}
}
