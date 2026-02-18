import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AclConfiguration, AppContextActions, BaseState, RlbInitProvider, UserResource } from '@open-rlb/ng-app';

/*
  Example how to finalizeApp with ACL enabled
 */
@Injectable()
export class AppInitAclProvider implements RlbInitProvider {
  async finalizeApps(resources: UserResource[] ,store: Store<BaseState>, acl: AclConfiguration): Promise<void> {

    if (!resources || resources.length === 0) {
      return;
    }

    resources.forEach(company => {
      company.resources.forEach(res => {
        const appData = {
          title: res.friendlyName,
          appName: res.friendlyName,
          // 'Data' Object must have the actions
          //  Since we dont want to pull it from appDescriber we can get it from resources
          actions: res.actions,
          [acl.businessIdKey]: company.resourceBusinessId,
          [acl.resourceIdKey]: res.resourceId,
        };

        store.dispatch(AppContextActions.finalizeApp({
          appType: 'chat',
          appId: `chat-${res.resourceId}`,
          data: appData,
        }));
      });
    });
  }
}
