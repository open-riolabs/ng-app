import { ApplicationConfig } from '@angular/core';
import { provideApp, provideRlbConfig, RLB_INIT_PROVIDER } from '@open-rlb/ng-app';
import { environment } from '~/environments/environment';
import { appDescriber } from './app.describer';
import { AppInitProvider } from '@/app-init.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideApp(appDescriber),
    {
      provide: RLB_INIT_PROVIDER,
      useClass: AppInitProvider,
    },
  ],
};
