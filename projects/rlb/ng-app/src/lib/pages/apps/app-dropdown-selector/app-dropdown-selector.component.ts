import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AppInfo, AppsService } from '../../../services';

import {
  ButtonComponent,
  DropdownContainerComponent,
  NavbarDropdownItemComponent,
  TooltipDirective,
} from '@open-rlb/ng-bootstrap';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'rlb-app-dropdown-selector',
  templateUrl: './app-dropdown-selector.component.html',
  styleUrls: ['./app-dropdown-selector.component.scss'],
  imports: [
    NavbarDropdownItemComponent,
    DropdownContainerComponent,
    ButtonComponent,
    TooltipDirective,
    NgClass,
    NgTemplateOutlet,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDropdownSelectorComponent {
  mode = input<'desktop' | 'mobile'>('desktop');
  apps = input.required<AppInfo[]>();
  isAuthenticated = input.required<boolean | null>();

  appSelected = output<AppInfo>();

  private appsService: AppsService = inject(AppsService);

  readonly currentAppId = computed(() => this.appsService.currentApp()?.id);

  selectApp(app: AppInfo): void {
    this.appSelected.emit(app);
  }

  isAppSelected(appId: string | undefined): boolean {
    return this.currentAppId() === appId;
  }
}
