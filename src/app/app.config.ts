import { ApplicationConfig } from '@angular/core';
import { provideApp, provideRlbConfig } from '@open-rlb/ng-app';
import { environment } from '~/environments/environment';
import { appDescriber } from './app.describer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideApp(appDescriber)
  ]
};

