import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorMessagesConfiguration } from '../../configuration';

/** i18n namespace searched when {@link HttpErrorMessagesConfiguration.keyPrefix} is unset. */
export const DEFAULT_HTTP_ERROR_KEY_PREFIX = 'errors.http';

/** See {@link HttpErrorMessagesConfiguration.dedupeMs}. */
export const DEFAULT_HTTP_ERROR_DEDUPE_MS = 1000;

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/** What the error modal/toast actually renders. */
export interface HttpErrorDescription {
  title: string;
  message: string;
}

/** `LanguageService.translate`, narrowed to what the description needs. */
export type TranslateFn = (key: string, params?: object) => unknown;

/**
 * `instanceof` plus the duck-type check the handler has always used.
 *
 * Both are needed. A response thrown by an `HttpClient` from a *different* copy of
 * `@angular/common/http` — a lazily loaded remote, a library bundled with its own — fails
 * `instanceof` while still being an `HttpErrorResponse` in every way that matters here.
 */
export function isHttpErrorResponse(error: unknown): error is HttpErrorResponse {
  return (
    error instanceof HttpErrorResponse ||
    (!!error && (error as HttpErrorResponse).name === 'HttpErrorResponse')
  );
}

/**
 * Seconds the server asked the caller to wait, or `undefined` when it did not say.
 *
 * RFC 9110 allows either delta-seconds or an HTTP-date, and both are seen in the wild.
 */
export function retryAfterSeconds(error: HttpErrorResponse): number | undefined {
  const raw = error.headers?.get('Retry-After')?.trim();
  if (!raw) {
    return undefined;
  }
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  const at = Date.parse(raw);
  if (Number.isNaN(at)) {
    return undefined;
  }
  // A date already in the past means "retry now", not a negative wait.
  return Math.max(0, Math.round((at - Date.now()) / MS_PER_SECOND));
}

/**
 * Turns an `HttpErrorResponse` into the title and message to show the user.
 *
 * Falls back to the backend's own text when nothing is translated, so adding this to an app that
 * ships no `errors.http.*` keys changes nothing.
 */
export function describeHttpError(
  error: HttpErrorResponse,
  translate: TranslateFn,
  config?: HttpErrorMessagesConfiguration,
): HttpErrorDescription {
  const prefix = config?.keyPrefix || DEFAULT_HTTP_ERROR_KEY_PREFIX;
  const seconds = retryAfterSeconds(error);
  const minutes =
    seconds === undefined
      ? config?.defaultRetryMinutes
      : // Round up: "wait 0 minutes" is not an instruction anyone can follow.
        Math.max(1, Math.ceil(seconds / SECONDS_PER_MINUTE));
  const params = { status: error.status, seconds, minutes };
  const knownWait = minutes !== undefined;

  return (
    describeFromGroup(`${prefix}.${error.status}`, translate, params, knownWait) ??
    describeFromGroup(`${prefix}.default`, translate, params, knownWait) ??
    backendText(error)
  );
}

/**
 * A group wins or falls through as a whole — a status group that resolves a title but no message
 * would otherwise put its heading on the default group's body.
 */
function describeFromGroup(
  group: string,
  translate: TranslateFn,
  params: object,
  knownWait: boolean,
): HttpErrorDescription | undefined {
  const message =
    (knownWait ? resolve(`${group}.messageRetry`, translate, params) : undefined) ??
    resolve(`${group}.message`, translate, params);
  if (message === undefined) {
    return undefined;
  }
  return { title: resolve(`${group}.title`, translate, params) ?? '', message };
}

function resolve(key: string, translate: TranslateFn, params: object): string | undefined {
  const value = translate(key, params);
  // ngx-translate's instant() echoes the key back when it cannot resolve it, and hands back the
  // raw node (an object) when the key names a group rather than a leaf. Both are misses.
  return typeof value === 'string' && value.length > 0 && value !== key ? value : undefined;
}

/** What `manageUI` rendered before there were per-status messages. */
function backendText(error: HttpErrorResponse): HttpErrorDescription {
  const body = error.error as { status?: number; message?: string } | null | undefined;
  return {
    title: error.name || 'HttpErrorResponse',
    message: body?.message ? `${body.status ?? error.status}: ${body.message}` : error.message,
  };
}
