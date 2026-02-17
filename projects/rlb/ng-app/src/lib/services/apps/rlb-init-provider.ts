import { InjectionToken } from "@angular/core";
import { Store } from "@ngrx/store";
import { BaseState } from '../../store/'
import { AclConfiguration, RLB_CFG } from '../../configuration'
import { AppInfo } from "./app";

export const RLB_INIT_PROVIDER = new InjectionToken<RlbInitProvider>(`${RLB_CFG}:init.provider`);
export interface RlbInitProvider {
  finalizeApps(store: Store<BaseState>, acl: AclConfiguration): Promise<void>;
}
