import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export abstract class AbstractMdService {

  constructor() { }

  public abstract md2html(md: string): string;
  public abstract md2text(md: string): string;
}
