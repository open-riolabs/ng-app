import { Injectable } from '@angular/core';

@Injectable()
export abstract class AbstractSupportService {
  public abstract sendSupport(data: any): void
}
