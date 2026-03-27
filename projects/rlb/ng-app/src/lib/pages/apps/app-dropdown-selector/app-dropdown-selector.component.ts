import { Component, inject, input, output } from '@angular/core';
import { AppInfo, AppsService } from '../../../services';

@Component({
  selector: 'rlb-app-dropdown-selector',
  standalone: false,
  templateUrl: './app-dropdown-selector.component.html',
  styleUrls: ['./app-dropdown-selector.component.scss'],
})
export class AppDropdownSelectorComponent {
  mode = input<'desktop' | 'mobile'>('desktop');
  apps = input.required<AppInfo[]>();
  isAuthenticated = input.required<boolean | null>();

  appSelected = output<AppInfo>();

  private appsService: AppsService = inject(AppsService);

  selectApp(app: any): void {
    this.appSelected.emit(app);
  }

  isAppSelected(appId: string | undefined): boolean {
    if (appId) {
      return this.appsService.isAppSelected(appId);
    } else {
      console.error('AppId is not defined');
      return false;
    }
  }
}
