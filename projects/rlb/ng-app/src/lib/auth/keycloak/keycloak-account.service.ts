import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Store } from "@ngrx/store";
import { AuthConfiguration, BaseState, ErrorManagementService, RLB_CFG_AUTH, authsFeatureKey } from "../../../public-api";
import { EMPTY, Observable, map } from "rxjs";
import { KeycloakUser, KeycloakDevice, KeycloakCredential, KeycloakSession } from "./";
import { AuthenticationService } from '../services/auth.service';
import { OidcSecurityService } from "angular-auth-oidc-client";

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
    private readonly store: Store<BaseState>,
    private readonly errorManagementService: ErrorManagementService,
    private readonly oidcSecurityService: OidcSecurityService,
    @Optional() @Inject(RLB_CFG_AUTH) private authConfig: AuthConfiguration) { }

  getUserProfile(): Observable<KeycloakUser> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}`;
    return this.http.get<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .pipe(this.errorManagementService.manageUI('error', 'dialog'));
  }

  updateUserProfile(data: KeycloakUser): Observable<void> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}`;
    return this.http.post<any>(url, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .pipe(this.errorManagementService.manageUI('error', 'dialog'));
  }

  getDevices(): Observable<KeycloakSession[]> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}/sessions/devices`;
    return this.http.get<KeycloakDevice[]>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).pipe(
      map((devices) => devices.map((device) => device.sessions.map((session) => {
        session.os = device.os;
        session.osVersion = device.osVersion;
        session.device = device.device;
        session.mobile = device.mobile;
        session.clientslist = session.clients.map((client) => client.clientName).join(', ');
        return session;
      })).flat()),
      this.errorManagementService.manageUI('error', 'dialog'));
  }

  getCredentials(): Observable<KeycloakCredential[]> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}/credentials`;
    return this.http.get<any>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .pipe(this.errorManagementService.manageUI('error', 'dialog'));
  }

  removeCredential(id: string): Observable<void> {
    if (!this.store.selectSignal((state) => state[authsFeatureKey].isAuth)()) {
      return EMPTY;
    }
    const token = this.store.selectSignal((state) => state[authsFeatureKey].accessToken)();
    const url = `${this.baseUrl}/credentials/${id}`;
    return this.http.delete<void>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .pipe(this.errorManagementService.manageUI('error', 'dialog'));
  }

  configureOTP() {
    return this.oidcSecurityService.authorize(this.authConfig?.configId, {
      customParams: {
        kc_action: "CONFIGURE_TOTP"
      }
    })
  }

  updatePassword() {
    return this.oidcSecurityService.authorize(this.authConfig?.configId, {
      customParams: {
        kc_action: "UPDATE_PASSWORD"
      }
    })
  }
}
