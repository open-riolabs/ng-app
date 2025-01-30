import { ApplicationConfig } from '@angular/core';
import { AbstractMdService, AbstractSupportService, provideApp, provideRlbConfig } from '@rlb-core/lib-ng-app'
import { environment } from '~/environments/environment';
import { SupportService } from './services/support/support.service';
import { MdService } from './services/md/md.service';
import { appDescriber } from './app.describer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideApp(appDescriber),
    { provide: AbstractSupportService, useClass: SupportService },
    { provide: AbstractMdService, useClass: MdService },
  ]
};

