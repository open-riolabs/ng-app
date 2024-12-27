import { Component, OnInit } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { Store } from '@ngrx/store';
import { AppContextActions, AppContextActionsInternal, BaseState, appContextFeatureKey } from '../../../../public-api';
import { AppInfo } from '../../../services/apps/app';
import { CommonModule, Location } from '@angular/common';
import { AppsService } from '../../../services/apps/apps.service';

@Component({
  selector: 'rlb-app-selector',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './app-selector.component.html',
  styleUrl: './app-selector.component.scss'
})
export class AppSelectorComponent implements OnInit {

  apps: AppInfo[] = [];

  ngOnInit() {
    this.apps = this.appsService.apps;
  }

  constructor(
    private readonly appsService: AppsService,
    private readonly _location: Location,
    private readonly store: Store<BaseState>
  ) { }

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    this.store.dispatch(AppContextActions.setCurrentApp({ app }));
  }
}
