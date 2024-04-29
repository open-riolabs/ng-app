import { TestBed } from '@angular/core/testing';

import { TokenSessionService } from './token-session.service';

describe('TokenSessionService', () => {
  let service: TokenSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
