import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse, withXhr } from '@angular/common/http';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { IConfiguration, RLB_CFG, RLB_CFG_AUTH } from '../../configuration';
import { AuthenticationService } from '../services/auth.service';
import { TokenOauthRetryInterceptor } from './token-oauth-retry.interceptor';
import { TokenRenewalService } from './token-renewal.service';

const API = 'https://api.example.com';
const OTHER = 'https://cdn.example.com';

class RenewalStub {
  stored = 'stored-token';
  fresh = 'fresh-token';
  refreshCalls = 0;
  rearmCalls = 0;
  refreshFails = false;

  accessToken(): Observable<string> {
    return of(this.stored);
  }

  refresh(): Observable<string> {
    this.refreshCalls++;
    if (this.refreshFails) return throwError(() => new Error('refresh rejected'));
    this.stored = this.fresh;
    return of(this.fresh);
  }

  rearm(): void {
    this.rearmCalls++;
  }
}

describe('TokenOauthRetryInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let renewal: RenewalStub;

  function configure(options: { publicPaths?: string[]; providerResolves?: boolean } = {}): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
        RenewalStub,
        { provide: TokenRenewalService, useExisting: RenewalStub },
        {
          provide: AuthenticationService,
          useValue: {
            currentProvider:
              options.providerResolves === false ? undefined : { configId: 'tenant-realm' },
          },
        },
        {
          provide: RLB_CFG,
          useValue: {
            endpoints: {
              api: { baseUrl: API, auth: true, wss: false },
              socket: { baseUrl: 'wss://api.example.com', auth: true, wss: true },
            },
          } as unknown as IConfiguration,
        },
        {
          provide: RLB_CFG_AUTH,
          useValue: { renewal: { publicPaths: options.publicPaths ?? [] } },
        },
        { provide: HTTP_INTERCEPTORS, useClass: TokenOauthRetryInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    renewal = TestBed.inject(RenewalStub);
  }

  beforeEach(() => configure());
  afterEach(() => httpMock.verify());

  it('attaches the stored token to calls on authenticated endpoints', () => {
    http.get(`${API}/rides`).subscribe();

    const request = httpMock.expectOne(`${API}/rides`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer stored-token');
    request.flush({});
  });

  it('does not disturb the watchdog for a request that renewed nothing', () => {
    // rearm() restarts the renewal chain, and with it the outage budget. If ordinary traffic did
    // that, the bound that stops a dead refresh token being retried forever would never be reached.
    http.get(`${API}/rides`).subscribe();

    httpMock.expectOne(`${API}/rides`).flush({});
    expect(renewal.rearmCalls).toBe(0);
    expect(renewal.refreshCalls).toBe(0);
  });

  it('leaves other hosts alone', () => {
    http.get(`${OTHER}/logo.png`).subscribe();

    const request = httpMock.expectOne(`${OTHER}/logo.png`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('leaves configured public paths alone, so the front door still opens', () => {
    configure({ publicPaths: ['/register'] });

    http.post(`${API}/register`, {}).subscribe();

    const request = httpMock.expectOne(`${API}/register`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('passes everything through on a domain where no provider resolves', () => {
    // A shell serving several tenants registers this interceptor everywhere; on domains this build
    // has no provider for it must behave exactly as the plain interceptor did.
    configure({ providerResolves: false });

    http.get(`${API}/rides`).subscribe();

    const request = httpMock.expectOne(`${API}/rides`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(renewal.refreshCalls).toBe(0);
    expect(renewal.rearmCalls).toBe(0);
    request.flush({});
  });

  it('renews before sending rather than sending anonymously', () => {
    // The old interceptor sent this request with no Authorization header at all, which the backend
    // could not attribute to anyone — the source of the "missing user id" floods.
    renewal.stored = '';

    http.get(`${API}/rides`).subscribe();

    const request = httpMock.expectOne(`${API}/rides`);
    expect(renewal.refreshCalls).toBe(1);
    expect(request.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    // This one did renew, so the watchdog goes back on the clock behind it.
    expect(renewal.rearmCalls).toBe(1);
    request.flush({});
  });

  it('never lets an authenticated request leave without a token', done => {
    renewal.stored = '';
    renewal.refreshFails = true;

    http.get(`${API}/rides`).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        done();
      },
    });

    // Raised locally: no round trip is spent finding out what the backend would have said.
    httpMock.expectNone(`${API}/rides`);
  });

  it('retries a 401 once with a renewed token', () => {
    http.get(`${API}/rides`).subscribe();

    httpMock.expectOne(`${API}/rides`).flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = httpMock.expectOne(`${API}/rides`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    expect(renewal.refreshCalls).toBe(1);
    expect(renewal.rearmCalls).toBe(1);
    retry.flush({});
  });

  it('surfaces the original 401 when the retry also fails', done => {
    http.get(`${API}/rides`).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        done();
      },
    });

    httpMock.expectOne(`${API}/rides`).flush(null, { status: 401, statusText: 'Unauthorized' });
    // The retry is issued downstream of this interceptor, so its failure cannot loop back through.
    httpMock.expectOne(`${API}/rides`).flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('reuses a token another request renewed instead of spending a second refresh', () => {
    http.get(`${API}/rides`).subscribe();
    const first = httpMock.expectOne(`${API}/rides`);

    // Another request renewed while this one was in flight; with rotation on, spending the refresh
    // token again for the same expiry would revoke the session.
    renewal.stored = 'renewed-by-someone-else';
    first.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = httpMock.expectOne(`${API}/rides`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer renewed-by-someone-else');
    expect(renewal.refreshCalls).toBe(0);
    // Whoever did the renewing rearmed already; this request has nothing to add.
    expect(renewal.rearmCalls).toBe(0);
    retry.flush({});
  });

  it('passes non-401 errors straight through', done => {
    http.get(`${API}/rides`).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
        expect(renewal.refreshCalls).toBe(0);
        done();
      },
    });

    httpMock.expectOne(`${API}/rides`).flush(null, { status: 500, statusText: 'Server Error' });
  });
});
