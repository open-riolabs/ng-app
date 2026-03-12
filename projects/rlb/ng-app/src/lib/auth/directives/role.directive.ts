import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AppsService } from '../../services';

@Directive({
  selector: '[roles]',
  standalone: false,
})
export class RlbRole {
  private appsService = inject(AppsService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  action = input<string | undefined>(undefined, { alias: 'roles' });

  constructor() {
    // Effect automatically re-runs if store.resources or inputs change
    effect(() => {
      const action = this.action();
      // If no action is provided, it's a public element -> Grant access automatically
      const hasPerm = !action ? true : this.appsService.checkPermissionInCurrentApp(action);

      this.viewContainer.clear();
      if (hasPerm) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
