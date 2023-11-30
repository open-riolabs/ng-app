import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { oauthPasswordGuard } from './oauth-password.guard';

describe('oauthPasswordGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => oauthPasswordGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
