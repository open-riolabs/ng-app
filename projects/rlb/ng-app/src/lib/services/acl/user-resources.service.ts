import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AclConfiguration, ProjectConfiguration, RLB_CFG, RLB_CFG_ACL } from '../../configuration';
import { UserResource } from '../../store/acl/acl.model';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(
    private httpClient: HttpClient,
    @Optional() @Inject(RLB_CFG) private config: ProjectConfiguration,
    @Optional() @Inject(RLB_CFG_ACL) private aclConfig: AclConfiguration,
  ) {}

  resourcesByUser$(endpointKey: string, path: string): Observable<UserResource[]> {
    if (!this.aclConfig) {
      console.error("ACL configuration is missing. Provide 'acl' in ProjectConfiguration.");
      return of([]);
    }

    const endpoint = this.config.endpoints?.[endpointKey];

    if (!endpoint) {
      throw new Error(`Endpoint '${endpointKey}' not found in configuration.`);
    }

    if (!path) {
      throw new Error(`Path '${path}' not found in configuration.`);
    }

    const url = `${endpoint.baseUrl}/${path}`;
    return this.httpClient.get<UserResource[]>(url).pipe();
  }
}
