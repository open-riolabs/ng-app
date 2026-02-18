import { InjectionToken } from "@angular/core";
import { Store } from "@ngrx/store";
import { BaseState, UserResource } from '../../store/'
import { AclConfiguration, RLB_CFG } from '../../configuration'

export const RLB_INIT_PROVIDER = new InjectionToken<RlbInitProvider>(`${RLB_CFG}:init.provider`);
export interface RlbInitProvider {
  finalizeApps(resources: UserResource[], store: Store<BaseState>, acl: AclConfiguration | null): Promise<void>;
}
