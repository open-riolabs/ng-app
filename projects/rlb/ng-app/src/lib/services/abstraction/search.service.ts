import { EventEmitter, Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private searchEnable: Subject<boolean>

  public get searchEnabled$(): Observable<boolean> {
    return this.searchEnable.asObservable()
  }

  public onChange: EventEmitter<string>

  constructor() {
    this.onChange = new EventEmitter<string>()
    this.searchEnable = new Subject<boolean>()
  }

  onSearchChanged(text: string) {
    this.onChange.emit(text)
  }

  enableSearch() {
    this.searchEnable.next(true)
  }

  disableSearch() {
    this.searchEnable.next(false)
  }
}
