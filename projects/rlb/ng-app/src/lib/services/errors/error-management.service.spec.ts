import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ModalService, ToastService } from '@open-rlb/ng-bootstrap';
import { of, throwError } from 'rxjs';
import { ProjectConfiguration, RLB_CFG } from '../../configuration';
import { LanguageService } from '../i18n/language.service';
import { ErrorManagementService } from './error-management.service';

const MESSAGES: Record<string, string> = {
  'common.ok': 'Ok',
  'errors.http.429.title': 'Too many requests',
  'errors.http.429.message': 'You have made too many requests. Wait a few minutes.',
  'errors.http.429.messageRetry': 'You have made too many requests. Try again in {{minutes}} min.',
};

function httpError(status: number, headers?: Record<string, string>) {
  return new HttpErrorResponse({
    status,
    statusText: 'Error',
    url: 'https://api.example.com/rides',
    headers: headers ? new HttpHeaders(headers) : undefined,
    error: { status, message: 'Rate limit exceeded for partner 4711' },
  });
}

describe('ErrorManagementService', () => {
  let service: ErrorManagementService;
  let modal: jasmine.SpyObj<ModalService>;
  let toast: jasmine.SpyObj<ToastService>;

  function configure(config: Partial<ProjectConfiguration> = {}) {
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openModal']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['openToast']);
    modal.openModal.and.returnValue(of({ reason: 'close' } as any));
    toast.openToast.and.returnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        ErrorManagementService,
        { provide: ModalService, useValue: modal },
        { provide: ToastService, useValue: toast },
        {
          provide: LanguageService,
          useValue: {
            translate: (key: string, params?: Record<string, unknown>) =>
              (MESSAGES[key] ?? key).replace(/{{(\w+)}}/g, (_, n: string) => String(params?.[n])),
          },
        },
        {
          provide: RLB_CFG,
          useValue: { production: true, ...config } as ProjectConfiguration,
        },
      ],
    });
    service = TestBed.inject(ErrorManagementService);
  }

  it('renders the translated per-status message in the modal', () => {
    configure();
    service.showError('error', 'dialog', httpError(429));

    const [, data] = modal.openModal.calls.mostRecent().args;
    expect(data.title).toBe('Too many requests');
    expect(data.content).toBe('You have made too many requests. Wait a few minutes.');
  });

  it('interpolates the wait from Retry-After', () => {
    configure();
    service.showError('error', 'dialog', httpError(429, { 'Retry-After': '600' }));

    expect(modal.openModal.calls.mostRecent().args[1].content).toBe(
      'You have made too many requests. Try again in 10 min.',
    );
  });

  it('falls back to the backend text for an unmapped status', () => {
    configure();
    service.showError('error', 'dialog', httpError(422));

    const [, data] = modal.openModal.calls.mostRecent().args;
    expect(data.title).toBe('HttpErrorResponse');
    expect(data.content).toBe('422: Rate limit exceeded for partner 4711');
  });

  it('passes a non-HTTP error through untouched, so interceptors keep their say', () => {
    configure();
    const rewritten = new Error('Captcha check failed');
    rewritten.name = 'Verification';
    service.showError('error', 'dialog', rewritten);

    const [, data] = modal.openModal.calls.mostRecent().args;
    expect(data.title).toBe('Verification');
    expect(data.content).toBe('Captcha check failed');
  });

  it('shows one modal when the same failure hits several in-flight requests', () => {
    configure();
    for (let i = 0; i < 5; i++) {
      service.showError('error', 'dialog', httpError(429));
    }
    expect(modal.openModal).toHaveBeenCalledTimes(1);
  });

  it('still shows a different failure inside the same window', () => {
    configure();
    service.showError('error', 'dialog', httpError(429));
    service.showError('error', 'dialog', httpError(422));
    expect(modal.openModal).toHaveBeenCalledTimes(2);
  });

  it('does not let a modal suppress the matching toast', () => {
    configure();
    service.showError('error', 'dialog', httpError(429));
    service.showError('error', 'toast', httpError(429));
    expect(modal.openModal).toHaveBeenCalledTimes(1);
    expect(toast.openToast).toHaveBeenCalledTimes(1);
  });

  it('shows every error when dedupeMs is 0', () => {
    configure({ environment: { httpErrors: { dedupeMs: 0 } } as any });
    service.showError('error', 'dialog', httpError(429));
    service.showError('error', 'dialog', httpError(429));
    expect(modal.openModal).toHaveBeenCalledTimes(2);
  });

  it('manageUI describes the error and completes without emitting', () => {
    configure();
    const seen: unknown[] = [];
    let completed = false;
    throwError(() => httpError(429))
      .pipe(service.manageUI())
      .subscribe({ next: v => seen.push(v), complete: () => (completed = true) });

    expect(seen).toEqual([]);
    expect(completed).toBe(true);
    expect(modal.openModal.calls.mostRecent().args[1].title).toBe('Too many requests');
  });
});
