import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { RLB_CFG_AUTH } from '../../configuration';
import { TokenRenewalService } from '../renewal/token-renewal.service';
import { AuthenticationService } from '../services/auth.service';
import { oauthGuard } from './oauth.guard';

class AuthStub {
  authenticated = false;
  loginCalls: (string | undefined)[] = [];

  get isAuthenticated$(): Observable<boolean> {
    return of(this.authenticated);
  }

  login(targetUrl?: string): void {
    this.loginCalls.push(targetUrl);
  }
}

class RenewalStub {
  recoverable = false;
  isRecoverable(): boolean {
    return this.recoverable;
  }
}

describe('oauthGuard', () => {
  let auth: AuthStub;
  let renewal: RenewalStub;

  /** Builds the TestBed; `interceptor` decides whether the watchdog is part of the picture. */
  function configure(interceptor?: string): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthStub,
        RenewalStub,
        { provide: AuthenticationService, useExisting: AuthStub },
        { provide: TokenRenewalService, useExisting: RenewalStub },
        { provide: RLB_CFG_AUTH, useValue: { interceptor } },
      ],
    });
    auth = TestBed.inject(AuthStub);
    renewal = TestBed.inject(RenewalStub);
  }

  const run = (): boolean => {
    const guard: CanActivateFn = (...params) =>
      TestBed.runInInjectionContext(() => oauthGuard(...params));
    let allowed: boolean | undefined;
    (
      guard(
        {} as ActivatedRouteSnapshot,
        { url: '/partners/rides' } as RouterStateSnapshot,
      ) as Observable<boolean>
    ).subscribe(result => (allowed = result as boolean));
    return allowed as boolean;
  };

  beforeEach(() => configure('oauth-code-ep-retry'));

  it('lets an authenticated visitor through', () => {
    auth.authenticated = true;

    expect(run()).toBeTrue();
    expect(auth.loginCalls).toEqual([]);
  });

  it('sends a signed-out visitor to the provider, remembering where they were going', () => {
    auth.authenticated = false;
    renewal.recoverable = false;

    expect(run()).toBeFalse();
    expect(auth.loginCalls).toEqual(['/partners/rides']);
  });

  it('does not bounce a session the watchdog is still recovering', () => {
    // The defect this exists for: one failed refresh publishes isAuthenticated$: false while the
    // session is alive on the provider, so the guard used to hand the user to the login host —
    // which, during an outage, is the host that is down. Observed live on staging 2026-08-12.
    auth.authenticated = false;
    renewal.recoverable = true;

    expect(run()).toBeTrue();
    expect(auth.loginCalls).toEqual([]);
  });

  it('bounces once the watchdog has given up on the session', () => {
    // isRecoverable() goes false when the outage budget is spent or no refresh token is left, so a
    // genuinely dead session still reaches the login page rather than sitting in a broken app.
    auth.authenticated = false;
    renewal.recoverable = false;

    expect(run()).toBeFalse();
    expect(auth.loginCalls).toEqual(['/partners/rides']);
  });

  it('ignores the watchdog entirely under the other interceptors', () => {
    // Only 'oauth-code-ep-retry' runs a watchdog. Every other tenant keeps the old behaviour, and
    // the service is never even constructed — in an app with no auth configured its own
    // dependencies would not resolve.
    configure('oauth-code-ep');
    auth.authenticated = false;
    renewal.recoverable = true;

    expect(run()).toBeFalse();
    expect(auth.loginCalls).toEqual(['/partners/rides']);
  });
});
