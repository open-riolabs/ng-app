import { Component, inject, input, OnDestroy, output, viewChild } from '@angular/core';
import {
  NavbarDropdownItemComponent,
  ToastService,
  VisibilityEventBase,
} from '@open-rlb/ng-bootstrap';
import { Router } from '@angular/router';
import { AppInfo, LanguageService } from '../../../services';
import { PagesConfiguration, RLB_CFG_PAGES } from '../../../configuration';
import { AppContextActions, appContextFeatureKey, BaseState } from '../../../store';
import { Store } from '@ngrx/store';

@Component({
  selector: 'rlb-settings-dropdown-selector',
  standalone: false,
  templateUrl: './settings-dropdown-selector.component.html',
  styleUrl: './settings-dropdown-selector.component.scss',
})
export class SettingsDropdownSelectorComponent implements OnDestroy {
  apps = input.required<AppInfo[]>();
  navbarHasSettings = input.required();
  navbarHasLogin = input.required();
  isAuth = input.required();
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
  private readonly menu = viewChild.required<NavbarDropdownItemComponent>('menu');

  constructor() {
    this.router.events.subscribe(() => this.close());
  }

  get pages() {
    return this.pageOptions;
  }

  selectApp(app: AppInfo): void {
    this.appSelected.emit(app);
  }

  goToFirst() {
    this.activeSlide = 0;
  }

  goToInlineSettings() {
    this.activeSlide = 1;
  }

  ngOnDestroy() {}

  change(event: VisibilityEventBase) {
    if (event === 'hidden') {
      this.goToFirst();
    }
  }

  get languages() {
    return this.store
      .selectSignal(o => o[appContextFeatureKey].supportedLanguages)()
      .map((lang: string) => {
        return {
          value: lang,
          label: this.languageService.getLanguageName(lang),
        };
      });
  }

  get currentLanguage() {
    return this.store.selectSignal(o => o[appContextFeatureKey].language)() as string;
  }

  set currentLanguage(value: string) {
    this.store.dispatch(AppContextActions.setLanguage({ language: value }));
    this.toastService.openToast('toast-c-1', 'toast-component', {
      title: this.languageService.translate('common.saved'),
      content: this.languageService.translate('common.savedSuccessfully'),
      type: 'success',
      ok: this.languageService.translate('ok'),
    });
  }

  get darkMode() {
    return this.store.selectSignal(o => o[appContextFeatureKey].theme)() === 'dark';
  }

  set darkMode(value: boolean) {
    this.store.dispatch(AppContextActions.setTheme({ theme: value ? 'dark' : 'light' }));
    this.toastService.openToast('toast-c-1', 'toast-component', {
      title: this.languageService.translate('common.saved'),
      content: this.languageService.translate('common.savedSuccessfully'),
      type: 'success',
      ok: this.languageService.translate('ok'),
    });
  }

  private close() {
    this.menu().close();
  }
}
