import { Injectable, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { SidebarState } from './sidebar.model';
import { SidebarActions } from './sidebar.actions';

@Injectable({
  providedIn: 'root'
})
export class SidebarFeatureService {

  constructor(@Optional() private store: Store<SidebarState>) {
    if (!store || !store.selectSignal(o => o.sidebar)()) {
      console.error('Sidebar feature not provided. Please provide the Sidebar feature in your app config using `provideSidebarFeature()`');
      return;
    }
  }
}
