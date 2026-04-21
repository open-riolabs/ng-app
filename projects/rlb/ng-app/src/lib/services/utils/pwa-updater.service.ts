import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map, switchMap } from 'rxjs';
import { ModalService } from '@open-rlb/ng-bootstrap';
import { LanguageService } from '../i18n/language.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class PwaUpdaterService {
  private readonly updates = inject(SwUpdate);
  private readonly modalService = inject(ModalService);
  private readonly languageService = inject(LanguageService);

  private readonly _newVersionAvailable = signal(false);
  readonly newVersionAvailable = this._newVersionAvailable.asReadonly();

  get newVersionAvailable$() {
    return toObservable(this._newVersionAvailable);
  }

  constructor() {
    this.updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => (evt.type === 'VERSION_READY')),
        takeUntilDestroyed()
      ).subscribe(() => this._newVersionAvailable.set(true));
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
        filter((res) => res?.reason === 'ok'),
        map(() => this.updates.activateUpdate().then(() => location.reload()))
      );
  }
}


