import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AppInfo, AppsService } from '../../../services';

@Component({
  selector: 'rlb-app-dropdown-selector',
  standalone: false,
  templateUrl: './app-dropdown-selector.component.html',
  styleUrls: ['./app-dropdown-selector.component.scss'],
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

