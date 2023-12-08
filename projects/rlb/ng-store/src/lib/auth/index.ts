import { EnvironmentProviders } from '@angular/core'
import { provideEffects } from '@ngrx/effects'
import { provideState, provideStore } from '@ngrx/store'
import { AuthEffects } from './auth.effects'
import { authsFeature } from './auth.reducer'

export * from './auth-feature.service'
export * from './auth.model'
export { AuthActions } from './auth.actions'

export function provideAuthFeature(): EnvironmentProviders[] {
  return [
    provideStore(),
    provideState(authsFeature),
    provideEffects(AuthEffects)
  ]
}