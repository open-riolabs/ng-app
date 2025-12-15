import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AuthActions } from './auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthFeatureService {

  constructor(private store: Store) { }

  public login() {
    this.store.dispatch(AuthActions.login());
  }

  public logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
