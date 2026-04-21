import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CmsComponent } from '../../templates/cms/cms.component';

@Component({
  selector: 'rlb-cookies',
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.scss',
  imports: [CmsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesComponent {}

