import { EnvironmentProviders } from '@angular/core'
import { provideEffects } from '@ngrx/effects'
import { provideState, provideStore } from '@ngrx/store'
import { NavbarEffects } from './navbar.effects'
import { navbarsFeature } from './navbar.reducer'

export * from './navbar-feature.service'
export * from './navbar.model'
export { NavbarActions } from './navbar.actions'

export function provideNavbarFeature(): EnvironmentProviders[] {
  return [
    provideStore(),
    provideState(navbarsFeature),
    provideEffects(NavbarEffects)
  ]
}