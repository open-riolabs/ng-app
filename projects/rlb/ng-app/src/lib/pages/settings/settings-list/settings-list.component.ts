import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Inject, Optional } from '@angular/core';
import { Store } from '@ngrx/store';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ListComponent, ListItemImageComponent } from '@open-rlb/ng-bootstrap';
import { AppInfo } from '../../../services/apps/app';
import { AppsService } from '../../../services/apps/apps.service';
import { BaseState } from '../../../store/base-state';
import { AuthenticationService } from '../../../auth/services/auth.service';


@Component({
  selector: 'rlb-settings-list',
  imports: [CommonModule, RouterModule, TranslateModule, ListComponent, ListItemImageComponent],
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsListComponent {
  constructor(
    private readonly _location: Location,
    private readonly appsService: AppsService,
    private readonly authService: AuthenticationService,
    @Inject(RLB_CFG_PAGES) @Optional() private pageOptions: PagesConfiguration | undefined) { }

  readonly apps = this.appsService.apps;
  readonly pages = computed(() => this.pageOptions);

  /**
   * Whether a `pages.*` chrome entry is offered to the current visitor — same rule as the settings
   * dropdown, which lists the same pages: configured, and (if it declares one) the ACL action held.
   */
  isPageVisible(key: string): boolean {
    const page = this.pages()?.[key];
    if (!page?.path) return false;
    if (!page.action) return true;
    return this.appsService.checkPermissionAnywhere(page.action);
  }

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    this.appsService.selectApp(app, 'settings');
  }

  get auth$() {
    return this.authService.isAuthenticated$;
  }
}

