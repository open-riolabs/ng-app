import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'rlb-privacy',
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {}

