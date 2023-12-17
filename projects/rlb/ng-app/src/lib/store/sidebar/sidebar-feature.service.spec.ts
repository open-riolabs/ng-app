import { TestBed } from '@angular/core/testing';

import { SidebarFeatureService } from './sidebar-feature.service';

describe('AuthService', () => {
  let service: SidebarFeatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarFeatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
