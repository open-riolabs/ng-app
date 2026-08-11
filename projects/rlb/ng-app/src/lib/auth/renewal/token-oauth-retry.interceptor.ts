import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { IConfiguration, RLB_CFG, RLB_CFG_AUTH } from '../../configuration';
import { AuthenticationService } from '../services/auth.service';
import { TokenRenewalService } from './token-renewal.service';

const UNAUTHORIZED = 401;
const AUTHORIZATION = 'Authorization';
const BEARER = 'Bearer ';

/**
 * Attaches the access token to calls on authenticated endpoints, and recovers the two failures
 * `TokenOauthInterceptor` leaves to the caller.
 *
 * **It never sends an authenticated request anonymously.** `TokenOauthInterceptor` attaches
 * whatever token it finds and, finding none, sends the request anyway with no `Authorization`
 * header — so the backend gets a call it cannot attribute to anyone, which is how a stalled
 * renewal turns into a flood of "missing user id" errors rather than a visible auth failure. Here a
 * request either leaves with a token or does not leave at all, failing with a 401 raised locally.
 *
 * **It retries a 401 once**, with a freshly renewed token. Retrying a 401 is safe in a way retrying
 * a 500 is not: 401 means the request was rejected before it was acted on, so replaying it cannot
 * repeat a side effect. The retry is issued downstream of this interceptor, so its own failure
 * travels straight to the caller and cannot loop back through here.
 *
 * Selected with `auth.interceptor: 'oauth-code-ep-retry'`, which also brings up
 * {@link TokenRenewalService}. It replaces `TokenOauthInterceptor` rather than stacking on it.
 *
 * Three things pass through untouched: calls that are not on an authenticated endpoint, calls to
 * `auth.renewal.publicPaths` — set that for front-door calls like registration, which anonymous
 * visitors legitimately make — and every call on a domain where no auth provider resolves, which
 * behaves exactly as `'oauth-code-ep'` did.
 */
@Injectable()
export class TokenOauthRetryInterceptor implements HttpInterceptor {
  private readonly renewal = inject(TokenRenewalService);
  private readonly authService = inject(AuthenticationService);
  private readonly appconfig = inject<IConfiguration>(RLB_CFG);
  private readonly publicPaths = inject(RLB_CFG_AUTH, { optional: true })?.renewal?.publicPaths ?? [];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isAuthenticatedEndpoint(request.url)) return next.handle(request);
    if (this.publicPaths.some(path => request.url.includes(path))) return next.handle(request);
    // No provider for this domain means no token to attach and nothing a retry could fix. Behaving
    // like the plain interceptor keeps a shell that serves several tenants working on the ones this
    // build has no provider for.
    if (!this.authService.currentProvider) return next.handle(request);

    if (bearerOf(request)) return this.handleWithRetry(request, next);
    return this.sendAuthenticated(request, next);
  }

  /** Gets a token before the request leaves, rather than letting it go out anonymous. */
  private sendAuthenticated(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.renewal.accessToken().pipe(
      switchMap(current => (current ? of(unrenewed(current)) : renewed(this.renewal.refresh()))),
      catchError(() => of(unrenewed(''))),
      switchMap(attempt => {
        if (!attempt.token) return throwError(() => unauthenticated(request));
        this.rearmIfRenewed(attempt);
        return this.handleWithRetry(withBearer(request, attempt.token), next);
      }),
    );
  }

  /**
   * Puts the watchdog back on the clock, but only when this request actually renewed the token.
   *
   * Rearming cancels and restarts the renewal chain, which also restarts the outage budget. Doing
   * that for every request would mean ordinary traffic silently resets the bound that stops a dead
   * refresh token being retried forever — so only a real renewal counts as recovery.
   */
  private rearmIfRenewed(attempt: RefreshAttempt): void {
    if (attempt.renewed) this.renewal.rearm();
  }

  private handleWithRetry(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== UNAUTHORIZED) {
          return throwError(() => error);
        }
        return this.retryOnce(request, next, error);
      }),
    );
  }

  private retryOnce(
    request: HttpRequest<any>,
    next: HttpHandler,
    original: HttpErrorResponse,
  ): Observable<HttpEvent<any>> {
    const sentWith = bearerOf(request);

    return this.renewal.accessToken().pipe(
      // A token that changed under us means another request refreshed while this one was in
      // flight; reusing it avoids spending the refresh token twice for the same expiry. This only
      // holds when the request actually carried a token — without one there is nothing to compare
      // against, and taking the shortcut would retry with a token that was never the problem.
      switchMap(current =>
        sentWith && current && current !== sentWith
          ? of(unrenewed(current))
          : renewed(this.renewal.refresh()),
      ),
      catchError(() => of(unrenewed(''))),
      switchMap(attempt => {
        if (!attempt.token) return throwError(() => original);
        this.rearmIfRenewed(attempt);
        return next.handle(withBearer(request, attempt.token));
      }),
    );
  }

  /** The same endpoints `TokenOauthInterceptor` matches: only those can answer 401. */
  private isAuthenticatedEndpoint(url: string): boolean {
    return Object.values(this.appconfig.endpoints ?? {})
      .filter(endpoint => endpoint.auth && !endpoint.wss)
      .some(endpoint => url.includes(endpoint.baseUrl));
  }
}

/** A token, and whether getting it cost a refresh — which is what makes it worth rearming on. */
interface RefreshAttempt {
  token: string;
  renewed: boolean;
}

const unrenewed = (token: string): RefreshAttempt => ({ token, renewed: false });

const renewed = (refresh: Observable<string>): Observable<RefreshAttempt> =>
  refresh.pipe(map(token => ({ token, renewed: true })));

function bearerOf(request: HttpRequest<any>): string {
  const header = request.headers.get(AUTHORIZATION) ?? '';
  return header.startsWith(BEARER) ? header.slice(BEARER.length) : '';
}

/** The 401 the request would have earned, raised without spending a round trip to find out. */
function unauthenticated(request: HttpRequest<any>): HttpErrorResponse {
  return new HttpErrorResponse({
    status: UNAUTHORIZED,
    statusText: 'Unauthorized',
    url: request.url,
    error: 'No access token available for an authenticated endpoint.',
  });
}

function withBearer(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({ setHeaders: { [AUTHORIZATION]: `${BEARER}${token}` } });
}
