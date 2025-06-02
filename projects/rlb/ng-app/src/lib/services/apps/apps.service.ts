import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { AppContextActions, BaseState } from '../../../public-api';
import { appContextFeatureKey, RLB_APPS } from '../../store/app-context/app-context.model';
import { AppInfo } from './app';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  constructor(
    private store: Store<BaseState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(RLB_APPS) @Optional() private confApps: AppInfo[] | undefined,
  ) {
    const appRoutes: { id: string; routes: string[]; }[] | undefined = confApps?.map(app => ({
      id: app.id,
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
            const apps = this.confApps?.filter(app => appRoute?.some(a => a.id === app.id));
            if (apps && apps.length > 0) {
              return { route, apps };
            }
          }
          return null;
        })
      )
      .subscribe((data) => {

        if (!data) {
          this.selectApp();
          return;
        }
        if (!data.apps || data.apps.length === 0) {
          this.selectApp();
          return;
        }
        const url = data.route.snapshot.url.map(segment => segment.path).join('/');
        console.log(`AppsService url: ${url}`);
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

  get apps() {
    return this.store.selectSignal(state => state[appContextFeatureKey].apps)();
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
