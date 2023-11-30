import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  private _sidebarItems: Subject<any[]> = new Subject<any[]>();
  private _sidebarFooterItems: Subject<any[]> = new Subject<any[]>();

  public get sidebarItems$() {
    return this._sidebarItems.asObservable();
  }

  public get sidebarFooterItems$() {
    return this._sidebarFooterItems.asObservable();
  }

  public setSidebarItems(items: any[]) {
    this._sidebarItems.next(items);
  }

  public setSidebarFooterItems(items: any[]) {
    this._sidebarFooterItems.next(items);
  }
}
