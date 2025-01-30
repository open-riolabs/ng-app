import { EventEmitter, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map, switchMap } from 'rxjs';
import { ModalService } from '@sicilyaction/lib-ng-bootstrap';
import { LanguageService } from '../i18n/language.service';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdaterService {

  private _newVersionAvailable$ = new EventEmitter<void>();

  get newVersionAvailable$() {
    return this._newVersionAvailable$.asObservable();
  }

  constructor(
    private readonly updates: SwUpdate,
    private readonly modalService: ModalService,
    private readonly languageService: LanguageService) {
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

  checkWithDialog() {
    return this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => {
          const result = evt.type === 'VERSION_READY';
          return result;
        }),
        switchMap(() =>
          this.modalService.openSimpleModal(
            this.languageService.translate('core.pwa.newVersionAvailable'),
            this.languageService.translate('core.pwa.updateMessage'),
            this.languageService.translate('core.pwa.updateNow'),
            this.languageService.translate('core.pwa.update'),
            this.languageService.translate('core.pwa.later'))
        ),
        filter((res) => res?.reason === 'ok'), //si ferma se l'evento non è una action
        map(() => this.updates.activateUpdate().then(() => location.reload()))
      )
  }
}

