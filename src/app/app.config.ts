import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AbstractMdService, AbstractSupportService, RLB_APP_NAVCOMP, getDefaultRoutes, provideRlbCodeBrowserAuth, provideRlbConfig, provideRlbI18n } from '@rlb/ng-app'
import { environment } from '~/environments/environment';
import { SupportService } from './support/support.service';
import { MdService } from './md/md.service';
import { routes } from './app.routes';
import { NavbarItemDemoComponent } from './nav-item.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),
    provideRlbI18n(environment.i18n),
    provideRlbCodeBrowserAuth(environment.auth),
    provideRouter([...getDefaultRoutes(environment.pages), ...routes]),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    { provide: AbstractSupportService, useClass: SupportService },
    { provide: AbstractMdService, useClass: MdService },
    {
      provide: RLB_APP_NAVCOMP, useValue: {
        left: [{ component: NavbarItemDemoComponent, name: 'demo' }],
        right: [{ component: NavbarItemDemoComponent, name: 'demo' }]
      }
    },
  ]
};
