import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, filter, map, tap } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppsService } from '../../services/apps/apps.service';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { PwaUpdaterService } from '../../services/utils/pwa-updater.service';
import {
  AppContextActions,
  appContextFeatureKey,
  AppTheme,
  BaseState,
  PageTemplate
} from '../../store';
import { AppLoggerService, LoggerContext } from "../../services";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'rlb-app-container',
  templateUrl: './app-container.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppContainerComponent {
  protected readonly Array = Array;
  private readonly templateSubject = new BehaviorSubject<PageTemplate>('app');
  readonly modalContainerId = input.required<string>({ alias: 'modal-container-id' });
  readonly toastContainerIds = input.required<string | string[]>({ alias: 'toast-container-ids' });

  private readonly env = inject(RLB_CFG_ENV);
  private readonly store = inject(Store<BaseState>);
  private readonly router = inject(Router);
  private readonly storage = inject(AppStorageService);
  private readonly pwaUpdaterService = inject(PwaUpdaterService);
  private readonly appsService = inject(AppsService);
  private readonly loggerService = inject(AppLoggerService);

  private readonly logger: LoggerContext = this.loggerService.for(this.constructor.name);

  constructor() {
    const theme: AppTheme = (this.storage.readLocal('theme') || 'dark') as AppTheme;
    this.store.dispatch(AppContextActions.setTheme({ theme }));
    this.store.dispatch(AppContextActions.setLanguage({ language: this.storage.readLocal('locale') || 'en' }));

    this.store
      .select((state) => state[appContextFeatureKey].currentApp)
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(async (currentApp) => {
        this.logger.info('currentApp:', currentApp);

        if (!currentApp) return;

        const targetUrl = currentApp.navigationUrl ||
          (currentApp.viewMode === 'app'
            ? currentApp.core?.url
            : currentApp.settings?.url);

        if (!targetUrl) return;

        const currentUrl = this.router.url;
        this.logger.info('currentUrl:', currentUrl);
        this.logger.info('targetUrl:', targetUrl);

        const normalize = (url: string) => url.replace(/\/+$/, '');
        const current = normalize(currentUrl);
        const target = normalize(targetUrl);

        if (current === target || current.startsWith(`${target}/`)) {
          this.logger.info('Already within target route, skipping navigation.');
        } else {
          this.logger.info('Navigating to app base URL:', target);
          await this.router.navigateByUrl(target);
        }
      });

    this.router.events
      .pipe(
        filter(event => event instanceof RoutesRecognized),
        map((event: RoutesRecognized) => event?.state?.root?.firstChild?.data?.['template'] || 'app'),
        map(o => o as PageTemplate),
        tap((template: PageTemplate) => this.templateSubject.next(template)),
        takeUntilDestroyed()
      ).subscribe();

    if (this.env.pwaUpdateEnabled) {
      this.pwaUpdaterService.checkWithDialog().pipe(takeUntilDestroyed()).subscribe();
    }
  }

  get template$() {
    return this.templateSubject.asObservable();
  }
}


