import { TestBed } from '@angular/core/testing';

import { NavbarFeatureService } from './navbar-feature.service';

describe('AuthService', () => {
  let service: NavbarFeatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavbarFeatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
