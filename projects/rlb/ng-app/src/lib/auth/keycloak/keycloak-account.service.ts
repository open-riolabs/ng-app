import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { OidcSecurityService } from "angular-auth-oidc-client";
import {  filter, map, Observable, switchMap } from "rxjs";
import { ErrorManagementService } from "../../services/errors/error-management.service";
import { KeycloakCredential, KeycloakDevice, KeycloakSession, KeycloakUser } from "./";
import { AuthenticationService } from "..";

@Injectable({
  providedIn: 'root',
})
export class KeycloakProfileService {

  constructor(
    private http: HttpClient,
    private readonly authService: AuthenticationService,
    private readonly errorManagementService: ErrorManagementService,
    private readonly oidcSecurityService: OidcSecurityService) { }

  private get baseUrl() {
    return `${this.authService.currentProvider?.authority}/account`;
  }

  getUserProfile(): Observable<KeycloakUser> {
    return this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth),
      switchMap(() => this.authService.accessToken$),
      switchMap(token => this.http.get<any>(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })),
      this.errorManagementService.manageUI('error', 'dialog')
    )
  }

  updateUserProfile(data: KeycloakUser): Observable<void> {
    return this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth),
      switchMap(() => this.authService.accessToken$),
      switchMap(token => this.http.post<void>(this.baseUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })),
      this.errorManagementService.manageUI('error', 'dialog')
    )
  }

  getDevices(): Observable<KeycloakSession[]> {
    return this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth),
      switchMap(() => this.authService.accessToken$),
      switchMap(token => this.http.get<KeycloakDevice[]>(`${this.baseUrl}/sessions/devices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })),
      map((devices) => devices.map((device) => device.sessions.map((session) => {
        session.os = device.os;
        session.osVersion = device.osVersion;
        session.device = device.device;
        session.mobile = device.mobile;
        session.clientslist = session.clients.map((client) => client.clientName).join(', ');
        return session;
      })).flat()),
      this.errorManagementService.manageUI('error', 'dialog')
    )
  }

  getCredentials(): Observable<KeycloakCredential[]> {
    return this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth),
      switchMap(() => this.authService.accessToken$),
      switchMap(token => this.http.get<KeycloakCredential[]>(`${this.baseUrl}/credentials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })),
      this.errorManagementService.manageUI('error', 'dialog')
    );
  }

  removeCredential(id: string): Observable<void> {
    return this.authService.isAuthenticated$.pipe(
      filter(isAuth => isAuth),
      switchMap(() => this.authService.accessToken$),
      switchMap(token => {
        return this.http.delete<void>(`${this.baseUrl}/credentials/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }),
      this.errorManagementService.manageUI('error', 'dialog')
    );
  }

  configureOTP() {
    return this.oidcSecurityService.authorize(this.authService.currentProvider?.configId, {
      customParams: {
        kc_action: "CONFIGURE_TOTP"
      }
    });
  }

  updatePassword() {
    return this.oidcSecurityService.authorize(this.authService.currentProvider?.configId, {
      customParams: {
        kc_action: "UPDATE_PASSWORD"
      }
    });
  }
}
