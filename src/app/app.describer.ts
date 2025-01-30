import { RLB_APP_NAVCOMP } from "@rlb-core/lib-ng-app";
import { NavbarItemDemoComponent } from "./nav-item.component";
import { routes } from "./app.routes";

export const appDescriber = {
  info: {
    id: 'chat',
    enabled: true,
    core: {
      title: 'Chat',
      description: 'Chat with other users',
      url: 'chat',
      icon: 'bi-chat',
      auth: true
    },
    settings: {
      title: 'Chat settings',
      description: 'Chat settings description',
      url: 'settings/chat',
      icon: 'bi bi-gear',
      auth: true
    }
  },
  providers: [
    {
      provide: RLB_APP_NAVCOMP, useValue: {
        left: [{ component: NavbarItemDemoComponent, name: 'demo' }],
        right: [{ component: NavbarItemDemoComponent, name: 'demo' }]
      }
    },
  ],
  routes
}

