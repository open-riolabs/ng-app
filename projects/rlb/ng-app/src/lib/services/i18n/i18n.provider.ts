import { EnvironmentProviders, importProvidersFrom, Provider, TransferState } from "@angular/core";
import { InternationalizationConfiguration, RLB_CFG_I18N } from "../../configuration";
import { HttpClient } from "@angular/common/http";
import { TranslateLoader, TranslateModule } from "@ngx-translate/core";
import { translateBrowserLoaderFactory } from "./translate-browser.loader";
import { RLB_TRANSLATION_SERVICE } from "@lbdsh/lib-ng-bootstrap";
import { RlbTranslateAdapterService } from "./rlb-translate-adapter.service";

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
		{
			provide: RLB_TRANSLATION_SERVICE,
			useClass: RlbTranslateAdapterService
		},
  ]
}