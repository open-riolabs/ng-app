import { Injectable } from '@angular/core';
import { AbstractMdService } from '@sicilyaction/lib-ng-app';


@Injectable({
  providedIn: 'root'
})
export class MdService extends AbstractMdService {
  constructor() {
    super();

  }

  public override md2html(md: string): string {
    throw new Error('Method not implemented.');
  }
  
  public override md2text(md: string): string {
    throw new Error('Method not implemented.');
  }
}

