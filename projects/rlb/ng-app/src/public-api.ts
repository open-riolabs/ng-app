import { EnvironmentProviders, Provider, importProvidersFrom } from '@angular/core'
import { ProjectConfiguration, RLB_CFG, RLB_CFG_CMS, RLB_CFG_ENV, RLB_CFG_I18N, RLB_CFG_PAGES } from './lib/configuration'
import { RlbAppModule } from './lib/rlb-app.module'
import { RlbBootstrapModule } from '@rlb/ng-bootstrap'
import { ModalAppsComponent } from './lib/modals/modal-apps.component'
import { provideState, provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { authsFeature } from './lib/store/auth/auth.reducer'
import { AuthEffects } from './lib/store/auth/auth.effects'
import { AuthState } from './lib/store/auth/auth.model'
import { navbarsFeature } from './lib/store/navbar/navbar.reducer'
import { NavbarEffects } from './lib/store/navbar/navbar.effects'
import { sidebarsFeature } from './lib/store/sidebar/sidebar.reducer'
import { SidebarEffects } from './lib/store/sidebar/sidebar.effects'
import { SidebarState } from './lib/store/sidebar/sidebar.model'
import { NavbarState } from './lib/store/navbar/navbar.model'

export * from './lib/services'
export * from './lib/pipes'
export * from './lib/templates'
export * from './lib/auth/guards/oauth-password.guard'
export * from './lib/auth/guards/oauth.guard'
export * from './lib/auth/services/oauth-password.service'
export * from './lib/auth/user-claims'
export * from './lib/auth/user-info'
export * from './lib/rlb-app.module'

export * from './lib/pages/shared.routes'
export * from './lib/configuration'
export * from './lib/auth/auth.provider'

export * from './lib/store/auth/auth.actions'
export * from './lib/store/auth/auth.model'
export * from './lib/store/auth/auth-feature.service'
export * from './lib/store/navbar/navbar.actions'
export * from './lib/store/navbar/navbar.model'
export * from './lib/store/navbar/navbar-feature.service'
export * from './lib/store/sidebar/sidebar.actions'
export * from './lib/store/sidebar/sidebar.model'
export * from './lib/store/sidebar/sidebar-feature.service'

export function provideRlbConfig<T = { [k: string]: any }>(env: ProjectConfiguration<T>): (EnvironmentProviders | Provider)[] {
  return [
    importProvidersFrom([
      RlbBootstrapModule.forRoot({
        modals: [
          ModalAppsComponent

        ]
      }),
      RlbAppModule]),
      provideStore(),
      provideState(authsFeature),
      provideEffects(AuthEffects),
      provideState(navbarsFeature),
      provideEffects(NavbarEffects),
      provideState(sidebarsFeature),
      provideEffects(SidebarEffects),
    { provide: RLB_CFG, useValue: env },
    { provide: RLB_CFG_ENV, useValue: env.environment },
    { provide: RLB_CFG_CMS, useValue: env.cms },
    { provide: RLB_CFG_PAGES, useValue: env.pages },
  ]
}

export interface BaseState extends AuthState, SidebarState, NavbarState { }