import { EnvironmentProviders, Provider, TransferState, importProvidersFrom } from "@angular/core";
import { InternationalizationConfiguration, RLB_CFG_I18N } from "../../configuration";
import { HttpClient } from "@angular/common/http";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { translateBrowserLoaderFactory } from "./translate-browser.loader";

export function provideRlbI18n(i18n?: InternationalizationConfiguration): (EnvironmentProviders | Provider)[] {
  if (!i18n) return [];
  return [
    importProvidersFrom([
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: translateBrowserLoaderFactory,
          deps: [HttpClient, TransferState]
        },
        fallbackLang: i18n.defaultLanguage
      })
    ]),
    { provide: RLB_CFG_I18N, useValue: i18n },
  ]
}