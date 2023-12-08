import { EnvironmentProviders } from '@angular/core'
import { provideEffects } from '@ngrx/effects'
import { provideState, provideStore } from '@ngrx/store'
import { SidebarEffects } from './sidebar.effects'
import { sidebarsFeature } from './sidebar.reducer'

export * from './sidebar-feature.service'
export * from './sidebar.model'
export { SidebarActions } from './sidebar.actions'

export function provideSidebarFeature(): EnvironmentProviders[] {
  return [
    provideStore(),
    provideState(sidebarsFeature),
    provideEffects(SidebarEffects)
  ]
}