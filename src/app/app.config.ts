import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideApp, provideRlbConfig, RLB_CFG_ACL, RLB_INIT_PROVIDER } from '@open-rlb/ng-app';
import { environment } from '~/environments/environment';
import { appDescriber } from './app.describer';
import { Store } from "@ngrx/store";
import { AppInitAclProvider } from "@/app-init-acl.provider";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideApp(appDescriber),
    {
      provide: RLB_INIT_PROVIDER,
      useClass: AppInitAclProvider
    },
    provideAppInitializer(() => {
      const provider = inject(RLB_INIT_PROVIDER);
      const store = inject(Store);
      const acl = inject(RLB_CFG_ACL);

      if (!provider) {
        console.error("Provider not found. Define RLB_INIT_PROVIDER");
      }

      // return call result, to make app wait for it
      return provider.finalizeApps(store, acl, appDescriber.info);
    })
  ]
};

