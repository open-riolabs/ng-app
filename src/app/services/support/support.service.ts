import { Injectable } from '@angular/core';
import { AbstractSupportService } from '@rlb/ng-app';

@Injectable({ 'providedIn': 'root' })
export class SupportService extends AbstractSupportService {
  public sendSupport(data: any) {
    console.log(data)
  }
}
