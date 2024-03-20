import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppsService } from '../../../services/apps/apps.service';


@Component({
  selector: 'rlb-settings-list',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.css'
})
export class SettingsListComponent {
  constructor(
    private _location: Location,
    private appsService: AppsService) { }

  get settings() {
    return this.appsService.settings;
  }

  backClicked() {
    this._location.back();
  }
}
