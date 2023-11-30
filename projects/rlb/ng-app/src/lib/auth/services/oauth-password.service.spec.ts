import { TestBed } from '@angular/core/testing';

import { OauthPasswordService } from './oauth-password.service';

describe('PasswordService', () => {
  let service: OauthPasswordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OauthPasswordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
