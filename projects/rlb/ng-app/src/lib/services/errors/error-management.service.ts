import { Inject, Injectable, Optional } from '@angular/core';
import { ModalService, ModalType, ToastService } from '@open-rlb/ng-bootstrap';
import { ErrorOutput, } from './errors';
import { EMPTY, Observable, OperatorFunction, catchError, of } from 'rxjs';
import { LanguageService } from '../i18n/language.service';
import { ProjectConfiguration, RLB_CFG } from '../../configuration';
import {
  DEFAULT_HTTP_ERROR_DEDUPE_MS,
  HttpErrorDescription,
  describeHttpError,
  isHttpErrorResponse,
} from './http-error-description';

@Injectable({
  providedIn: 'root'
})
export class ErrorManagementService {

  /** Last time each rendered (output, title, message) was shown. See `isDuplicate`. */
  private readonly shownAt = new Map<string, number>();

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
      if (!this.options?.production) {
        console.info("%c Error service: ShowToast", 'background: #ffcdc9; color: #000', error)
      }
      return of({ reason: 'console' })
    }
    return EMPTY;
  }

  public showDialog(type: ModalType, error?: any) {
    if (!this.options?.production) {
      console.info("%c Error service: ShowDialog", 'background: #ffcdc9; color: #000', error)
    }
    const described = this.describe(error);
    if (this.isDuplicate('dialog', described)) {
      return EMPTY;
    }
    return this.dialogService.openModal<string, void>(
      this.options?.environment?.errorDialogName || 'error-modal-component',
      {
        content: described.message,
        title: described.title,
        ok: this.languageService.translate('common.ok'),
        type,
      },
      {
        animation: true,
        backdrop: true,
        keyboard: true,
        size: this.options?.environment?.errorDialogSize || 'md',
        scrollable: true,
        focus: true,
        fullscreen: false,
        verticalcentered: true,
      }
    );
  }

  public showToast(type: ModalType, error?: any) {
    if (!this.options?.production) {
      console.info("%c Error service: ShowToast", 'background: #ffcdc9; color: #000', error)
    }
    const described = this.describe(error);
    if (this.isDuplicate('toast', described)) {
      return EMPTY;
    }
    return this.toastService.openToast(
      this.options?.environment?.errorToastContainer || 'error-toast-container',
      this.options?.environment?.errorToastName || 'error-toast',
      {
        content: described.message,
        title: described.title,
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

  /**
   * The one place a failure becomes words.
   *
   * An `HttpErrorResponse` gets the per-status message; anything else is already a message someone
   * wrote — an interceptor that rewrote a status it alone can recognise (a captcha 403 on two
   * specific routes, say), or a plain `throw` — and is passed through untouched.
   */
  private describe(error?: any): HttpErrorDescription {
    if (isHttpErrorResponse(error)) {
      return describeHttpError(
        error,
        (key, params) => this.languageService.translate(key, params),
        this.options?.environment?.httpErrors,
      );
    }
    return { title: error?.name || '', message: error?.message || '' };
  }

  /**
   * True when the same message was already put on screen a moment ago.
   *
   * One rate limit or one dropped connection fails every request in flight at once, and each of
   * them arrives here. Identical text, same output, inside the window is that — not a second thing
   * for the user to read.
   */
  private isDuplicate(out: ErrorOutput, described: HttpErrorDescription): boolean {
    const window = this.options?.environment?.httpErrors?.dedupeMs ?? DEFAULT_HTTP_ERROR_DEDUPE_MS;
    if (window <= 0) {
      return false;
    }
    const key = `${out}|${described.title}|${described.message}`;
    const now = Date.now();
    const last = this.shownAt.get(key);
    if (last !== undefined && now - last < window) {
      return true;
    }
    this.shownAt.set(key, now);
    for (const [seen, at] of this.shownAt) {
      if (now - at >= window) {
        this.shownAt.delete(seen);
      }
    }
    return false;
  }
}
