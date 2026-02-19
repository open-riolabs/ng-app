import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AclConfiguration,
  AppContextActions,
  appContextFeatureKey,
  BaseState,
  RlbInitProvider,
  UserResource
} from '@open-rlb/ng-app';

/*
  Example how to finalizeApp with ACL enabled
 */
@Injectable()
export class AppInitAclProvider implements RlbInitProvider {
  async finalizeApps(resources: UserResource[] ,store: Store<BaseState>, acl: AclConfiguration): Promise<void> {

    if (!resources || resources.length === 0) {
      return;
    }

    const currentApps = store.selectSignal(state => state[appContextFeatureKey].apps)()

    resources.forEach(company => {
      company.resources.forEach(res => {
        const appId = `chat-${res.resourceId}`
        if (currentApps.findIndex((app) => app.id === appId) === -1) {
          const appData = {
            title: res.friendlyName,
            appName: res.friendlyName,
            [acl.businessIdKey]: company.resourceBusinessId,
            [acl.resourceIdKey]: res.resourceId,
          };

          store.dispatch(AppContextActions.finalizeApp({
            appType: 'chat',
            appId,
            data: appData,
          }));
        } else {
          console.warn(`[AppInitAclProvider]: appId ${appId} exists already, skip finalize`)
        }
      });
    });
  }
}
