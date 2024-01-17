import { EnvironmentProviders, Provider } from '@angular/core'
import { ProjectConfiguration, RLB_CFG, RLB_CFG_CMS, RLB_CFG_ENV, RLB_CFG_I18N, RLB_CFG_PAGES } from './lib/configuration'
import { RlbAppModule } from './lib/rlb-app.module'
import { ModalRegistryOptions, RlbBootstrapModule } from '@rlb/ng-bootstrap'
import { ModalAppsComponent } from './lib/modals/modal-apps.component'
import { provideState, provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { authsFeature } from './lib/store/auth/auth.reducer'
import { AuthEffects } from './lib/store/auth/auth.effects'
import { AuthState } from './lib/store/auth/auth.model'
import { navbarsFeature } from './lib/store/navbar/navbar.reducer'
import { sidebarsFeature } from './lib/store/sidebar/sidebar.reducer'
import { SidebarState } from './lib/store/sidebar/sidebar.model'
import { NavbarState } from './lib/store/navbar/navbar.model'
import { appContextFeature } from './lib/store/app-context/app-context.reducer'
import { AppContextEffects } from './lib/store/app-context/app-context.effects'

export * from './lib/services'
export * from './lib/pipes'
export * from './lib/templates'
export * from './lib/auth'
export * from './lib/rlb-app.module'
export * from './lib/pages/shared.routes'
export * from './lib/configuration'
export * from './lib/store/auth/auth.actions'
export * from './lib/store/auth/auth.model'
export * from './lib/store/auth/auth-feature.service'
export * from './lib/store/navbar/navbar.actions'
export * from './lib/store/navbar/navbar.model'
export * from './lib/store/sidebar/sidebar.actions'
export * from './lib/store/sidebar/sidebar.model'

export function provideRlbConfig<T = { [k: string]: any }>(env: ProjectConfiguration<T>): (EnvironmentProviders | Provider)[] {
  return [
    RlbBootstrapModule,
    RlbAppModule,
    provideStore(),
    provideState(authsFeature),
    provideEffects(AuthEffects),
    provideState(navbarsFeature),
    provideState(sidebarsFeature),
    provideState(appContextFeature),
    provideEffects(AppContextEffects),
    { provide: RLB_CFG, useValue: env },
    { provide: RLB_CFG_ENV, useValue: env.environment },
    { provide: RLB_CFG_CMS, useValue: env.cms },
    { provide: RLB_CFG_PAGES, useValue: env.pages },
    { provide: RLB_CFG_I18N, useValue: env.i18n },
    { provide: ModalRegistryOptions, useValue: { modals: [ModalAppsComponent] }, multi: true }
  ]
}

export interface BaseState extends AuthState, SidebarState, NavbarState { }
