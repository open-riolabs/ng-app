import { InjectionToken } from "@angular/core";
import { Store } from "@ngrx/store";
import { AclConfiguration, BaseState } from "@open-rlb/ng-app";

export const RLB_CFG = new InjectionToken<InitProviderService>('rlb.options:init-provider');
export interface InitProviderService {
  finalizeApps(store: Store<BaseState>, acl: AclConfiguration): Promise<void>;
}