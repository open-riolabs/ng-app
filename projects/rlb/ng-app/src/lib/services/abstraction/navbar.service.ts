import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  private _navbarItems: Subject<any[]> = new Subject<any[]>();

  public get navbarItems$() {
    return this._navbarItems.asObservable();
  }

  public setNavbarItems(items: any[]) {
    this._navbarItems.next(items);
  }
}
