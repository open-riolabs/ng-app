import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { CmsComponent } from '../../templates/cms/cms.component';

@Component({
    selector: 'rlb-cms-content',
    templateUrl: './cms-content.component.html',
    styleUrl: './cms-content.component.scss',
    imports: [CmsComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsContentComponent {
  private readonly route = inject(ActivatedRoute);

  readonly contentId = toSignal(
    this.route.params.pipe(map(params => params['id'])),
    { initialValue: this.route.snapshot.params['id'] }
  );
}

