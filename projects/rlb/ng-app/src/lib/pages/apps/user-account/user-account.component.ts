import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'rlb-user-account',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.css'
})
export class UserAccountComponent {
  constructor(private _location: Location) { }

  backClicked() {
    this._location.back();
  }
}
