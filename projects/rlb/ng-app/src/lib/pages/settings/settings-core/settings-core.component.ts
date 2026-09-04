import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Inject, Optional } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ToastService } from '@open-rlb/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  ListComponent,
  ListItemComponent,
  OptionComponent,
  SelectComponent,
  SwitchComponent,
} from '@open-rlb/ng-bootstrap';
import { LanguageService } from '../../../services/i18n/language.service';
import { AppContextActions } from '../../../store/app-context/app-context.actions';
import { appContextFeatureKey } from '../../../store/app-context/app-context.model';
import { BaseState } from '../../../store/base-state';

@Component({
  selector: 'rlb-settings-core',
  imports: [
    FormsModule,
    TranslateModule,
    ListComponent,
    ListItemComponent,
    OptionComponent,
    SelectComponent,
    SwitchComponent,
  ],
  templateUrl: './settings-core.component.html',
  styleUrl: './settings-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCoreComponent {
  private readonly _location = inject(Location);
  private readonly toastService = inject(ToastService);
  private readonly languageService = inject(LanguageService);
  private readonly store = inject(Store);

  readonly languages = computed(() => {
    return (this.store.selectSignal(o => o[appContextFeatureKey].supportedLanguages)() as string[])
      .map((lang: string) => {
        return {
          value: lang,
          label: this.languageService.getLanguageName(lang),
        };
      });
  });

  readonly currentLanguage = toSignal(
    this.store.select(o => o[appContextFeatureKey].language),
    { initialValue: 'en' }
  );

  readonly darkMode = computed(() =>
    this.store.selectSignal(o => o[appContextFeatureKey].theme)() === 'dark'
  );

  backClicked() {
    this._location.back();
  }

  setCurrentLanguage(value: string) {
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
}


