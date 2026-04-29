import { RLB_APP_NAVCOMP } from '@open-rlb/ng-app';
import { AppDescriber } from '../../projects/rlb/ng-app/src/lib/services/apps/app-describer';
import { routes } from './app.routes';
import { NavbarItemDemoComponent } from './nav-item.component';

export const appDescriber: AppDescriber = {
  info: {
    type: 'chat',
    enabled: true,
    actions: [
      'catalog-editor',
      'bot-manager',
      'prompteng-write',
      'sysadmin',
      'concierge-write',
      'business',
      'whatsapp-admin',
      'concierge-read',
      'whatsapp-manager',
      'company',
      'users',
      'prompteng-read',
    ],
    core: {
      title: 'Chat',
      description: 'Chat with other users',
      url: 'chatto',
      icon: 'bi-chat',
      auth: true,
    },
    settings: {
      title: 'Chat settings',
      description: 'Chat settings description',
      url: 'settings/chatto',
      icon: 'bi bi-gear',
      auth: true,
    },
  },
  providers: [
    {
      provide: RLB_APP_NAVCOMP,
      useValue: {
        left: [{ component: NavbarItemDemoComponent, name: 'demo' }],
        right: [{ component: NavbarItemDemoComponent, name: 'demo' }],
      },
    },
  ],
  routes,
};
