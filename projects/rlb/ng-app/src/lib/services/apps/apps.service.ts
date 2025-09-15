import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, mergeMap } from 'rxjs';
import { AuthConfiguration, RLB_CFG_AUTH } from '../../configuration';
import { AppContextActions, AuthActions, BaseState } from '../../store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AppInfo } from './app';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  constructor(
    private store: Store<BaseState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(RLB_CFG_AUTH) @Optional() confAuth: AuthConfiguration | undefined
  ) {
    console.log('AppsService initialized');
    if (confAuth?.providers && confAuth.providers.length === 1) {
			console.log('Single auth provider detected:', confAuth.providers[0]);
			store.dispatch(AuthActions.setCurrentProvider({ currentProvider: confAuth.providers[0].configId }));
    } else if (confAuth?.providers && confAuth.providers.length > 1) {
			console.log('Multiple auth providers detected, checking by domain:', this.currentDomain);
			const auth = confAuth.providers.filter(provider => provider.domains?.includes(this.currentDomain));
      if (auth && auth.length === 1) {
				console.log('Auth provider matched by domain:', auth[0]);
				store.dispatch(AuthActions.setCurrentProvider({ currentProvider: auth[0].configId }));
      } else if (auth && auth.length > 1) {
        console.warn(`Multiple auth providers found for the current domain: ${this.currentDomain}. Please specify a single provider in the configuration.`);
      } else {
        console.warn(`No auth provider found for the current domain: ${this.currentDomain}.`);
      }
    }
    const appRoutes: { type: string; routes: string[]; }[] | undefined = this.apps
      ?.map(app => ({
        type: app.type,
        routes: app.routes || [],
      }));
		console.log('Initialized appRoutes:', appRoutes);
		this.router.events
      .pipe(
        filter(event => {
					const isNavEnd = event instanceof NavigationEnd;
					if (!isNavEnd) console.debug('Router event ignored:', event);
					return isNavEnd;
				}),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
					console.log('Activated deepest child route:', route);
					
					return route;
        }),
        map(route => {
					if (!route.routeConfig) {
						console.warn('Route without config detected:', route);
						return null;
					}
          const appRoute = appRoutes?.filter(app => app.routes?.includes(route.routeConfig?.path!));
					console.log('Route config path:', route.routeConfig?.path, 'Matched appRoute:', appRoute);
					
					if (appRoute) {
            const apps = this.apps?.filter(app => appRoute?.some(a => a.type === app.type));
            if (apps && apps.length > 0) {
              return { route, apps };
            }
          }
          return null;
        }),
        mergeMap(data => {
					console.log('Before store select mergeMap. Data:', data);
					return this.store.select(state => state[appContextFeatureKey].apps)
					.pipe(map(apps => {
						const result = data ? { route: data.route, appsConfig: data.apps, apps: apps } : null;
						console.log('Store apps from state:', apps, 'Mapped result:', result);
						return result;
					}));
        }))
      .subscribe((data) => {
				console.log('Router subscription received data:', data);
				let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
				// Case: no data + single app available
				if (!data && route.snapshot.url.join('/') === '' && !route.snapshot.queryParamMap.keys.length && this.apps.length === 1) {
					console.log('No data, single app detected. Auto-selecting app:', this.apps[0]);
					this.selectApp(this.apps[0], 'app');
				}
        if (!data) {
					console.warn('No data resolved for current route, deselecting app.');
					this.selectApp();
          return;
        }
				
				if (!data.apps || data.apps.length === 0) {
					console.warn('No apps matched for this route:', data.route.routeConfig?.path);
					this.selectApp();
					return;
				}
				
        if (data && data.apps.some(app => !app.id)) {
          console.warn(`Some apps are not finalized. Please finalize all apps before using the AppsService.`);
          return;
        }
        const qp = new URLSearchParams(data.route.snapshot.queryParams).toString();
        const url = data.route.snapshot.url.map(segment => segment.path).join('/') + (qp ? `?${qp}` : '');
				console.log('Final resolved url:', url);
				
				if (data.apps.length === 1) {
					console.log('Exactly one app resolved. Selecting app:', data.apps[0]);
					this.selectApp(data.apps[0], data?.route.routeConfig?.path?.includes('settings') ? 'settings' : 'app', url);
          return;
        }
        const app = data.apps.find(app => app.id === localStorage.getItem('c-app-id'));
        if (app) {
					console.log('App resolved from localStorage c-app-id:', app);
					this.selectApp(app, data.route.routeConfig?.path?.includes('settings') ? 'settings' : 'app', url);
          return;
        }
        else {
          console.error(`No unique app was found for the current route: ${data.route.routeConfig?.path}. Check app ids configuration`);
          this.selectApp(data.apps[0], data.route.routeConfig?.path?.includes('settings') ? 'settings' : 'app', url);
        }
      });

  }

  get currentDomain() {
    return window.location.hostname;
  }
	
	get apps() {
		const apps = this.store.selectSignal(state => state[appContextFeatureKey].apps)()
		.filter(app => app.id && (app.domains === undefined || app.domains == null || app.domains.includes(this.currentDomain)));
		console.log('Filtered apps for currentDomain:', this.currentDomain, apps);
		return apps;
	}
	
	get currentApp() {
		const app = this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
		console.log('Current app from store:', app);
		return app;
	}

  selectApp(app?: AppInfo, viewMode?: 'app' | 'settings', url?: string) {
    const currentApp = this.currentApp;
		if (!app) {
			console.warn('Deselecting app (null).');
			this.store.dispatch(AppContextActions.setCurrentApp({ app: null }));
			return;
		}
		if (currentApp && currentApp.id === app.id && currentApp.viewMode === viewMode) {
			console.log('App already selected with same id and viewMode. Skipping dispatch.');
			return;
		}
		console.log('Dispatching setCurrentApp with:', { app, mode: viewMode, url });
		this.store.dispatch(AppContextActions.setCurrentApp({ app, mode: viewMode, url }));
  }
}
