import {
  booleanAttribute,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AppsService } from '../../services/apps/apps.service';
import { AclAction, normalizeAclActions } from '../../store/acl/acl.model';

/**
 * Renders its content only for a user holding the given ACL action in the current app.
 *
 * ```html
 * <button *roles="'sysadmin'">…</button>                              <!-- one action -->
 * <button *roles="[ACL.manager, ACL.director]">…</button>             <!-- any of them -->
 * <span   *roles="'x'; not: true">…</span>                            <!-- only without it -->
 * <button *roles="'x'; else hint">…</button><ng-template #hint>…</ng-template>
 * ```
 *
 * No action — `undefined`, `''` or `[]` — is public. An empty array in particular must not read as
 * "deny", or a consumer computing the list dynamically gets a blank UI the first time it comes back
 * empty. `not: true` inverts that decision like any other, so `*roles="[]; not: true"` renders
 * nothing.
 */
@Directive({
  selector: '[roles]',
})
export class RlbRole {
  private appsService = inject(AppsService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);

  /** The action, or the list the user only has to hold one of. */
  action = input<AclAction | undefined>(undefined, { alias: 'roles' });

  /** Render when the user *lacks* the action instead — an upsell or a read-only hint. */
  not = input(false, { alias: 'rolesNot', transform: booleanAttribute });

  /** Rendered instead when the check fails, mirroring `*ngIf`'s `; else`. */
  elseTemplate = input<TemplateRef<any> | null>(null, { alias: 'rolesElse' });

  /**
   * Which template is on screen right now.
   *
   * The effect below re-runs on every ACL or input change, most of which do not change the
   * outcome. Clearing and recreating unconditionally would remount the subtree each time and drop
   * whatever state lives inside it, so the view is only touched when the target actually changes.
   */
  private rendered: TemplateRef<any> | null = null;

  constructor() {
    // Effect automatically re-runs if store.resources or inputs change
    effect(() => {
      const target = this.granted() ? this.templateRef : this.elseTemplate();
      if (target === this.rendered) return;

      this.viewContainer.clear();
      this.rendered = target;
      if (target) {
        this.viewContainer.createEmbeddedView(target);
      }
    });
  }

  private granted(): boolean {
    const actions = normalizeAclActions(this.action());
    // If no action is provided, it's a public element -> Grant access automatically
    const hasPerm =
      actions.length === 0 ? true : this.appsService.checkPermissionInCurrentApp(actions);
    return this.not() ? !hasPerm : hasPerm;
  }
}
