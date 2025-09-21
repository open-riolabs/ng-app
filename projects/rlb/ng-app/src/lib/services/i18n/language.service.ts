import { EventEmitter, Inject, Injectable, Optional } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CookiesService } from '..';
import { InternationalizationConfiguration, RLB_CFG_I18N } from '../../configuration';


@Injectable({ providedIn: 'root' })
export class LanguageService {

  private _contentLanguage: string | undefined
  public contentLanguageChanged$: EventEmitter<string> = new EventEmitter();

  constructor(
    private translateService: TranslateService,
    private cookiesService: CookiesService,
    @Inject(RLB_CFG_I18N) @Optional() private i18nOptions: InternationalizationConfiguration,
  ) {
    if (this.i18nOptions) {
      translateService.addLangs(this.i18nOptions.availableLangs)
      const languageUI = this.cookiesService.getCookie('ui-locale') || this.browserLanguage || this.defaultLanguage
      const languageContent = this.cookiesService.getCookie('content-locale') || this.defaultLanguage
      translateService.use(languageUI)
      this.contentLanguage = languageContent
    }
  }

  get language() {
    return this.translateService.getCurrentLang() || this.i18nOptions.defaultLanguage
  }

  set language(value: string | undefined) {
    if (!value) return
    this.cookiesService.setCookie('ui-locale', value)
    this.translateService.use(value)
  }

  get contentLanguage() {
    return this._contentLanguage
  }

  set contentLanguage(value: string | undefined) {
    this.cookiesService.setCookie('content-locale', value || this.defaultLanguage)
    this._contentLanguage = value
    this.contentLanguageChanged$.emit(value)
  }

  public get languages(): readonly string[] {
    return this.translateService.getLangs()
  }

  public set languages(value: string[]) {
    this.translateService.addLangs(value)
  }

  public get defaultLanguage(): string {
    return this.translateService.getFallbackLang() || 'en'
  }

  public get browserLanguage() {
    return this.translateService.getBrowserLang()
  }

  public translate(key: string | Array<string>, interpolateParams?: Object) {
    return this.translateService.instant(key, interpolateParams)
  }

  public translateAsync(key: string | Array<string>, interpolateParams?: Object) {
    return this.translateService.get(key, interpolateParams)
  }

  public get languageChanged$() {
    return this.translateService.onLangChange
  }

  public getLanguageName(l: string): string {
    switch (l) {
      case 'it': return 'Italiano'
      case 'en': return 'English'
      case 'es': return 'Español'
      case 'fr': return 'Francés'
      case 'ja': return '日本語'
      default: return ''
    }
  }
}
