import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { OidcSecurityService } from "angular-auth-oidc-client";
import {  filter, map, Observable, switchMap } from "rxjs";
import { ErrorManagementService } from "../../services/errors/error-management.service";
import { KeycloakUser } from './keycloack-user';
import { KeycloakCredential } from './keycloak-credential';
import { KeycloakDevice, KeycloakSession } from './keycloak-device';
import { AuthenticationService } from '../services/auth.service';

/**
 * The Keycloak account API, with failures shown as a modal.
 *
 * Every method here is gated behind `filter(isAuthenticated)` and ends in
 * `manageUI('error', 'dialog')`, so a failure — or a token renewal that has stalled — completes the
 * stream without emitting and without erroring. That is fine for a single call bound straight to a
 * template, and unusable anywhere the caller needs to know what happened: it cannot distinguish
 * failure from an empty result, and inside a `forkJoin` it silently aborts every sibling call.
 *
 * Prefer `KeycloakAccountService` for anything composed. This service is kept as-is for the
 * existing callers, and for `configureOTP`/`updatePassword`, which are redirects rather than HTTP.
 */
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
