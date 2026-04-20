import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CmsComponent } from '../../templates/cms/cms.component';

@Component({
  selector: 'rlb-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrl: './terms-and-conditions.component.scss',
  imports: [CmsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {}

