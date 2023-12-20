import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RlbAppModule, BaseState, AuthActions, authsFeatureKey, Auth, SidebarActions, NavbarActions } from '@rlb/ng-app';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RlbAppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'riolabs-mistral-web';

  constructor(public store: Store<BaseState>) { }

  login(): void {
    this.store.dispatch(AuthActions.login());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  get auth(): Observable<Auth> {
    return this.store.select(o => o[authsFeatureKey]);
  }

  applyStore(action: "sideVisible" | "sideLogin" | "sideSearch" | "sideSettings" | "navVisible" | "navLogin" | "navSearch" | "navSettings", payload: any): void {
    switch (action) {
      case "sideVisible":
        this.store.dispatch(SidebarActions.setVisible({ visible: payload }));
        break;
      case "sideLogin":
        this.store.dispatch(SidebarActions.setLoginVisible({ visible: payload }));
        break;
      case "sideSearch":
        this.store.dispatch(SidebarActions.setSearchVisible({ visible: payload }));
        break;
      case "sideSettings":
        this.store.dispatch(SidebarActions.setSettingsVisible({ visible: payload }));
        break;
      case "navVisible":
        this.store.dispatch(NavbarActions.setVisible({ visible: payload }));
        break;
      case "navLogin":
        this.store.dispatch(NavbarActions.setLoginVisible({ visible: payload }));
        break;
      case "navSearch":
        this.store.dispatch(NavbarActions.setSearchVisible({ visible: payload }));
        break;
      case "navSettings":
        this.store.dispatch(NavbarActions.setSettingsVisible({ visible: payload }));
        break;
    }
  }


}
