import { Inject, Injectable, Optional } from '@angular/core';
import { ModalService, ModalType, ToastService } from '@rlb/ng-bootstrap';
import { ErrorOutput, } from './errors';
import { EMPTY, Observable, OperatorFunction, catchError, of } from 'rxjs';
import { LanguageService } from '..';
import { ProjectConfiguration, RLB_CFG } from '../../configuration';

@Injectable({
  providedIn: 'root'
})
export class ErrorManagementService {

  constructor(
    private dialogService: ModalService,
    private toastService: ToastService,
    private languageService: LanguageService,
    @Inject(RLB_CFG) @Optional() private options: ProjectConfiguration
  ) { }

  public showError(type: ModalType = 'error', out: ErrorOutput = 'dialog', error?: any) {
    if (out === 'dialog') {
      return this.showDialog(type, error);
    }
    if (out === 'toast') {
      return this.showToast(type, error);
    }
    if (out === 'console') {
      if (!this.options.production) {
        console.info("%c Error service: ShowToast", 'background: #ffcdc9; color: #000', error)
      }
      return of({ reason: 'console' })
    }
    return EMPTY;
  }

  public showDialog(type: ModalType, error?: any) {
    if (!this.options.production) {
      console.info("%c Error service: ShowDialog", 'background: #ffcdc9; color: #000', error)
    }
    return this.dialogService.openModal<string, void>(
      this.options?.environment?.errorDialogName || 'error-dialog',
      {
        content: this.languageService.translate('error.content'),
        title: this.languageService.translate('error.title'),
        ok: this.languageService.translate('common.ok'),
        type,
      },
      {
        animation: true,
        backdrop: true,
        keyboard: true,
        size: 'lg',
        scrollable: true,
        focus: true,
        fullscreen: false,
        verticalcentered: true,
      }
    );
  }

  public showToast(type: ModalType, error?: any) {
    if (!this.options.production) {
      console.info("%c Error service: ShowToast", 'background: #ffcdc9; color: #000', error)
    }
    return this.toastService.openToast(
      this.options?.environment?.errorToastContainer || 'error-toast-container',
      this.options?.environment?.errorToastName || 'error-toast',
      {
        content: this.languageService.translate('error.content'),
        title: this.languageService.translate('error.title'),
        ok: this.languageService.translate('common.ok'),
        type: 'error'
      },
      {
        animation: true,
        autohide: true,
        delay: 5000,
      }
    );
  }

  public manageUI<T>(type: ModalType = 'error', out: ErrorOutput = 'dialog'): OperatorFunction<T, T> {
    return (source: Observable<T>) => {
      return source.pipe(
        catchError((error, k) => {
          this.showError(type, out, error);
          return EMPTY;
        }),
      );
    };
  }
}
