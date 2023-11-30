// import { TestBed } from '@angular/core/testing';
// import { AuthenticationService } from './auth.service';
// import { HttpClient } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { CookiesService } from '../../services';
// import { OidcSecurityService } from 'angular-auth-oidc-client';

// describe('AuthService', () => {
//   let service: AuthenticationService;
//   let httpClientSpy: jasmine.SpyObj<HttpClient>;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         { provide: HttpClient, useValue: jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete', 'patch']) },
//         { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
//         { provide: CookiesService, useValue: jasmine.createSpyObj('CookiesService', ['navigate']) },
//         { provide: OidcSecurityService, useValue: jasmine.createSpyObj('OidcSecurityService', ['checkAuthMultiple'])}
//       ]
//     });
//     httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
//     service = TestBed.inject(AuthenticationService);
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
// });
