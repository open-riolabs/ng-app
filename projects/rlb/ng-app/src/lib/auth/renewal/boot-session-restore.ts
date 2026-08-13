import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * The one renewal `AuthenticationService` runs at startup, before deciding nobody is signed in.
 *
 * `TokenRenewalService` is what implements this, and it is deliberately reached through a token
 * rather than injected: it injects `AuthenticationService` itself, and asking for it from a
 * constructor that is mid-construction on the other side of that edge is a circular dependency
 * (NG0200). The factory in `auth.provider.ts` resolves it lazily for the same reason.
 *
 * Only `'oauth-code-ep-retry'` provides it, so nothing changes for any other interceptor: the
 * injection is optional and a startup without it behaves as it always did.
 */
export interface BootSessionRestorer {
  /** Whether storage still holds a refresh token worth spending on the attempt. */
  canRestore(): boolean;
  /**
   * Renews through the watchdog's snapshot-protected path, so a failure that wipes storage is put
   * back rather than costing the session. An empty token means the attempt failed.
   */
  refresh(): Observable<string>;
}

export const RLB_BOOT_SESSION_RESTORER = new InjectionToken<BootSessionRestorer>(
  'RLB_BOOT_SESSION_RESTORER',
);
