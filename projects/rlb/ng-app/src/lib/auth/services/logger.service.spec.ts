import { TestBed } from '@angular/core/testing';

import { AppLoggerService } from '../../services/apps/app-logger.service';

describe('LoggerService', () => {
  let service: AppLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
