import { Component, OnInit } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { Store } from '@ngrx/store';
import { BaseState, appContextFeatureKey } from '../../../../public-api';
import { AppItem } from '../../../services/apps/app';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'rlb-app-selector',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './app-selector.component.html',
  styleUrl: './app-selector.component.scss'
})
export class AppSelectorComponent implements OnInit {

  apps: AppItem[] = [];

  ngOnInit() {
    this.apps = this.store.selectSignal(state => state[appContextFeatureKey].apps)();
  }

  constructor(
    private store: Store<BaseState>,
    private _location: Location
  ) { }

  backClicked() {
    this._location.back();
  }
}
