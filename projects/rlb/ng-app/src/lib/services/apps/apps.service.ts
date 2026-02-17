import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, Observable, switchMap } from 'rxjs';
import { AclConfiguration, AuthConfiguration, RLB_CFG_ACL, RLB_CFG_AUTH } from '../../configuration';
import { aclFeatureKey, AppContextActions, AuthActions, authsFeatureKey, BaseState } from '../../store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AppInfo } from './app';
import { AppLoggerService, LoggerContext } from "./app-logger.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DEFAULT_ROUTES_CONFIG } from "../../pages/default-routes.config";

interface AppConfig {
  route: ActivatedRoute
  appsConfig: AppInfo<any>[]
  apps: AppInfo<any>[]
  fullPath: string;
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
    @Inject(RLB_CFG_AUTH) @Optional() readonly confAuth: AuthConfiguration | undefined,
    @Inject(RLB_CFG_ACL) @Optional() private readonly confAcl: AclConfiguration | undefined
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
    const apps = this.store.selectSignal(state => state[appContextFeatureKey].apps)()
    const resources = this.store.selectSignal(state => state[aclFeatureKey].resources)()
    const confAcl = this.confAcl;

    return apps.filter(app => {
      // Basic domain check
      const isDomainAllowed = !app.domains || app.domains.includes(this.currentDomain);
      if (!isDomainAllowed) return false;

      // If acl config doesnt exist return apps filtered by domain
      if (!confAcl) return true;

      if (!resources && app.actions?.length) return true

      if (!resources && app.actions && app.actions.length > 0) return false

      return resources?.some(userResource => {
        // Matching by Business ID
        // IMPORTANT: app.data must have key, name of this key is in confAcl
        const appBusId = app.data?.[confAcl.businessIdKey];
        const matchBusId = userResource.resourceBusinessId === appBusId;

        if (!matchBusId) return false;

        // Matching by Resource ID
        return userResource.resources.some(res => {
          const appResId = app.data?.[confAcl.resourceIdKey];
          const matchResId = res.resourceId === appResId;

          if (!matchResId) return false;

          return res.actions.some(action => app.actions?.includes(action));
        });
      });
    });
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

    // 1. Get abstract route template (LIKE ".../:id")
    const configPath = this.getConfigPath(route);

    // 2. Get REAL url path (LIKE ".../abc-123")
    const actualPath = this.getActualPath(route);

    this.logger.info(`Resolving. ConfigPath: '${configPath}', ActualPath: '${actualPath}'`);

    const appRoutes: AppInfo[] | undefined = this.apps?.map(app => ({
      type: app.type,
      routes: app.routes || [],
      viewMode: app.viewMode,
      enabled: app.enabled,
      core: app.core
    }));

    let appRoutesMatched: AppInfo[] = [];

    if (configPath && !this.isDefaultRoute(configPath)) {
      appRoutesMatched = appRoutes?.filter(app =>
        app.routes?.some(r => r.includes(configPath))
      ) ?? [];
    }

    this.logger.info('Matched appRoute:', appRoutesMatched);

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
      map(apps => {
        if (appRoutesMatched.length > 0 || actualPath === '') {
          return {
            route,
            appsConfig: appRoutesMatched,
            apps,
            fullPath: actualPath
          } as AppConfig;
        }
        return null;
      })
    );
  }

  private handleResolvedApps(data: AppConfig | null) {
    const route = this.findDeepestChild(this.activatedRoute);
    const storedId = this.getStoredAppId();

    // Check if route is root
    const currentPath = data ? data.fullPath : this.getActualPath(route);
    const isRoot = currentPath === '';

    //  Basic check
    if (data?.apps?.some(app => !app.id)) {
      this.logger.error('Some apps are not finalized...');
      return;
    }
    if (!data || !data.apps || data.apps.length === 0) {
      this.logger.warn(`No apps found. Path: '${currentPath}'`);
      this.selectApp(undefined);
      return;
    }

    // Filter by domain
    const domainApps = data.apps.filter(app =>
      !app.domains || app.domains?.some((domain) => domain.includes(this.currentDomain))
    );

    if (domainApps.length === 0) {
      this.logger.warn(`No apps allowed for domain: ${this.currentDomain}`);
      this.selectApp(undefined);
      return;
    }


    // CASE 1: SINGLE APP REDIRECT
    // We are in root route and there is only one app available

    if (isRoot && domainApps.length === 1) {
      const singleApp = domainApps[0];
      const targetUrl = singleApp.core?.url;

      if (targetUrl && targetUrl !== '/' && targetUrl !== '') {
        this.logger.info(`[AutoRedirect] Single app detected at root. Redirecting to: ${targetUrl}`);
        this.router.navigate([targetUrl], {
          queryParams: route.snapshot.queryParams,
          replaceUrl: true
        });
        return;
      }
    }

    // CASE 2: MULTI APP HUB / CORE HOME PAGE
    // We are in root route, and there are more than one app available
    // ====================================================================
    if (isRoot && domainApps.length > 1) {
      this.logger.info(`Root detected with multiple apps (${domainApps.length}). Showing App Hub / Core home page.`);
      const redirectApps = domainApps.filter((app) => app.autoRedirectOnRootEnabled);

      if (redirectApps?.length > 1) {
        this.logger.warn('Multiple apps have autoRedirectOnRootEnabled: true. Picking the first one.', redirectApps);
      }

      if (redirectApps.length) {
        const targetUrl = redirectApps[0].core?.url;
        this.logger.info(`[AutoRedirect] Detected app with root redirect. Redirecting to: ${targetUrl}`);
        this.router.navigate([targetUrl], {
          queryParams: route.snapshot.queryParams,
          replaceUrl: true
        });
        return;
      }

      this.selectApp(undefined); // Explicit reset chosen app
      return;
    }

    // CASE 3: Standard logic to get app (Deep linking) ---
    // Here we go only if route not empty  !="" and not root !="/"

    const matchedApps = domainApps.filter(app =>
      app.routes?.some(r => r.includes(route.routeConfig?.path!)) ||
      app.core?.url === '/' + route.routeConfig?.path
    );

    let appToSelect: AppInfo | undefined;

    if (matchedApps.length === 1) {
      appToSelect = matchedApps[0];
      this.logger.info('Single app matched route:', appToSelect);
    } else if (matchedApps.length > 1) {
      // Fallback in case of conflict routes
      appToSelect = matchedApps.find(a => a.id === storedId) || matchedApps[0];
      this.logger.info('Multiple apps matched route, selected:', appToSelect);
    } else {
      // Fallback: Route path doesn't exist
      appToSelect = undefined;
      this.logger.warn('No app matched this specific route:', currentPath);
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

  private getConfigPath(route: ActivatedRoute): string {
    const segments: string[] = [];
    let current: ActivatedRoute | null = route.root;

    while (current) {
      const path = current.routeConfig?.path;
      if (path && path !== '') segments.push(path);
      current = current.firstChild ?? null;
    }

    return segments.join('/');
  }

  private getActualPath(route: ActivatedRoute): string {
    const segments: string[] = [];
    let current: ActivatedRoute | null = route.root;

    while (current) {
      // map(s => s.path) extract params
      const path = current.snapshot.url.map(s => s.path).join('/');
      if (path && path !== '') segments.push(path);
      current = current.firstChild ?? null;
    }
    return segments.join('/');
  }
}
