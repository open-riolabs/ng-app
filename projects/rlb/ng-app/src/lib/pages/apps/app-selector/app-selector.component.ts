import { Component, OnInit } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { Store } from '@ngrx/store';
import { BaseState, appContextFeatureKey } from '../../../../public-api';
import { AppItem } from '../../../services/apps/app';
import { CommonModule, Location } from '@angular/common';
import { AppsService } from '../../../services/apps/apps.service';

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
    this.apps = this.appsService.apps;
  }

  constructor(
    private appsService: AppsService,
    private _location: Location
  ) { }

  backClicked() {
    this._location.back();
  }
}
