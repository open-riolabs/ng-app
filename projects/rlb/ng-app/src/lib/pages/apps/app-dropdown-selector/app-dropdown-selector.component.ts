import { Component, input, output } from '@angular/core';
import { AppInfo } from '../../../services';

@Component({
  selector: 'rlb-app-dropdown-selector',
  standalone: false,
  templateUrl: './app-dropdown-selector.component.html',
  styleUrls: ['./app-dropdown-selector.component.scss'],
})
export class AppDropdownSelectorComponent {
  mode = input<'desktop' | 'mobile'>('desktop');
  apps = input.required<AppInfo[]>();
  isAuth = input.required<boolean | null>();

  appSelected = output<AppInfo>();

  selectApp(app: any): void {
    this.appSelected.emit(app);
  }
}
