import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AbstractMdService, AbstractSupportService, provideRlbCodeBrowserAuth, provideRlbConfig, provideRlbI18n } from '@rlb/ng-app'
import { environment } from '~/environments/environment';
import { SupportService } from './support/support.service';
import { MdService } from './md/md.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideRlbI18n(environment.i18n),
    provideRlbCodeBrowserAuth(environment.auth),
    provideRouter([...routes]),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: AbstractSupportService, useClass: SupportService },
    { provide: AbstractMdService, useClass: MdService },
  ]
};
