import { TestBed } from '@angular/core/testing';

import { RLB_CFG_ENV } from '../../configuration';
import { AppLoggerService } from '../../services/apps/app-logger.service';

describe('LoggerService', () => {
  let service: AppLoggerService;

  beforeEach(() => {
    // The service reads its level from the environment config, which is not optional.
    TestBed.configureTestingModule({
      providers: [{ provide: RLB_CFG_ENV, useValue: { logLevel: 'off' } }],
    });
    service = TestBed.inject(AppLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
