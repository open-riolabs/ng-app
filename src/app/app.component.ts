import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RlbAppModule, BaseState, AuthActions, Auth, authsFeatureKey, SidebarActions, NavbarActions } from '@rlb/ng-app';
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

  applyStore(action: "sideVisible" | "sideLogin" | "sideSearch" | "navVisible" | "navLogin" | "navSearch", payload: any): void {
    switch (action) {
      case "sideVisible":
        this.store.dispatch(SidebarActions.setVisible({ visible: payload }));
        break;
      case "sideLogin":
        this.store.dispatch(SidebarActions.setHasLogin({ visible: payload }));
        break;
      case "sideSearch":
        this.store.dispatch(SidebarActions.setHasSearch({ visible: payload }));
        break;
      case "navVisible":
        this.store.dispatch(NavbarActions.setVisible({ visible: payload }));
        break;
      case "navLogin":
        this.store.dispatch(NavbarActions.setHasLogin({ visible: payload }));
        break;
      case "navSearch":
        this.store.dispatch(NavbarActions.setHasSearch({ visible: payload }));
        break;
    }
  }


}
