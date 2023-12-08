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
}
