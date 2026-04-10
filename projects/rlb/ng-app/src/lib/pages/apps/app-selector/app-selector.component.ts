import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { AppInfo } from '../../../services/apps/app';
import { AppsService } from '../../../services/apps/apps.service';
import { AuthenticationService } from '../../../auth/services/auth.service';

@Component({
  selector: 'rlb-app-selector',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './app-selector.component.html',
  styleUrl: './app-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSelectorComponent {
  private readonly _location = inject(Location);
  private readonly appsService = inject(AppsService);
  private readonly authService = inject(AuthenticationService);  readonly apps = this.appsService.apps;
  readonly auth$ = this.authService.isAuthenticated$;

  backClicked() {
    this._location.back();
  }

  selectApp(app: AppInfo) {
    this.appsService.selectApp(app, 'app');
  }
}

