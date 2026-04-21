import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rlb-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}

