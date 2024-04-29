import { Component, OnInit, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RlbAppModule, BaseState, AuthActions, authsFeatureKey, Auth, SidebarActions, NavbarActions, appContextFeatureKey } from '@rlb/ng-app';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NavbarItemDemoComponent } from './nav-item.component';
import { AppContextActions } from '../../projects/rlb/ng-app/src/lib/store/app-context/app-context.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RlbAppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'riolabs-mistral-web';

  constructor(public store: Store<BaseState>) {
    store.select(o => o[appContextFeatureKey].currentApp).subscribe(o => console.log(o))
    this.store.dispatch(
      AppContextActions.setSupportedLanguages({
        supportedLanguages: ['en', 'it', 'ja'],
      }),
    );
  }

  navbarComponents: Type<any>[] = [NavbarItemDemoComponent, NavbarItemDemoComponent, NavbarItemDemoComponent];

  login(): void {
    this.store.dispatch(AuthActions.login());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  get auth(): Observable<Auth> {
    return this.store.select(o => o[authsFeatureKey]);
  }

  applyStore(action: "sideVisible"
    | "sideLogin" |
    "sideSearch" |
    "sideSettings" |
    "navVisible" |
    "navSearch" |
    "navHeader" |
    "navLeftItems" |
    "navRightItems", payload: any): void {
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
      case "navSearch":
        this.store.dispatch(NavbarActions.setSearchVisible({ visible: payload }));
        break;
      case "navHeader":
        this.store.dispatch(NavbarActions.setHeader({ header: payload }));
        break;
      case "navLeftItems":
        if (payload === "clear") this.store.dispatch(NavbarActions.setLeftItems({ items: [] }));
        if (payload === "add") this.store.dispatch(NavbarActions.setLeftItems({ items: ["demo"] }));
        break;
      case "navRightItems":
        if (payload === "clear") this.store.dispatch(NavbarActions.setRightItems({ items: [] }));
        if (payload === "add") this.store.dispatch(NavbarActions.setRightItems({ items: ["demo"] }));
        break;
    }
  }


}
