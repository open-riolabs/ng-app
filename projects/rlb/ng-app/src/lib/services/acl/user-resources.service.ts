import { Inject, Injectable, Optional } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthConfiguration, RLB_CFG, ProjectConfiguration, RLB_CFG_ACL, AclConfiguration } from '../../configuration';
import { UserResource } from '../../store/acl/acl.model'
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(
    private httpClient: HttpClient,
    @Optional() @Inject(RLB_CFG) private config: ProjectConfiguration,
    @Optional() @Inject(RLB_CFG_ACL) private aclConfig: AclConfiguration,
  ) { }

  public resourcesByUser$(): Observable<UserResource[]> {
    if (!this.aclConfig) {
      throw new Error("ACL configuration is missing. Provide 'acl' in ProjectConfiguration.");
    }

    const endpoint = this.config.endpoints?.[this.aclConfig.endpointKey];

    if (!endpoint) {
      throw new Error(`Endpoint '${this.aclConfig.endpointKey}' not found in configuration.`);
    }

    const url = `${endpoint.baseUrl}/${this.aclConfig.path}`;
    return this.httpClient.get<UserResource[]>(url).pipe(
      //this.errorManagementService.manageUI('error', 'dialog')
    );
  }
}
