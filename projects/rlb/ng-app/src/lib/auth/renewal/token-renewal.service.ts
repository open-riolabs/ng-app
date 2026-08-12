import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractSecurityStorage, OidcSecurityService } from 'angular-auth-oidc-client';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  defer,
  expand,
  finalize,
  map,
  mergeMap,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError,
  timer,
} from 'rxjs';
import { RLB_CFG_AUTH, TokenRenewalConfiguration } from '../../configuration';
import { AuthenticationService } from '../services/auth.service';

/** Floor on the wait, so a token that is already expiring cannot spin the timer. */
const MIN_DELAY_SECONDS = 5;

const MS_PER_SECOND = 1000;

const DEFAULTS: Required<
  Pick<
    TokenRenewalConfiguration,
    'renewLeadSeconds' | 'retryDelaysSeconds' | 'transientRetrySeconds' | 'maxOutageSeconds'
  >
> = {
  renewLeadSeconds: 90,
  retryDelaysSeconds: [5, 20, 60],
  transientRetrySeconds: 120,
  maxOutageSeconds: 30 * 60,
};

/**
 * The shape of the OIDC library's per-config entry in storage, reduced to the two places a refresh
 * token can live.
 */
interface StoredAuthState {
  authnResult?: { refresh_token?: string };
  reusable_refresh_token?: string;
}

/** Where the watchdog stands: what it is waiting for, and how long the current outage has run. */
interface RenewalState {
  /** Consecutive failures so far; 0 while healthy. Indexes the retry ladder. */
  attempt: number;
  /** When the current outage started, or 0 while healthy. Bounds the heartbeat. */
  failingSince: number;
  /** Seconds to wait before the next attempt. */
  delaySeconds: number;
}

/**
 * Keeps the access token fresh for as long as the tab is open.
 *
 * The OIDC library already does this, but its periodic check is one-strike: a failed renewal ends
 * in `finalize(() => refreshTokenFailed && this.intervalService.stopPeriodicTokenCheck())`, which
 * unsubscribes the interval and nulls the handle — and `startTokenValidationPeriodically` is only
 * ever reached from the `checkAuth` path, so nothing starts it again. One failed refresh therefore
 * disables renewal for the life of the page: the token expires a few minutes later, every request
 * comes back 401, and the route guard bounces the user out to the login host. Reloading appears to
 * fix it only because bootstrap runs `checkAuth`, which refreshes once and starts the countdown
 * again.
 *
 * This watchdog keeps its own clock, so a failure costs one attempt rather than the mechanism.
 *
 * The library has a second, nastier failure mode: on any refresh error that is not a pure network
 * error — a gateway 504 while the login host is down qualifies — `resetAuthorizationData` erases
 * the access, id AND refresh token from storage before the error ever reaches this service. The
 * session is still perfectly alive on the provider's side; only the local copy of the refresh token
 * is gone, and with it any chance of recovering without a full login. So a snapshot of the stored
 * auth state is taken before every attempt and put back after a failure ({@link restoreIfWiped}),
 * so the next attempt has something to work with. A {@link lastKnownGood} copy is carried across
 * attempts as well, so a wipe by something this service does not drive is recoverable too.
 *
 * It should not have to be: `'oauth-code-ep-retry'` switches the library's own periodic check off,
 * so this is the only renewer running (`auth.provider.ts`). Both were live until 2026-08-11, and
 * through an outage the library's unguarded check destroyed the refresh token about a minute after
 * this one's first failed attempt. A host that deliberately puts the library's check back with a
 * per-provider `silentRenew: true` gets the restore rather than the session loss.
 *
 * Retries follow a short ladder and then a slow heartbeat, for as long as a refresh token survives
 * in storage and the outage stays inside its budget. There is deliberately no attempt to tell a
 * dead token from an unreachable host: the library destroys that information before the error
 * arrives, so the budget is what stops a rejected token being retried forever. Once the watchdog
 * stands down, the retry interceptor still recovers on the next 401 and calls {@link rearm}.
 *
 * Everything runs on one chain. {@link start} and {@link rearm} push onto a single trigger whose
 * `switchMap` cancels whatever was scheduled, so no amount of rearming can leave two chains racing
 * to spend the same refresh token — with rotation enabled, the second spend revokes the session.
 *
 * Provided in root but inert: nothing happens until something starts it. `'oauth-code-ep-retry'`
 * starts it for you unless `auth.renewal.autoStart` is false.
 */
@Injectable({ providedIn: 'root' })
export class TokenRenewalService {
  private readonly oidc = inject(OidcSecurityService);
  private readonly authService = inject(AuthenticationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(AbstractSecurityStorage);
  private readonly config = inject(RLB_CFG_AUTH, { optional: true })?.renewal;

  private readonly renewLeadSeconds = this.config?.renewLeadSeconds ?? DEFAULTS.renewLeadSeconds;
  private readonly retryDelaysSeconds =
    this.config?.retryDelaysSeconds ?? DEFAULTS.retryDelaysSeconds;
  private readonly transientRetrySeconds =
    this.config?.transientRetrySeconds ?? DEFAULTS.transientRetrySeconds;
  private readonly maxOutageSeconds = this.config?.maxOutageSeconds ?? DEFAULTS.maxOutageSeconds;

  /**
   * The refresh currently in flight, shared by every caller.
   *
   * Parallel refreshes are the failure this whole service exists to avoid: several requests failing
   * at once would each spend the same refresh token, and with rotation enabled all but the first
   * are rejected — taking the session with them.
   */
  private inFlight?: Observable<string>;

  /**
   * The last stored state seen holding a refresh token, kept across attempts.
   *
   * A snapshot taken immediately before an attempt only covers a wipe by that attempt. Storage can
   * also be emptied between attempts by something this service does not drive — the OIDC library's
   * own periodic check is the case that cost a live session on 2026-08-11 — and by the time the next
   * attempt reads storage there is nothing left to snapshot. This is what it falls back to.
   */
  private lastKnownGood?: string;

  private started = false;

  /**
   * Every request to (re)schedule the watchdog. One subscription, `switchMap`ped, so the chain
   * already on the clock is cancelled rather than joined by a second one.
   */
  private readonly restart$ = new Subject<void>();

  constructor() {
    this.restart$
      .pipe(
        switchMap(() => this.watch()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Begins watching the current token. Safe to call more than once. */
  start(): void {
    if (this.started) return;
    this.rearm();
  }

  /** The token as currently stored, without renewing anything. */
  accessToken(): Observable<string> {
    return this.oidc.getAccessToken(this.configId()).pipe(take(1));
  }

  /** Renews the token, joining the attempt already running rather than starting a second one. */
  refresh(): Observable<string> {
    if (!this.inFlight) {
      this.inFlight = defer(() => {
        // Taken before the library runs, because on failure the library erases the refresh token
        // from storage even when the token itself was fine and only the host was unreachable.
        const snapshot = this.readStoredState();

        return this.oidc.forceRefreshSession(undefined, this.configId()).pipe(
          map(response => response?.accessToken ?? ''),
          // An empty token means the refresh resolved without one — the wipe still happened.
          tap(token => {
            // Read for its side effect: a success rotated the refresh token, and reading it now
            // keeps {@link lastKnownGood} from naming the one this attempt has just spent.
            if (token) this.readStoredState();
            else this.restoreIfWiped(snapshot);
          }),
          catchError((error: unknown) => {
            this.restoreIfWiped(snapshot);
            return throwError(() => error);
          }),
        );
      }).pipe(
        finalize(() => (this.inFlight = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.inFlight;
  }

  /**
   * Puts the watchdog back on the clock after an outside refresh — the interceptor calls this so a
   * request that recovered on its own also revives automatic renewal.
   */
  rearm(): void {
    this.started = true;
    this.restart$.next();
  }

  /**
   * One renewal cycle, from the token as it stands now until the watchdog stands down.
   *
   * `expand` feeds each attempt's outcome back in as the next wait, so the whole cycle is a single
   * chain: there is no second timer that could fall out of step with this one.
   */
  private watch(): Observable<RenewalState> {
    return this.accessToken().pipe(
      map(token => ({ attempt: 0, failingSince: 0, delaySeconds: this.delayFor(token) })),
      expand(state => this.runAttempt(state)),
    );
  }

  /** Waits out a state's delay, renews, and reports where that leaves the watchdog. */
  private runAttempt(state: RenewalState): Observable<RenewalState> {
    return timer(state.delaySeconds * MS_PER_SECOND).pipe(
      switchMap(() => this.refresh()),
      // An empty token means the refresh resolved without one: a failed attempt, not a schedule.
      map(token => (token ? this.afterSuccess(token) : this.afterFailure(state))),
      catchError(() => of(this.afterFailure(state))),
      // No next state means the watchdog stands down, which ends the chain.
      mergeMap(next => (next ? of(next) : EMPTY)),
    );
  }

  /** Back on the normal schedule, with the outage budget reset. */
  private afterSuccess(token: string): RenewalState {
    return { attempt: 0, failingSince: 0, delaySeconds: this.delayFor(token) };
  }

  /**
   * Where a failed attempt leaves the watchdog, or undefined to stand down.
   *
   * The ladder always runs in full; only once it is spent does the watchdog ask whether carrying on
   * can still help. It cannot if storage holds no refresh token to try with, or if this outage has
   * already had its budget.
   */
  private afterFailure(state: RenewalState): RenewalState | undefined {
    const now = Date.now();
    const failingSince = state.failingSince || now;
    const attempt = state.attempt + 1;

    if (attempt <= this.retryDelaysSeconds.length) {
      return { attempt, failingSince, delaySeconds: this.retryDelaysSeconds[attempt - 1] };
    }

    const budgetSpent = now - failingSince >= this.maxOutageSeconds * MS_PER_SECOND;
    if (budgetSpent || !hasRefreshToken(this.readStoredState())) {
      // Standing down beats hammering the login host; the interceptor still recovers on the next
      // 401 and calls rearm(). Set here rather than in a finalize on the chain: switchMap tears the
      // chain down on every rearm(), and a finalize would clear the flag on a healthy restart.
      this.started = false;
      return undefined;
    }
    return { attempt, failingSince, delaySeconds: this.transientRetrySeconds };
  }

  /** Seconds to wait before the next renewal, derived from the token's own expiry. */
  private delayFor(token: string): number {
    const secondsLeft = secondsUntilExpiry(token);
    // No usable expiry: fall back to the lead time so the watchdog still ticks instead of stalling.
    if (secondsLeft === undefined) return this.renewLeadSeconds;

    // Scale the lead down for short-lived tokens, so it can never exceed the token's own life.
    const lead = Math.min(this.renewLeadSeconds, Math.floor(secondsLeft / 3));
    return Math.max(secondsLeft - lead, MIN_DELAY_SECONDS);
  }

  /**
   * The provider for this domain.
   *
   * `AuthenticationService` resolves it from the store, or by hostname when the store has not
   * settled it, and reports a domain no provider claims rather than letting the OIDC library fall
   * back to the first registered configuration.
   */
  private configId(): string | undefined {
    return this.authService.currentProvider?.configId;
  }

  /**
   * The library's whole stored state for this config, as the raw string it keeps in storage.
   *
   * The single read point, so remembering a usable state here is enough to keep
   * {@link lastKnownGood} current without a second code path to keep in step with this one.
   */
  private readStoredState(): string | null {
    const configId = this.configId();
    const raw = configId ? ((this.storage.read(configId) as string | null) ?? null) : null;
    if (hasRefreshToken(raw)) this.lastKnownGood = raw ?? undefined;
    return raw;
  }

  /**
   * Puts a refresh token back after storage was wiped over a failed refresh.
   *
   * The pre-attempt snapshot is preferred, and {@link lastKnownGood} covers the case it cannot: a
   * wipe by a renewer this service does not drive, which leaves the next attempt nothing to
   * snapshot. Either way the write is guarded twice — the candidate must actually hold a refresh
   * token, and the current storage must not. If another tab renewed in the meantime its fresher
   * tokens win, since restoring an already-rotated token would only earn a rejection next round.
   *
   * A token the provider has genuinely rejected does get restored here, whichever source it came
   * from, because nothing in the error says it was rejected; the outage budget is what stops that
   * becoming a loop.
   */
  private restoreIfWiped(snapshot: string | null): void {
    const candidate = hasRefreshToken(snapshot) ? snapshot : (this.lastKnownGood ?? null);
    if (!candidate || hasRefreshToken(this.readStoredState())) return;

    const configId = this.configId();
    if (configId) this.storage.write(configId, candidate);
  }
}

/** Whether a raw storage entry still holds a refresh token to try with. */
function hasRefreshToken(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const state = JSON.parse(raw) as StoredAuthState;
    return Boolean(state.authnResult?.refresh_token || state.reusable_refresh_token);
  } catch {
    return false;
  }
}

/**
 * Seconds left on a JWT, or undefined when it carries no readable `exp`.
 *
 * Reading the claim beats asking the library: its expiry helpers are not part of the public API,
 * and a token we cannot read is a case the caller has to handle anyway.
 */
export function secondsUntilExpiry(token: string): number | undefined {
  const payload = token?.split('.')[1];
  if (!payload) return undefined;

  try {
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(char => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(''),
      ),
    ) as { exp?: number };

    if (typeof json.exp !== 'number') return undefined;
    return json.exp - Math.floor(Date.now() / MS_PER_SECOND);
  } catch {
    return undefined;
  }
}
