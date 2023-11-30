import { TestBed } from '@angular/core/testing';

import { ParseJwtService } from './parse-jwt.service';

describe('ParseJwtService', () => {
  let service: ParseJwtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParseJwtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
