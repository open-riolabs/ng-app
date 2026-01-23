import { CommonModule, Location } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppInfo } from '../../../services/apps/app';
import { AppsService } from '../../../services/apps/apps.service';
import { BaseState } from '../../../store';
import { AuthenticationService } from '../../../auth/services/auth.service';


@Component({
  selector: 'rlb-settings-list',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.scss'
})
export class SettingsListComponent {
  constructor(
    private readonly _location: Location,
    private readonly appsService: AppsService,
    private readonly authService: AuthenticationService,
    @Inject(RLB_CFG_PAGES) @Optional() private pageOptions: PagesConfiguration | undefined) { }

  get apps() {
    return this.appsService.apps;
  }

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    this.appsService.selectApp(app, 'settings');
  }

  get pages() {
    return this.pageOptions;
  }

  get auth$() {
    return this.authService.isAuthenticated$;
  }
}
