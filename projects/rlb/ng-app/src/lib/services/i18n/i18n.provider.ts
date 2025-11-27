import { EnvironmentProviders, importProvidersFrom, Provider } from "@angular/core";
import { InternationalizationConfiguration, RLB_CFG_I18N } from "../../configuration";
import { TranslateModule } from "@ngx-translate/core";
import { RLB_TRANSLATION_SERVICE } from "@lbdsh/lib-ng-bootstrap";
import { RlbTranslateAdapterService } from "./rlb-translate-adapter.service";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

export function provideRlbI18n(i18n?: InternationalizationConfiguration): (EnvironmentProviders | Provider)[] {
  if (!i18n) return [];

  const prefix: string = './assets/i18n/';
  const suffix: string = '.json'

  return [
    importProvidersFrom([
      TranslateModule.forRoot({
        loader: provideTranslateHttpLoader({
          prefix,
          suffix,
          // enforceLoading: true,    // Adds cache-busting timestamp
          // useHttpBackend: true     // Bypasses HTTP interceptors
        }),
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
