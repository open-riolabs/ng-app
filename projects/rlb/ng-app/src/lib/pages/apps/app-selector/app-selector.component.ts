import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppInfo } from '../../../services/apps/app';
import { AppsService } from '../../../services/apps/apps.service';

@Component({
  selector: 'rlb-app-selector',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './app-selector.component.html',
  styleUrl: './app-selector.component.scss'
})
export class AppSelectorComponent {

  constructor(
    private readonly _location: Location,
    private readonly appsService: AppsService,

  ) { }

  get apps() {
    return this.appsService.apps;
  }

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    this.appsService.selectApp(app, 'app');
  }
}
