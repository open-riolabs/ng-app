import { Injectable } from '@angular/core';
import { AbstractSupportService } from '@sicilyaction/lib-ng-app';

@Injectable({ 'providedIn': 'root' })
export class SupportService extends AbstractSupportService {
  public sendSupport(data: any) {
    console.log(data)
  }
}

