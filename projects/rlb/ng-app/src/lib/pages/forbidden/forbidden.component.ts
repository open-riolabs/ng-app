import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rlb-forbidden',
  imports: [TranslateModule],
  template: `<div class="container" style="height:calc(100vh - 58px);">
  <div class="align-center">
    <div class="text-center">
      <h1 class="text-primary">
        {{ 'pages.forbidden.title' | translate }}
      </h1>
      <p>{{ 'pages.forbidden.content' | translate }}</p><a href="/" class="btn btn-outline-primary">
        <span>
          {{ 'pages.forbidden.button' | translate }}
        </span></a>
    </div>
  </div>
</div>
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {

}
