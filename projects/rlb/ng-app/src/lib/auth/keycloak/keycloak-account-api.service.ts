import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, take, throwError, timeout } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';
import { KeycloakUser } from './keycloack-user';
import { KeycloakCredential } from './keycloak-credential';
import { KeycloakDevice, KeycloakSession } from './keycloak-device';

/** How long to wait on the account API before giving up on a call. */
const DEFAULT_TIMEOUT_MS = 10_000;

export interface KeycloakAccountCallOptions {
  /** Overrides the 10s default for this call. */
  timeoutMs?: number;
}

/**
 * The Keycloak account API, in a shape a caller can compose with.
 *
 * `KeycloakProfileService` covers the same endpoints but cannot be composed: every method is gated
 * behind `filter(isAuthenticated)`, which after a failed token renewal simply never emits, and ends
 * in `manageUI('error', 'dialog')`, which opens a blocking modal and completes the stream *empty*.
 * Both mean the observable finishes without a value and without an error, so a caller can neither
 * tell success from failure nor stop a `forkJoin` from being silently aborted — one failing section
 * blanks a whole profile page. That is what happened during a provider outage, and it is why this
 * service exists.
 *
 * Here, reads **degrade**: a failure, a timeout, a missing token or an unresolved provider yields
 * the documented fallback (`null` / `[]`) rather than nothing at all, so a page renders with the
 * sections it could load. Writes **propagate**: the caller has to know whether the change landed.
 * Nothing opens a modal — how loudly to complain is the caller's decision.
 *
 * The redirect-based flows (`configureOTP`, `updatePassword`) stay on `KeycloakProfileService`;
 * they are not HTTP calls and have none of these problems.
 */
@Injectable({ providedIn: 'root' })
export class KeycloakAccountService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthenticationService);

  /** The account API lives on the provider's own host, outside the endpoint interceptors' reach. */
  private get baseUrl(): string | undefined {
    const authority = this.authService.currentProvider?.authority;
    return authority ? `${authority}/account` : undefined;
  }

  /** The signed-in user's profile, or null when it could not be read. */
  user(options?: KeycloakAccountCallOptions): Observable<KeycloakUser | null> {
    return this.read<KeycloakUser | null>('', null, options);
  }

  /** The user's sessions, flattened out of the devices that hold them; `[]` when unreadable. */
  devices(options?: KeycloakAccountCallOptions): Observable<KeycloakSession[]> {
    return this.read<KeycloakDevice[] | null>('/sessions/devices', null, options).pipe(
      map(devices => (devices ? flattenSessions(devices) : [])),
    );
  }

  /** The user's credentials, or `[]` when they could not be read. */
  credentials(options?: KeycloakAccountCallOptions): Observable<KeycloakCredential[]> {
    return this.read<KeycloakCredential[]>('/credentials', [], options);
  }

  /** Updates the profile. Errors reach the caller. */
  updateUser(data: KeycloakUser, options?: KeycloakAccountCallOptions): Observable<void> {
    return this.write(
      (url, token) => this.http.post<void>(url, data, withBearer(token)),
      '',
      options,
    );
  }

  /** Removes a credential. Errors reach the caller. */
  removeCredential(id: string, options?: KeycloakAccountCallOptions): Observable<void> {
    return this.write(
      (url, token) => this.http.delete<void>(url, withBearer(token)),
      `/credentials/${id}`,
      options,
    );
  }

  /**
   * A read that always produces a value.
   *
   * No `isAuthenticated$` gate: that is the operator that turns a stalled renewal into a stream
   * which never emits. A missing token is handled by returning the fallback, which is a state the
   * caller can actually render.
   */
  private read<T>(path: string, fallback: T, options?: KeycloakAccountCallOptions): Observable<T> {
    const url = this.baseUrl;
    if (!url) return of(fallback);

    return this.authService.accessToken$.pipe(
      take(1),
      switchMap(token => {
        if (!token) return of(fallback);
        return this.http
          .get<T>(`${url}${path}`, withBearer(token))
          .pipe(timeout({ first: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS }));
      }),
      catchError(() => of(fallback)),
    );
  }

  /** A write, whose failures are the caller's to handle. */
  private write(
    call: (url: string, token: string) => Observable<void>,
    path: string,
    options?: KeycloakAccountCallOptions,
  ): Observable<void> {
    const url = this.baseUrl;
    if (!url) return throwError(() => new Error('No auth provider resolved for the account API.'));

    return this.authService.accessToken$.pipe(
      take(1),
      switchMap(token => {
        if (!token) return throwError(() => new Error('No access token for the account API.'));
        return call(`${url}${path}`, token).pipe(
          timeout({ first: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS }),
        );
      }),
    );
  }
}

function flattenSessions(devices: KeycloakDevice[]): KeycloakSession[] {
  return devices
    .map(device =>
      device.sessions.map(session => {
        session.os = device.os;
        session.osVersion = device.osVersion;
        session.device = device.device;
        session.mobile = device.mobile;
        session.clientslist = session.clients.map(client => client.clientName).join(', ');
        return session;
      }),
    )
    .flat();
}

function withBearer(token: string): { headers: { Authorization: string } } {
  return { headers: { Authorization: `Bearer ${token}` } };
}
