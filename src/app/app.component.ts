import { CommonModule } from '@angular/common';
import { Component, Type } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Auth, AuthActions, BaseState, NavbarActions, RlbAppModule, SidebarActions, appContextFeatureKey, authsFeatureKey } from '@rlb-core/lib-ng-app';
import { Observable } from 'rxjs';
import { AppContextActions } from '../../projects/rlb/ng-app/src/lib/store/app-context/app-context.actions';
import { NavbarItemDemoComponent } from './nav-item.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RlbAppModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'riolabs-mistral-web';

  constructor(
    public store: Store<BaseState>,
    private readonly router: Router
  ) {
    store.select(o => o[appContextFeatureKey].currentApp).subscribe(o => console.info(o));
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

    this.store
      .select((state) => state[appContextFeatureKey].currentApp)
      .subscribe((currentApp) => {
        if (currentApp && currentApp.viewMode === 'app' && currentApp.core) {
          this.router.navigate([currentApp.core.url]);
        }
        if (currentApp && currentApp.viewMode === 'settings' && currentApp.settings) {
          this.router.navigate([currentApp.settings.url]);
        }
      });
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

