import { EventEmitter, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdaterService {

  private _newVersionAvailable$ = new EventEmitter<void>();

  get newVersionAvailable$() {
    return this._newVersionAvailable$.asObservable();
  }

  constructor(private updates: SwUpdate) {
    this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => (evt.type === 'VERSION_READY'))
      ).subscribe(() => this._newVersionAvailable$.emit());
  }

  update() {
    this.updates.activateUpdate()
      .then(() => document.location.reload());
  }

  async checkForUpdates() {
    return await this.updates.checkForUpdate();
  }
}
