import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';

@Component({
  selector: 'rlb-settings-list',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.css'
})
export class SettingsListComponent {
  constructor(private _location: Location) { }

  backClicked() {
    this._location.back();
  }
}
