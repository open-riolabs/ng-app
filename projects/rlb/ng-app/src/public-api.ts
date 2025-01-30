import { EnvironmentProviders, Provider, isDevMode } from '@angular/core'
import { provideRouter } from '@angular/router';
import { ProjectConfiguration, RLB_CFG, RLB_CFG_CMS, RLB_CFG_ENV, RLB_CFG_I18N, RLB_CFG_PAGES } from './lib/configuration'
import { RlbAppModule } from './lib/rlb-app.module'
import { ModalRegistryOptions, ToastRegistryOptions, provideRlbBootstrap } from '@rlb-core/lib-ng-bootstrap';
import { ModalAppsComponent } from './lib/modals/modal-apps.component'
import { provideState, provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { authsFeature } from './lib/store/auth/auth.reducer'
import { AuthEffects } from './lib/store/auth/auth.effects'
import { navbarsFeature } from './lib/store/navbar/navbar.reducer'
import { sidebarsFeature } from './lib/store/sidebar/sidebar.reducer'
import { RLB_APPS } from './lib/store';
import { appFeature } from './lib/store/app-context/app-context.reducer'
import { AppContextEffects } from './lib/store/app-context/app-context.effects'
import { ErrorModalComponent } from './lib/modals/error-modal.component';
import { ToastComponent } from './lib/toasts/error-toast.component';
import { getDefaultRoutes } from './lib/pages/shared.routes';
import { provideRlbI18n } from './lib/services/i18n/i18n.provider';
import { provideRlbCodeBrowserOAuth } from './lib/auth/auth.provider';
import { provideServiceWorker } from '@angular/service-worker';
import { AppDescriber } from './lib/services/apps/app-describer';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

export * from './lib/auth'
export * from './lib/guards'
export * from './lib/modals'
export * from './lib/pages/shared.routes'
export * from './lib/pipes'
export * from './lib/services'
export * from './lib/store'
export * from './lib/templates'
export * from './lib/toasts'

export * from './lib/configuration'
export * from './lib/rlb-app.module'

export function provideRlbConfig<T = { [k: string]: any }>(env: ProjectConfiguration<T>): (EnvironmentProviders | Provider)[] {
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
  ]
}

export function provideApp(app: AppDescriber): (EnvironmentProviders | Provider)[] {
  const providers: (EnvironmentProviders | Provider)[] = [
    { provide: RLB_APPS, useValue: app.info, multi: true },
  ];
  if (app.routes) {
    providers.push(provideRouter(app.routes))
  }
  if (app.providers) {
    providers.push(...app.providers)
  }
  return providers
}

