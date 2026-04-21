import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CmsComponent } from '../../templates/cms/cms.component';

@Component({
  selector: 'rlb-privacy',
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  imports: [CmsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {}

