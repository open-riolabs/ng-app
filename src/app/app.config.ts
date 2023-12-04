import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { SupportService } from './support/support.service';
import { environment } from '~/environments/environment';
import { AbstractMdService, AbstractSupportService, provideCodeBrowserAuth, translateBrowserLoaderFactory } from '@rlb/ng-app'
import { MdService } from './md/md.service';
import { RlbBootstrapModule } from '@rlb/ng-bootstrap';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TransferState } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom([
      HttpClientModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: translateBrowserLoaderFactory,
          deps: [HttpClient, TransferState]
        },
        defaultLanguage: environment.i18n?.defaultLanguage
      }),
      RlbBootstrapModule.forRoot(),
    ]),
    provideRouter([...routes]),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideCodeBrowserAuth(environment.auth, isDevMode()),
    { provide: AbstractSupportService, useClass: SupportService },
    { provide: AbstractMdService, useClass: MdService },
    { provide: 'options', useValue: environment },
    { provide: 'options:cms', useValue: environment.cms },
    { provide: 'options:i18n', useValue: environment.i18n },
    { provide: 'options:pages', useValue: environment.pages },
    { provide: 'options:env', useValue: environment.environment },
    { provide: 'endpointsOptions', useValue: environment.endpoints },
  ]
};
