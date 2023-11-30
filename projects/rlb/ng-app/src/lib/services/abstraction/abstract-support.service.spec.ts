import { TestBed } from '@angular/core/testing';

import { AbstractSupportService } from './abstract-support.service';

describe('SupportService', () => {
  let service: AbstractSupportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbstractSupportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
