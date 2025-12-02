import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, distinctUntilChanged, filter, map, Subscription, tap } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppsService } from '../../services/apps/apps.service';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { PwaUpdaterService } from '../../services/utils/pwa-updater.service';
import { AppContextActions, appContextFeatureKey, AppTheme, BaseState, PageTemplate } from '../../store';
import { AppLoggerService, LoggerContext } from "../../services";

@Component({
  selector: 'rlb-app',
  templateUrl: './app-container.component.html',
  standalone: false,
})
export class AppContainerComponent implements OnInit, OnDestroy {
  private swUpdateSubscription: Subscription | undefined;
  private readonly templateSubject = new BehaviorSubject<PageTemplate>('app');
  @Input('modal-container-id') modalContainerId!: string;
  @Input('toast-container-ids') toastContainerIds!: string | string[];
	private logger: LoggerContext;


	constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    private readonly router: Router,
    private storage: AppStorageService,
    private readonly pwaUpdaterService: PwaUpdaterService,
    private readonly appsService: AppsService,
		private readonly loggerService: AppLoggerService,
  ) {
		this.logger = this.loggerService.for(this.constructor.name);

		const theme: AppTheme = (this.storage.readLocal('theme') || 'light') as AppTheme;
    this.store.dispatch(AppContextActions.setTheme({ theme }));
    this.store.dispatch(AppContextActions.setLanguage({ language: this.storage.readLocal('locale') || 'en' }));
    this.store
      .select((state) => state[appContextFeatureKey].currentApp)
			.pipe(distinctUntilChanged())
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
        tap((template: PageTemplate) => this.templateSubject.next(template))
      ).subscribe();
  }

  get template$() {
    return this.templateSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.swUpdateSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    if (this.env.pwaUpdateEnabled) {
      this.swUpdateSubscription = this.pwaUpdaterService.checkWithDialog().subscribe();
    }
  }

}

