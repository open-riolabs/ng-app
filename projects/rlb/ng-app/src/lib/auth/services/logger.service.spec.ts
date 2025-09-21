import { TestBed } from '@angular/core/testing';

import { RlbLoggerService } from './rlb-logger.service';

describe('LoggerService', () => {
  let service: RlbLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RlbLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
