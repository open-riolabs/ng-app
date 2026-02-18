import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AclConfiguration, AppContextActions, BaseState, RlbInitProvider, UserResource } from '@open-rlb/ng-app';

/*
  Example how to finalizeApp without ACL enabled
 */
@Injectable()
export class AppInitProvider implements RlbInitProvider {
  async finalizeApps(resources: UserResource[] ,store: Store<BaseState>, acl: AclConfiguration): Promise<void> {
    // test manual dispatch without acl
    store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App 1' }, appId: 'chat-app-1' }));
    store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App 2' }, appId: 'chat-app-2' }));
    store.dispatch(AppContextActions.finalizeApp({ appType: 'chat', data: { title: 'Chat App 3' }, appId: 'chat-app-3' }));
  }
}
