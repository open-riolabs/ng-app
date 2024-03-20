import { CommonModule, Location } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppsService } from '../../../services/apps/apps.service';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';


@Component({
  selector: 'rlb-settings-list',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.scss'
})
export class SettingsListComponent {
  constructor(
    private _location: Location,
    private appsService: AppsService,
    @Inject(RLB_CFG_PAGES) @Optional() private pageOptions: PagesConfiguration) { }

  get settings() {
    return this.appsService.settings;
  }

  backClicked() {
    this._location.back();
  }

  get pages() {
    return this.pageOptions;
  }
}
