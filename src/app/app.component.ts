import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppContextActions, BaseState, NavbarActions, RlbAppModule, SidebarActions } from '@open-rlb/ng-app';


@Component({
  selector: 'app-root',
  imports: [RlbAppModule],
  template: `<rlb-app-container modal-container-id="modal-c-1" toast-container-ids="toast-c-1" />`,
})
export class AppComponent {

  constructor(public store: Store<BaseState>) {
    this.store.dispatch(
      AppContextActions.setSupportedLanguages({
        supportedLanguages: ['en', 'it', 'ja'],
      }),
    );


    this.store.dispatch(NavbarActions.setLoginVisible({ visible: true }));
    this.store.dispatch(NavbarActions.setSettingsVisible({ visible: true }));
    this.store.dispatch(NavbarActions.setAppsVisible({ visible: true }));
    this.store.dispatch(SidebarActions.setLoginVisible({ visible: false }));
    this.store.dispatch(SidebarActions.setSettingsVisible({ visible: false }));
    this.store.dispatch(SidebarActions.setAppsVisible({ visible: false }));
    this.store.dispatch(SidebarActions.setSearchVisible({ visible: false }));
    this.store.dispatch(SidebarActions.setItems({
      items: [
        { title: 'Home' },
        { label: 'Home', url: '/', icon: 'bi bi-house', badgeCounter: 1234 },
        { label: 'Profile', icon: 'bi bi-person', url: '/profile' },
        { label: 'Contact', url: '/contact', icon: 'bi bi-person' },
        { label:'test-external-link-container', icon: 'bi bi-link', items: [
            { label: 'external-link', icon: 'bi bi-github', externalUrl: 'https://github.com/open-riolabs/ng-app' }
          ]
        },
      ]
    }));
  }
}
