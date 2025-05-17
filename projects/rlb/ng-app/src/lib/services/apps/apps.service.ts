import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppContextActions, BaseState } from '../../../public-api';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { AppInfo } from './app';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  get apps() {
    return this.store.selectSignal(state => state[appContextFeatureKey].apps)();
  }

  get currentApp() {
    return this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
  }

  selectApp(app: AppInfo, viewMode: 'app' | 'settings' = 'app') {
    const currentApp = this.currentApp;
    app.viewMode = viewMode;
    if (currentApp && currentApp.id === app.id) {
      return;
    }
    this.store.dispatch(AppContextActions.setCurrentApp({ app }));
  }

  constructor(
    private store: Store<BaseState>
  ) { }
}
