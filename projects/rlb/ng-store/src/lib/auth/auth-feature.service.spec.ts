import { TestBed } from '@angular/core/testing';
import { AuthFeatureService } from './auth-feature.service';

describe('AuthService', () => {
  let service: AuthFeatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthFeatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
