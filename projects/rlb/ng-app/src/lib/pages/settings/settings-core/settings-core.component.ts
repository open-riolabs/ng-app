import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'rlb-settings-core',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-core.component.html',
  styleUrl: './settings-core.component.scss'
})
export class SettingsCoreComponent {
  constructor(private _location: Location) { }

  backClicked() {
    this._location.back();
  }
}
