import { EnvironmentProviders, Provider, importProvidersFrom } from '@angular/core'
import { ProjectConfiguration, RLB_CFG, RLB_CFG_CMS, RLB_CFG_ENV, RLB_CFG_I18N, RLB_CFG_PAGES } from './lib/configuration'
import { RlbAppModule } from './lib/rlb-app.module'
import { RlbBootstrapModule } from '@rlb/ng-bootstrap'
import { ModalAppsComponent } from './lib/modals/modal-apps.component'

export * from './lib/services'
export * from './lib/pipes'
export * from './lib/templates'
export * from './lib/auth/guards/oauth-password.guard'
export * from './lib/auth/guards/oauth.guard'
export * from './lib/auth/services/auth.service'
export * from './lib/auth/services/oauth-password.service'
export * from './lib/auth/user-claims'
export * from './lib/auth/user-info'
export * from './lib/rlb-app.module'

export * from './lib/pages/shared.routes'
export * from './lib/configuration'
export * from './lib/auth/auth.provider'
export * from './lib/store'

export function provideRlbConfig<T = { [k: string]: any }>(env: ProjectConfiguration<T>): (EnvironmentProviders | Provider)[] {
  return [
    importProvidersFrom([
      RlbBootstrapModule.forRoot({
        modals: [
          ModalAppsComponent

        ]
      }),
      RlbAppModule]),
    { provide: RLB_CFG, useValue: env },
    { provide: RLB_CFG_ENV, useValue: env.environment },
    { provide: RLB_CFG_CMS, useValue: env.cms },
    { provide: RLB_CFG_PAGES, useValue: env.pages },
  ]
}