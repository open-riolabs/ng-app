import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { CookiesService } from '..';
import { RLB_CFG_I18N } from '../../configuration';


@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translateService = inject(TranslateService);
  private readonly cookiesService = inject(CookiesService);
  private readonly i18nOptions = inject(RLB_CFG_I18N, { optional: true });

  private readonly _language = signal<string>(this.translateService.currentLang || this.i18nOptions?.defaultLanguage || 'en');
  private readonly _contentLanguage = signal<string | undefined>(undefined);

  readonly language = this._language.asReadonly();
  readonly contentLanguage = this._contentLanguage.asReadonly();

  readonly languageChanged$ = this.translateService.onLangChange;
  readonly contentLanguageChanged = this._contentLanguage.asReadonly();

  // Emits once the initial UI translation file has been loaded (or failed to load).
  // Consumed by the i18n APP_INITIALIZER to block bootstrap until translations are
  // available, so synchronous instant() calls during app/component init resolve keys.
  private readonly _ready$ = new ReplaySubject<boolean>(1);
  readonly ready$ = this._ready$.asObservable();

  constructor() {
    // Sync private signal with translate service changes
    this.translateService.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(e => this._language.set(e.lang));

    if (this.i18nOptions) {
      this.translateService.addLangs(this.i18nOptions.availableLangs);
      const languageUI = this.cookiesService.getCookie('ui-locale') || this.defaultLanguage || this.browserLanguage;
      const languageContent = this.cookiesService.getCookie('content-locale') || this.defaultLanguage;
      this.translateService.use(languageUI).subscribe({
        next: () => this._ready$.next(true),
        // Don't block bootstrap forever if the translation file fails to load.
        error: () => this._ready$.next(true),
      });
      this.setContentLanguage(languageContent);
    } else {
      this._ready$.next(true);
    }
  }

  get currentLanguage() {
    return this.language();
  }

  setLanguage(value: string | undefined) {
    if (!value) return;
    this.cookiesService.setCookie('ui-locale', value);
    this.translateService.use(value);
  }

  setContentLanguage(value: string | undefined) {
    this.cookiesService.setCookie('content-locale', value || this.defaultLanguage);
    this._contentLanguage.set(value);
  }


  public get languages(): readonly string[] {
    return this.translateService.getLangs();
  }

  public set languages(value: string[]) {
    this.translateService.addLangs(value);
  }

  public get defaultLanguage(): string {
    return this.translateService.getFallbackLang() || 'en';
  }

  public get browserLanguage() {
    return this.translateService.getBrowserLang() || 'en';
  }

  public translate(key: string | Array<string>, interpolateParams?: Object) {
    return this.translateService.instant(key, interpolateParams);
  }

  public translateAsync(key: string | Array<string>, interpolateParams?: Object) {
    return this.translateService.get(key, interpolateParams);
  }

  public getLanguageName(l: string): string {
    const names: Record<string, string> = {
      it: 'Italiano',
      en: 'English',
      es: 'Español',
      fr: 'Francés',
      ja: '日本語',
      de: 'Deutsch',
    };
    return names[l] || '';
  }
}


