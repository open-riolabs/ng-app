import { Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavbarState } from './navbar.model';
import { NavbarActions } from './navbar.actions';

@Injectable({
  providedIn: 'root'
})
export class NavbarFeatureService {

  constructor(@Optional() private store: Store<NavbarState>) {
    if (!store || !store.selectSignal(o => o.navbar)()) {
      console.error('Navbar feature not provided. Please provide the Navbar feature in your app config using `provideNavbarFeature()`');
      return;
    }
  }

  public updateNavbar(items: any[]) {
    this.store.dispatch(NavbarActions.update({ items }));
  }

  public setHasLogin(visible: boolean) {
    this.store.dispatch(NavbarActions.setHasLogin({ visible }));
  }

  public setHasSearch(visible: boolean) {
    this.store.dispatch(NavbarActions.setHasSearch({ visible }));
  }

  public setVisible(visible: boolean) {
    this.store.dispatch(NavbarActions.setVisible({ visible }));
  }

  public selectNavbarState() {
    return this.store.selectSignal(o => o.navbar)();
  }

  public selectNavbar$() {
    return this.store.select(o => o.navbar);
  }
}
