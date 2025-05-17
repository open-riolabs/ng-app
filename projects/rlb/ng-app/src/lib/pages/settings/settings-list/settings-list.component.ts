import { CommonModule, Location } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppInfo } from '../../../services/apps/app';
import { AppsService } from '../../../services/apps/apps.service';


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
    @Inject(RLB_CFG_PAGES) @Optional() private pageOptions: PagesConfiguration) { }

  get apps() {
    return this.appsService.apps;
  }

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    app.viewMode = 'settings';
    this.appsService.selectApp(app);
  }

  get pages() {
    return this.pageOptions;
  }
}
