import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'rlb-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {}

