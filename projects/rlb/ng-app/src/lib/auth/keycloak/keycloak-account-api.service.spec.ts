import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';
import { KeycloakAccountService } from './keycloak-account-api.service';

const AUTHORITY = 'https://login.example.com/realms/tenant';
const ACCOUNT = `${AUTHORITY}/account`;

describe('KeycloakAccountService', () => {
  let service: KeycloakAccountService;
  let httpMock: HttpTestingController;

  function configure(options: { authority?: string; token?: string } = {}): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthenticationService,
          useValue: {
            currentProvider:
              options.authority === undefined ? { authority: AUTHORITY } : { authority: options.authority },
            accessToken$: of(options.token === undefined ? 'access-token' : options.token),
          },
        },
      ],
    });
    service = TestBed.inject(KeycloakAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => configure());
  afterEach(() => httpMock.verify());

  it('reads the profile with a bearer token', () => {
    let user: unknown;
    service.user().subscribe(value => (user = value));

    const request = httpMock.expectOne(ACCOUNT);
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({ username: 'someone' });

    expect(user).toEqual({ username: 'someone' } as any);
  });

  it('flattens sessions out of the devices that hold them', () => {
    let sessions: any[] = [];
    service.devices().subscribe(value => (sessions = value));

    httpMock.expectOne(`${ACCOUNT}/sessions/devices`).flush([
      {
        os: 'Linux',
        osVersion: '6',
        device: 'Other',
        mobile: false,
        sessions: [{ clients: [{ clientName: 'web' }, { clientName: 'admin' }] }],
      },
    ]);

    expect(sessions.length).toBe(1);
    expect(sessions[0].os).toBe('Linux');
    expect(sessions[0].clientslist).toBe('web, admin');
  });

  describe('degrading instead of blanking the page', () => {
    it('gives a read its fallback when the call fails', () => {
      // The old service opened a modal and completed EMPTY, which silently aborted any forkJoin it
      // sat in — one failing section blanked the whole profile page.
      let user: unknown = 'untouched';
      let credentials: unknown = 'untouched';

      service.user().subscribe(value => (user = value));
      httpMock.expectOne(ACCOUNT).flush(null, { status: 500, statusText: 'Server Error' });

      service.credentials().subscribe(value => (credentials = value));
      httpMock
        .expectOne(`${ACCOUNT}/credentials`)
        .flush(null, { status: 503, statusText: 'Unavailable' });

      expect(user).toBeNull();
      expect(credentials).toEqual([]);
    });

    it('gives a read its fallback when no token is available', () => {
      configure({ token: '' });
      let user: unknown = 'untouched';

      service.user().subscribe(value => (user = value));

      expect(user).toBeNull();
      httpMock.expectNone(ACCOUNT);
    });

    it('never builds a URL out of an unresolved provider', () => {
      // `${undefined}/account` is a relative URL that hits the app's own origin.
      configure({ authority: '' });
      let devices: unknown = 'untouched';

      service.devices().subscribe(value => (devices = value));

      expect(devices).toEqual([]);
      httpMock.expectNone(request => request.url.includes('undefined'));
    });
  });

  describe('writes, whose failures the caller has to see', () => {
    it('propagates an error rather than swallowing it', done => {
      service.updateUser({ username: 'someone' } as any).subscribe({
        error: error => {
          expect(error.status).toBe(400);
          done();
        },
      });

      httpMock.expectOne(ACCOUNT).flush(null, { status: 400, statusText: 'Bad Request' });
    });

    it('deletes a credential by id', () => {
      service.removeCredential('cred-1').subscribe();

      const request = httpMock.expectOne(`${ACCOUNT}/credentials/cred-1`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null);
    });

    it('fails when there is no token to write with', done => {
      configure({ token: '' });

      service.removeCredential('cred-1').subscribe({
        error: error => {
          expect(String(error)).toContain('No access token');
          done();
        },
      });
    });
  });
});
