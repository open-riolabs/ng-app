import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavbarDropdownItemComponent, ToastService } from '@open-rlb/ng-bootstrap';
import { Router } from '@angular/router';
import { AppInfo, AppsService, LanguageService } from '../../../services';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';
import { AppContextActions, appContextFeatureKey, AuthActions, BaseState } from '../../../store';
import { Store } from '@ngrx/store';

@Component({
  selector: 'rlb-settings-dropdown-selector',
  standalone: false,
  templateUrl: './settings-dropdown-selector.component.html',
  styleUrl: './settings-dropdown-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDropdownSelectorComponent implements OnDestroy {
  mode = input<'desktop' | 'mobile'>('desktop');

  apps = input.required<AppInfo[]>();
  isAuthenticated = input.required<boolean | null>();
  appSelected = output<AppInfo>();
  activeSlide: number = 0;

  // deps
  private readonly pageOptions: PagesConfiguration | null = inject(RLB_CFG_PAGES, {
    optional: true,
  });
  private readonly store: Store<BaseState> = inject(Store);
  private readonly languageService: LanguageService = inject(LanguageService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly router: Router = inject(Router);
  private readonly menu = viewChild<NavbarDropdownItemComponent>('menu');
  private appsService: AppsService = inject(AppsService);

  readonly pages = computed(() => this.pageOptions);

  readonly languages = computed(() => {
    return (
      this.store.selectSignal(o => o[appContextFeatureKey].supportedLanguages)() as string[]
    ).map((lang: string) => {
      return {
        value: lang,
        label: this.languageService.getLanguageName(lang),
      };
    });
  });

  readonly currentLanguage = toSignal(
    this.store.select(o => o[appContextFeatureKey].language),
    { initialValue: 'en' },
  );

  readonly darkMode = computed(
    () => this.store.selectSignal(o => o[appContextFeatureKey].theme)() === 'dark',
  );

  readonly currentAppId = computed(() => this.appsService.currentApp?.id);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(() => this.close());
  }

  setCurrentLanguage(value: any) {
    this.store.dispatch(AppContextActions.setLanguage({ language: value }));
    this.toastService.openToast('toast-c-1', 'toast-component', {
      title: this.languageService.translate('common.saved'),
      content: this.languageService.translate('common.savedSuccessfully'),
      type: 'success',
      ok: this.languageService.translate('ok'),
    });
  }

  setDarkMode(value: boolean) {
    this.store.dispatch(AppContextActions.setTheme({ theme: value ? 'dark' : 'light' }));
    this.toastService.openToast('toast-c-1', 'toast-component', {
      title: this.languageService.translate('common.saved'),
      content: this.languageService.translate('common.savedSuccessfully'),
      type: 'success',
      ok: this.languageService.translate('ok'),
    });
  }

  selectApp(app: AppInfo): void {
    this.appSelected.emit(app);
  }

  goToFirstSlide() {
    this.activeSlide = 0;
  }

  goToInlineSettings() {
    this.activeSlide = 1;
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  ngOnDestroy() {}

  change(event: any) {
    if (event === 'hidden') {
      this.goToFirstSlide();
    }
  }

  isAppSelected(appId: string | undefined): boolean {
    return this.currentAppId() === appId;
  }

  private close() {
    this.menu()?.close();
  }
}
