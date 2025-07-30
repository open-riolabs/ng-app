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
      store.dispatch(AuthActions.setCurrentProvider({ currentProvider: confAuth.providers[0].configId }));
    } else if (confAuth?.providers && confAuth.providers.length > 1) {
      const auth = confAuth.providers.filter(provider => provider.domains?.includes(this.currentDomain));
      if (auth && auth.length === 1) {
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
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        map(route => {
          if (!route.routeConfig) return null;
          const appRoute = appRoutes?.filter(app => app.routes?.includes(route.routeConfig?.path!));
          if (appRoute) {
            const apps = this.apps?.filter(app => appRoute?.some(a => a.type === app.type));
            if (apps && apps.length > 0) {
              return { route, apps };
            }
          }
          return null;
        }),
        mergeMap(data => {
          return this.store.select(state => state[appContextFeatureKey].apps)
            .pipe(map(apps => data ? { route: data.route, appsConfig: data.apps, apps: apps } : null));
        }))
      .subscribe((data) => {
        let route = this.activatedRoute;
        while (route.firstChild && route.firstChild.snapshot.url.length) {
          route = route.firstChild;
        }
        if (!data && route.snapshot.url.join('/') === '' && !route.snapshot.queryParamMap.keys.length && this.apps.length === 1) {
          this.selectApp(this.apps[0], 'app');
        }
        if (!data) {
          this.selectApp();
          return;
        }
        if (!data.apps || data.apps.length === 0) {
          this.selectApp();
          return;
        }
        if (data && data.apps.some(app => !app.id)) {
          console.warn(`Some apps are not finalized. Please finalize all apps before using the AppsService.`);
          return;
        }
        const qp = new URLSearchParams(data.route.snapshot.queryParams).toString();
        const url = data.route.snapshot.url.map(segment => segment.path).join('/') + (qp ? `?${qp}` : '');
        if (data.apps.length === 1) {
          this.selectApp(data.apps[0], data?.route.routeConfig?.path?.includes('settings') ? 'settings' : 'app', url);
          return;
        }
        const app = data.apps.find(app => app.id === localStorage.getItem('c-app-id'));
        if (app) {
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
    return this.store.selectSignal(state => state[appContextFeatureKey].apps)()
      .filter(app => app.id && (app.domains === undefined || app.domains == null || app.domains.includes(this.currentDomain)));
  }

  get currentApp() {
    return this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
  }

  selectApp(app?: AppInfo, viewMode?: 'app' | 'settings', url?: string) {
    const currentApp = this.currentApp;
    if (!app) {
      this.store.dispatch(AppContextActions.setCurrentApp({ app: null }));
      return;
    }
    if (currentApp && currentApp.id === app.id && currentApp.viewMode === viewMode) {
      return;
    }
    this.store.dispatch(AppContextActions.setCurrentApp({ app, mode: viewMode, url }));
  }
}
