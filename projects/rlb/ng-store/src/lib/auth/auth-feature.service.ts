import { Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthState } from './auth.model';
import { AuthActions } from './auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthFeatureService {

  constructor(@Optional() private store: Store<AuthState>) {
    if (!store || !store.selectSignal(o => o.auth)()) {
      console.error('Auth feature not provided. Please provide the Auth feature in your app config using `provideAuthFeature()`');
      return;
    }
  }

  public login() {
    this.store.dispatch(AuthActions.login());
  }

  public logout() {
    this.store.dispatch(AuthActions.logout());
  }

  public get isAuth() {
    return this.store.selectSignal(o => o.auth.isAuth)();
  }

  public get username() {
    return this.store.selectSignal(o => o.auth.username)();
  }

  public get idToken() {
    return this.store.selectSignal(o => o.auth.idToken)();
  }

  public get accessToken() {
    return this.store.selectSignal(o => o.auth.accessToken)();
  }

  public get userId() {
    return this.store.selectSignal(o => o.auth.userId)();
  }

  public get user() {
    return this.store.selectSignal(o => o.auth.user)();
  }

  public get isAuth$() {
    return this.store.select(o => o.auth.isAuth);
  }

  public get username$() {
    return this.store.select(o => o.auth.username);
  }

  public get idToken$() {
    return this.store.select(o => o.auth.idToken);
  }

  public get accessToken$() {
    return this.store.select(o => o.auth.accessToken);
  }

  public get userId$() {
    return this.store.select(o => o.auth.userId);
  }

  public get user$() {
    return this.store.select(o => o.auth.user);
  } 
}
