import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, filter, map, Subscription, tap } from 'rxjs';
import { EnvironmentConfiguration, RLB_CFG_ENV } from '../../configuration';
import { AppsService } from '../../services/apps/apps.service';
import { AppStorageService } from '../../services/utils/app-storage.service';
import { PwaUpdaterService } from '../../services/utils/pwa-updater.service';
import { AppContextActions, appContextFeatureKey, AppTheme, AuthActions, authsFeatureKey, BaseState, PageTemplate } from '../../store';

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

  constructor(
    @Inject(RLB_CFG_ENV) public env: EnvironmentConfiguration,
    public store: Store<BaseState>,
    private readonly router: Router,
    private storage: AppStorageService,
    private readonly pwaUpdaterService: PwaUpdaterService,
    private readonly appsService: AppsService,
  ) {
    const theme: AppTheme = (this.storage.readLocal('theme') || 'light') as AppTheme;
    this.store.dispatch(AppContextActions.setTheme({ theme }));
    this.store.dispatch(AppContextActions.setLanguage({ language: this.storage.readLocal('locale') || 'en' }));
    this.store
      .select((state) => state[appContextFeatureKey].currentApp)
      .subscribe(async (currentApp) => {
        if (currentApp && currentApp.viewMode === 'app' && currentApp.core) {
          await this.router.navigate([currentApp.navigationUrl || currentApp.core.url]);
          console.debug(`AppContainerComponent: Navigating to app `, this.store.selectSignal((state) => state[authsFeatureKey].isAuth)());
          if (currentApp.core.auth && !this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
            this.store.dispatch(AuthActions.login());
          }
        }
        if (currentApp && currentApp.viewMode === 'settings' && currentApp.settings) {
          await this.router.navigate([currentApp.navigationUrl || currentApp.settings.url]);
          if (currentApp.settings.auth && !this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
            this.store.dispatch(AuthActions.login());
          }
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

