import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Store } from "@ngrx/store";
import { AuthConfiguration, BaseState, RLB_CFG_AUTH, authsFeatureKey } from "../../../public-api";
import { EMPTY, Observable } from "rxjs";
import { KeyCloakUser } from "./keycloack-user";
import { KeyCloakDevice } from "./keycloak-device";
import { KeycloakCredentials } from "./keycloak-credentials";

@Injectable({
  providedIn: 'root',
})
export class KeycloakProfileService {

  private get baseUrl() {
    return `${this.authOptions.issuer}/account`
  }

  constructor(
    @Inject(RLB_CFG_AUTH) @Optional() private authOptions: AuthConfiguration,
    private http: HttpClient,
    private readonly store: Store<BaseState>,) { }

  getUserProfile(): Observable<KeyCloakUser> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}`;
    return this.http.get<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateUserProfile(data: KeyCloakUser): Observable<void> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}`;
    return this.http.post<any>(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getDevices(): Observable<KeyCloakDevice> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}/sessions/devices`;
    return this.http.get<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }


  getCredentials(): Observable<KeycloakCredentials> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}/credentials`;
    return this.http.get<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
