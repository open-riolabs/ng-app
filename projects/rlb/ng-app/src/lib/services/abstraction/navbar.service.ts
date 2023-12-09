import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NavigableItem } from '@rlb/ng-bootstrap'

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  private _navbarItems: Subject<NavigableItem[]> = new Subject<NavigableItem[]>();
  private _showLogin: Subject<boolean> = new Subject<boolean>();
  private _showSearch: Subject<boolean> = new Subject<boolean>();
  private _show: Subject<boolean> = new Subject<boolean>();


  public get navbarItems$() {
    return this._navbarItems.asObservable();
  }

  public get showLogin$() {
    return this._showLogin.asObservable();
  }

  public get showSearch$() {
    return this._showSearch.asObservable();
  }

  public get show$() {
    return this._show.asObservable();
  }

  public setNavbarItems(items: NavigableItem[]) {
    this._navbarItems.next(items);
  }

  public setShowLogin(show: boolean) {
    this._showLogin.next(show);
  }

  public setShowSearch(show: boolean) {
    this._showSearch.next(show);
  }

  public setShow(show: boolean) {
    this._show.next(show);
  }
}
