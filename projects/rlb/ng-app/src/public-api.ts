import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EnvironmentProviders, isDevMode, Provider } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { ModalRegistryOptions, provideRlbBootstrap, ToastRegistryOptions } from '@lbdsh/lib-ng-bootstrap';
import { provideRlbCodeBrowserOAuth } from './lib/auth/auth.provider';
import {
	ProjectConfiguration,
	RLB_CFG,
	RLB_CFG_CMS,
	RLB_CFG_ENV,
	RLB_CFG_I18N,
	RLB_CFG_PAGES
} from './lib/configuration';
import { ErrorModalComponent } from './lib/modals/error-modal.component';
import { ModalAppsComponent } from './lib/modals/modal-apps.component';
import { getDefaultRoutes } from './lib/pages/shared.routes';
import { RlbAppModule } from './lib/rlb-app.module';
import { AppDescriber } from './lib/services/apps/app-describer';
import { provideRlbI18n } from './lib/services/i18n/i18n.provider';
import { RLB_APPS } from './lib/store';
import { AppContextEffects } from './lib/store/app-context/app-context.effects';
import { appFeature } from './lib/store/app-context/app-context.reducer';
import { AuthEffects } from './lib/store/auth/auth.effects';
import { authsFeature } from './lib/store/auth/auth.reducer';
import { navbarsFeature } from './lib/store/navbar/navbar.reducer';
import { sidebarsFeature } from './lib/store/sidebar/sidebar.reducer';
import { ToastComponent } from './lib/toasts/error-toast.component';

export * from './lib/auth';
export * from './lib/guards';
export * from './lib/modals';
export * from './lib/pages/shared.routes';
export * from './lib/pipes';
export * from './lib/services';
export * from './lib/store';
export * from './lib/templates';
export * from './lib/toasts';

export * from './lib/configuration';
export * from './lib/rlb-app.module';

export function provideRlbConfig<T = { [k: string]: any; }>(env: ProjectConfiguration<T>): (EnvironmentProviders | Provider)[] {
  return [
    provideRlbBootstrap(),
    RlbAppModule,
    provideStore(),
    provideState(authsFeature),
    provideEffects(AuthEffects),
    provideState(navbarsFeature),
    provideState(sidebarsFeature),
    provideState(appFeature),
    provideEffects(AppContextEffects),
    provideRouter(getDefaultRoutes(env.pages)),
    provideRlbCodeBrowserOAuth(env.auth),
    provideRlbI18n(env.i18n),
    provideHttpClient(withInterceptorsFromDi()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:15000',
    }),
    { provide: RLB_CFG, useValue: env },
    { provide: RLB_CFG_ENV, useValue: env.environment },
    { provide: RLB_CFG_CMS, useValue: env.cms },
    { provide: RLB_CFG_PAGES, useValue: env.pages },
    { provide: RLB_CFG_I18N, useValue: env.i18n },
    {
      provide: ModalRegistryOptions, useValue: {
        modals: {
          "modal-apps-component": ModalAppsComponent,
          'error-modal-component': ErrorModalComponent,
        }
      }, multi: true
    },
    {
      provide: ToastRegistryOptions,
      useValue: {
        toasts: {
          'toast-component': ToastComponent,
        },
      },
      multi: true,
    },
  ];
}

export function provideApp(app: AppDescriber): (EnvironmentProviders | Provider)[] {
	const routesPaths = app.routes ? flattenRoutes(app.routes) : [];
	
	const providers: (EnvironmentProviders | Provider)[] = [{
    provide: RLB_APPS, useValue: {
      ...app.info,
      routes: routesPaths,
    }, multi: true
  },];
	console.log("provide App app: ", JSON.stringify(app));
	console.log("provide App routesPaths: ", JSON.stringify(routesPaths));
  if (app.routes) {
    providers.push(provideRouter(app.routes));
  }
  if (app.providers) {
    providers.push(...app.providers);
  }
  return providers;
}

function flattenRoutes(routes: Route[], parentPath = ''): string[] {
	return routes.flatMap(route => {
		const fullPath = route.path ? `${parentPath}${parentPath && '/'}${route.path}` : parentPath;
		const childPaths = route.children ? flattenRoutes(route.children, fullPath) : [];
		return route.path ? [fullPath, ...childPaths] : childPaths;
	});
}
