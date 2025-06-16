import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastService } from '@rlb-core/lib-ng-bootstrap';
import { RlbAppModule } from '../../../rlb-app.module';
import { LanguageService } from '../../../services/i18n/language.service';
import { AppContextActions, BaseState, appContextFeatureKey } from '../../../store';

@Component({
  selector: 'rlb-settings-core',
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-core.component.html',
  styleUrl: './settings-core.component.scss'
})
export class SettingsCoreComponent {
  constructor(
    private readonly _location: Location,
    private readonly toastService: ToastService,
    private readonly languageService: LanguageService,
    private readonly store: Store<BaseState>) { }

  backClicked() {
    this._location.back();
  }

  get languages() {
    return this.store.selectSignal(o => o[appContextFeatureKey].supportedLanguages)().map((lang: string) => {
      return {
        value: lang,
        label: this.languageService.getLanguageName(lang)
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
      content: this.languageService.translate(
        'common.savedSuccessfully',
      ),
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
      content: this.languageService.translate(
        'common.savedSuccessfully',
      ),
      type: 'success',
      ok: this.languageService.translate('ok'),
    });
  }
}

