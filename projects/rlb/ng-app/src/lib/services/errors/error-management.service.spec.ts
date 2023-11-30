import { TestBed } from '@angular/core/testing';

import { ErrorManagementService } from './error-management.service';

describe('ErrorManagementService', () => {
  let service: ErrorManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
