import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { appContextFeatureKey } from '../../store/app-context/app-context.model';
import { BaseState } from '../../../public-api';

@Injectable({
  providedIn: 'root'
})
export class AppsService {

  get apps(){
    return this.store.selectSignal(state => state[appContextFeatureKey].apps)();
  }

  get currentApp(){
    return this.store.selectSignal(state => state[appContextFeatureKey].currentApp)();
  }

  get settings(){
    return this.store.selectSignal(state => state[appContextFeatureKey].apps?.map(o=> o.settings))();
  }

  constructor(
    private store: Store<BaseState>
  ) { }
}
