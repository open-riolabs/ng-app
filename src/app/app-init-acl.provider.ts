import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AclConfiguration,
  aclFeatureKey,
  AppContextActions,
  AppInfo,
  BaseState,
  RlbInitProvider
} from '@open-rlb/ng-app';
import { filter, firstValueFrom } from "rxjs";

/*
  Example how to finalizeApp with ACL enabled
 */
@Injectable()
export class AppInitAclProvider implements RlbInitProvider {
  async finalizeApps(store: Store<BaseState>, acl: AclConfiguration,  appInfo: AppInfo): Promise<void> {
    await firstValueFrom(
      store.select(state => state[aclFeatureKey]).pipe(
        filter(state => !!state && state.loaded === true)
      )
    );

    let resources = store.selectSignal(state => state[aclFeatureKey].resources)();

    if (!resources || resources.length === 0) {
      return;
    }

    resources.forEach(company => {
      company.resources.forEach(res => {

        const appData = {
          title: res.friendlyName,
          appName: res.friendlyName,
          [acl.businessIdKey]: company.resourceBusinessId,
          [acl.resourceIdKey]: res.resourceId,
        };

        store.dispatch(AppContextActions.finalizeApp({
          appType: 'chat',
          appId: `chat-${res.resourceId}`,
          actions: appInfo.actions || [],
          data: appData,
        }));
      });
    });
  }
}
