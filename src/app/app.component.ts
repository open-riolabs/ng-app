import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppContextActions, BaseState, NavbarActions, RlbAppModule, SidebarActions } from '@sicilyaction/lib-ng-app';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RlbAppModule],
  template: `<rlb-app modal-container-id="modal-c-1" toast-container-ids="toast-c-1" />`,
})
export class AppComponent {

  constructor(public store: Store<BaseState>) {

    this.store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App' }, appId: 'chat-app-1' }));
    this.store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App' }, appId: 'chat-app-2' }));
    this.store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App' }, appId: 'chat-app-3' }));
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
        { title: 'Home', url: '' },
        { label: 'About', url: '/about', icon: 'bi bi-person' },
        { label: 'Contact', icon: 'bi bi-person', url: '/contact' },
        { label: 'Contact', url: '/contact', icon: 'bi bi-person', items: [{ label: 'Contact', url: '/contact' }] },
      ]
    }));
  }
}