import { Component } from '@angular/core';
import { RlbAppModule } from '../../../rlb-app.module';
import { CommonModule, Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppContextActions, BaseState, LanguageService, appContextFeatureKey } from '@rlb/ng-app';

@Component({
  selector: 'rlb-settings-core',
  standalone: true,
  imports: [RlbAppModule, CommonModule],
  templateUrl: './settings-core.component.html',
  styleUrl: './settings-core.component.scss'
})
export class SettingsCoreComponent {
  constructor(
    private readonly _location: Location,
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
  }

  get darkMode() {
    return this.store.selectSignal(o => o[appContextFeatureKey].theme)() === 'dark';
  }

  set darkMode(value: boolean) {
    this.store.dispatch(AppContextActions.setTheme({ theme: value ? 'dark' : 'light' }));
  }

}
