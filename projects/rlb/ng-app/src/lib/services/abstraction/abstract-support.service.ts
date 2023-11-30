import { Injectable } from '@angular/core';

@Injectable()
export abstract class AbstractSupportService {

  public abstract subscribeNewsletter(data: any): void;

  public abstract sendQuestion(data: any): void

  public abstract sendSupport(data: any): void
}
