import { TestBed } from '@angular/core/testing';

import { TokenCookiesService } from './token-cookies.service';

describe('TokenCookiesService', () => {
  let service: TokenCookiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenCookiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
