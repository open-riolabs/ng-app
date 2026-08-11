import { TestBed } from '@angular/core/testing';
import { AbstractSecurityStorage, OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, Subject, of, throwError } from 'rxjs';
import { RLB_CFG_AUTH } from '../../configuration';
import { AuthenticationService } from '../services/auth.service';
import { TokenRenewalService, secondsUntilExpiry } from './token-renewal.service';

const CONFIG_ID = 'tenant-realm';

/** A token whose `exp` sits `seconds` from now, so the watchdog has something real to read. */
function tokenExpiringIn(seconds: number): string {
  const exp = Math.floor(new Date().getTime() / 1000) + seconds;
  const payload = btoa(JSON.stringify({ exp })).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

/** The library's per-config storage entry, reduced to what the service reads from it. */
const storedState = (refreshToken: string): string =>
  JSON.stringify({ authnResult: { refresh_token: refreshToken } });

/** In-memory stand-in for the kit's TokenStoreService. */
class StorageStub {
  private readonly entries = new Map<string, string>();

  read(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  write(key: string, value: string): void {
    this.entries.set(key, value);
  }

  remove(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

class OidcStub {
  token = tokenExpiringIn(300);
  forceCalls = 0;
  /** Number of leading attempts that should fail, to model a flaky or briefly unreachable host. */
  failuresLeft = 0;
  /** Left open when set, so two callers can be seen arriving during one refresh. */
  gate?: Subject<{ accessToken: string }>;
  /**
   * When set, a failed attempt also erases the stored auth state, the way the real library's
   * `resetAuthorizationData` does before the error ever reaches the service.
   */
  wipeOnFailure?: StorageStub;
  /** Runs between the wipe and the error surfacing — the window another tab could write in. */
  afterWipe?: () => void;
  /** The error a failed attempt produces. */
  failure: () => unknown = () => new Error('refresh rejected');

  getAccessToken(_configId?: string): Observable<string> {
    return of(this.token);
  }

  forceRefreshSession(_params?: unknown, _configId?: string): Observable<{ accessToken: string }> {
    this.forceCalls++;
    if (this.failuresLeft > 0) {
      this.failuresLeft--;
      this.wipeOnFailure?.remove(CONFIG_ID);
      this.afterWipe?.();
      return throwError(() => this.failure());
    }
    if (this.gate) return this.gate;
    this.token = tokenExpiringIn(300);
    return of({ accessToken: this.token });
  }
}

describe('TokenRenewalService', () => {
  let service: TokenRenewalService;
  let oidc: OidcStub;
  let storage: StorageStub;

  /** Builds the TestBed; `renewal` overrides the audited defaults for the config test. */
  function configure(renewal?: Record<string, unknown>): void {
    TestBed.configureTestingModule({
      providers: [
        OidcStub,
        StorageStub,
        { provide: OidcSecurityService, useExisting: OidcStub },
        { provide: AbstractSecurityStorage, useExisting: StorageStub },
        { provide: AuthenticationService, useValue: { currentProvider: { configId: CONFIG_ID } } },
        { provide: RLB_CFG_AUTH, useValue: renewal ? { renewal } : {} },
      ],
    });
    oidc = TestBed.inject(OidcStub);
    storage = TestBed.inject(StorageStub);
    service = TestBed.inject(TokenRenewalService);
  }

  beforeEach(() => {
    // The library is zoneless, so there is no fakeAsync: jasmine's clock drives the RxJS timers
    // instead, and mockDate keeps the token's `exp` on the same clock as the scheduler.
    jasmine.clock().install();
    jasmine.clock().mockDate();
    configure();
  });

  afterEach(() => jasmine.clock().uninstall());

  /** Advances the mocked clock. */
  const tick = (ms: number): void => jasmine.clock().tick(ms);

  it('spends one refresh when several callers ask at once', () => {
    oidc.gate = new Subject<{ accessToken: string }>();
    const received: string[] = [];

    service.refresh().subscribe(token => received.push(token));
    service.refresh().subscribe(token => received.push(token));
    service.refresh().subscribe(token => received.push(token));

    // The guarantee that matters: with refresh-token rotation, a second spend revokes the session.
    expect(oidc.forceCalls).toBe(1);

    oidc.gate.next({ accessToken: 'shared-token' });
    oidc.gate.complete();

    expect(received).toEqual(['shared-token', 'shared-token', 'shared-token']);
  });

  it('starts a new refresh once the previous one has settled', () => {
    service.refresh().subscribe();
    expect(oidc.forceCalls).toBe(1);

    service.refresh().subscribe();
    expect(oidc.forceCalls).toBe(2);
  });

  it('renews ahead of expiry rather than on it', () => {
    oidc.token = tokenExpiringIn(300);
    service.start();

    // 300s of life, 90s of lead: nothing should happen for the first 210 seconds.
    tick(209_000);
    expect(oidc.forceCalls).toBe(0);

    tick(2_000);
    expect(oidc.forceCalls).toBe(1);
  });

  it('keeps renewing after a failed attempt — the bug this service exists to fix', () => {
    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 1;
    service.start();

    tick(211_000);
    expect(oidc.forceCalls).toBe(1); // attempted, and rejected

    // The library would stop here for good. The watchdog comes back after the first backoff step.
    tick(5_000);
    expect(oidc.forceCalls).toBe(2);

    // And having recovered, it is back on the normal schedule rather than on the retry ladder.
    tick(211_000);
    expect(oidc.forceCalls).toBe(3);
  });

  it('gives up after the capped attempts when no refresh token is left to try with', () => {
    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 99;
    service.start();

    tick(211_000); // first attempt
    tick(5_000); // backoff 1
    tick(20_000); // backoff 2
    tick(60_000); // backoff 3
    expect(oidc.forceCalls).toBe(4);

    // Storage never held a refresh token here, so retrying further would be pointless.
    tick(600_000);
    expect(oidc.forceCalls).toBe(4);
  });

  it('keeps a slow heartbeat through a long outage instead of giving up', () => {
    oidc.token = tokenExpiringIn(300);
    storage.write(CONFIG_ID, storedState('still-good'));
    oidc.failuresLeft = 99;
    oidc.wipeOnFailure = storage;
    service.start();

    tick(211_000 + 5_000 + 20_000 + 60_000);
    expect(oidc.forceCalls).toBe(4); // ladder spent, refresh token restored each time

    // The failures were transient and a refresh token survives: the watchdog keeps beating.
    tick(120_000);
    expect(oidc.forceCalls).toBe(5);
    tick(120_000);
    expect(oidc.forceCalls).toBe(6);

    // The host comes back: the next beat succeeds and the normal schedule resumes.
    oidc.failuresLeft = 0;
    tick(120_000);
    expect(oidc.forceCalls).toBe(7);
    tick(211_000);
    expect(oidc.forceCalls).toBe(8);
  });

  it('stops beating once the outage budget is spent', () => {
    oidc.token = tokenExpiringIn(300);
    storage.write(CONFIG_ID, storedState('rotated-away'));
    oidc.failuresLeft = 99_999;
    oidc.wipeOnFailure = storage;
    service.start();

    tick(211_000 + 5_000 + 20_000 + 60_000);
    expect(oidc.forceCalls).toBe(4); // ladder spent at t=295s, first failure at t=210s

    // The provider rejects this token for good, but nothing in the error says so: the library
    // replaces its body with `Error: OidcService code request <authority>` two layers down. Without
    // a cap the heartbeat would restore the dead token and retry it against the login host forever.
    // Budget runs 30 min from the first failure, so the last beat lands at t=2095s: 15 beats.
    tick(30 * 60 * 1000);
    expect(oidc.forceCalls).toBe(19);

    tick(60 * 60 * 1000);
    expect(oidc.forceCalls).toBe(19);
  });

  it('gives the next outage a full budget once a renewal has succeeded', () => {
    oidc.token = tokenExpiringIn(300);
    storage.write(CONFIG_ID, storedState('still-good'));
    oidc.failuresLeft = 4;
    oidc.wipeOnFailure = storage;
    service.start();

    // Ladder spent, then the first heartbeat succeeds at t=415s.
    tick(211_000 + 5_000 + 20_000 + 60_000 + 120_000);
    expect(oidc.forceCalls).toBe(5);

    // A fresh outage from t=625s. Its budget runs from its own first failure, not from the one
    // back at t=210s, so the watchdog is still beating long past that older deadline.
    oidc.failuresLeft = 99_999;
    tick(30 * 60 * 1000);
    expect(oidc.forceCalls).toBe(21);

    tick(120_000);
    expect(oidc.forceCalls).toBe(22);
  });

  it('puts the refresh token back after the library wipes it over a transient failure', () => {
    storage.write(CONFIG_ID, storedState('still-good'));
    oidc.failuresLeft = 1;
    oidc.wipeOnFailure = storage;

    service.refresh().subscribe({ error: () => undefined });

    // The 504 said nothing about the token: it must survive for the next attempt.
    expect(storage.read(CONFIG_ID)).toBe(storedState('still-good'));
  });

  it('leaves fresher tokens from another tab alone', () => {
    storage.write(CONFIG_ID, storedState('mine'));
    oidc.failuresLeft = 1;
    oidc.wipeOnFailure = storage;
    oidc.afterWipe = () => storage.write(CONFIG_ID, storedState('fresher-from-other-tab'));

    service.refresh().subscribe({ error: () => undefined });

    expect(storage.read(CONFIG_ID)).toBe(storedState('fresher-from-other-tab'));
  });

  it('reads a refresh token from either slot the library uses', () => {
    // Documents the storage shape the whole restore mechanism assumes. If a future release of
    // angular-auth-oidc-client renames these, the watchdog stands down early rather than misbehave
    // — but this spec is what would tell us.
    storage.write(CONFIG_ID, JSON.stringify({ reusable_refresh_token: 'reusable' }));
    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 99;
    oidc.wipeOnFailure = storage;
    service.start();

    tick(211_000 + 5_000 + 20_000 + 60_000);
    expect(oidc.forceCalls).toBe(4);

    // A token in the reusable slot alone is still a token worth beating for.
    tick(120_000);
    expect(oidc.forceCalls).toBe(5);
  });

  it('keeps a single renewal chain however often it is rearmed', () => {
    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 1;
    service.start();

    tick(211_000); // first attempt fails at t=210s; the watchdog enters the retry ladder
    expect(oidc.forceCalls).toBe(1);

    // The interceptor calls rearm() on every request that recovered on its own. Each call used to
    // leave the ladder running and add a chain beside it, phase-shifted, which then spent the
    // refresh token on its own clock — with rotation on, that revokes the session.
    service.rearm();
    service.rearm();
    service.rearm();

    // One chain, rescheduled: the attempt at t=271s and nothing from the abandoned ladder.
    tick(100_000);
    expect(oidc.forceCalls).toBe(2);
  });

  it('rearm puts a stood-down watchdog back on the clock', () => {
    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 99;
    service.start();
    tick(211_000 + 5_000 + 20_000 + 60_000);
    expect(oidc.forceCalls).toBe(4);

    oidc.failuresLeft = 0;
    service.rearm();
    tick(211_000);
    expect(oidc.forceCalls).toBe(5);
  });

  it('takes its timings from auth.renewal when the host configures them', () => {
    TestBed.resetTestingModule();
    configure({ renewLeadSeconds: 30, retryDelaysSeconds: [1], transientRetrySeconds: 10 });

    oidc.token = tokenExpiringIn(300);
    oidc.failuresLeft = 99;
    service.start();

    // 30s of lead rather than 90: the first attempt lands at t=270s.
    tick(269_000);
    expect(oidc.forceCalls).toBe(0);
    tick(1_000);
    expect(oidc.forceCalls).toBe(1);

    // A one-step ladder of 1s, rather than the default 5s.
    tick(1_000);
    expect(oidc.forceCalls).toBe(2);
  });

  describe('secondsUntilExpiry', () => {
    it('reads the exp claim', () => {
      expect(secondsUntilExpiry(tokenExpiringIn(120))).toBe(120);
    });

    it('returns undefined for anything it cannot read', () => {
      expect(secondsUntilExpiry('')).toBeUndefined();
      expect(secondsUntilExpiry('not-a-jwt')).toBeUndefined();
      expect(secondsUntilExpiry('header.!!!not-base64!!!.sig')).toBeUndefined();
      expect(secondsUntilExpiry(`header.${btoa(JSON.stringify({ sub: 'x' }))}.sig`)).toBeUndefined();
    });
  });
});
