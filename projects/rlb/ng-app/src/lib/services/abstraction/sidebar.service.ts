import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  private _sidebarItems: Subject<any[]> = new Subject<any[]>();
  private _sidebarFooterItems: Subject<any[]> = new Subject<any[]>();
  private _showLogin: Subject<boolean> = new Subject<boolean>();
  private _showSearch: Subject<boolean> = new Subject<boolean>();
  private _show: Subject<boolean> = new Subject<boolean>();

  public get sidebarItems$() {
    return this._sidebarItems.asObservable();
  }

  public get sidebarFooterItems$() {
    return this._sidebarFooterItems.asObservable();
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

  public setSidebarItems(items: any[]) {
    this._sidebarItems.next(items);
  }

  public setSidebarFooterItems(items: any[]) {
    this._sidebarFooterItems.next(items);
  }

  public setShowLogin(visible: boolean) {
    this._showLogin.next(visible);
  }

  public setShowSearch(visible: boolean) {
    this._showSearch.next(visible);
  }

  public setShow(visible: boolean) {
    this._show.next(visible);
  }
}
