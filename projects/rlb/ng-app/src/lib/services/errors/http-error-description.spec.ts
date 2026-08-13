import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { describeHttpError, isHttpErrorResponse, retryAfterSeconds } from './http-error-description';

/** Stands in for ngx-translate's instant(): echoes the key back when it cannot resolve it. */
function translator(dictionary: Record<string, string>) {
  return (key: string, params?: object) => {
    const value = dictionary[key];
    if (value === undefined) {
      return key;
    }
    return value.replace(/{{(\w+)}}/g, (_, name: string) => String((params as any)?.[name]));
  };
}

function httpError(status: number, init: { headers?: Record<string, string>; body?: unknown } = {}) {
  return new HttpErrorResponse({
    status,
    statusText: 'Error',
    url: 'https://api.example.com/rides',
    headers: init.headers ? new HttpHeaders(init.headers) : undefined,
    error: init.body ?? null,
  });
}

describe('isHttpErrorResponse', () => {
  it('accepts a real HttpErrorResponse', () => {
    expect(isHttpErrorResponse(httpError(429))).toBe(true);
  });

  it('accepts one from another copy of @angular/common/http', () => {
    expect(isHttpErrorResponse({ name: 'HttpErrorResponse', status: 429 })).toBe(true);
  });

  it('rejects a plain Error and nullish values', () => {
    expect(isHttpErrorResponse(new Error('boom'))).toBe(false);
    expect(isHttpErrorResponse(undefined)).toBe(false);
    expect(isHttpErrorResponse(null)).toBe(false);
  });
});

describe('retryAfterSeconds', () => {
  // An HTTP-date has one-second resolution, so the wait it implies is only exact against a clock
  // sitting on a whole second.
  const NOW = Date.parse('Thu, 13 Aug 2026 15:00:00 GMT');

  beforeEach(() => jasmine.clock().install().mockDate(new Date(NOW)));
  afterEach(() => jasmine.clock().uninstall());

  it('reads delta-seconds', () => {
    expect(retryAfterSeconds(httpError(429, { headers: { 'Retry-After': '120' } }))).toBe(120);
  });

  it('reads an HTTP-date as a wait from now', () => {
    const at = new Date(NOW + 90_000).toUTCString();
    expect(retryAfterSeconds(httpError(429, { headers: { 'Retry-After': at } }))).toBe(90);
  });

  it('clamps a date already in the past to zero', () => {
    const at = new Date(NOW - 90_000).toUTCString();
    expect(retryAfterSeconds(httpError(429, { headers: { 'Retry-After': at } }))).toBe(0);
  });

  it('returns undefined when the header is absent or unparsable', () => {
    expect(retryAfterSeconds(httpError(429))).toBeUndefined();
    expect(retryAfterSeconds(httpError(429, { headers: { 'Retry-After': 'soon' } }))).toBeUndefined();
  });
});

describe('describeHttpError', () => {
  const messages = {
    'errors.http.429.title': 'Too many requests',
    'errors.http.429.message': 'You have made too many requests. Wait a few minutes.',
    'errors.http.429.messageRetry': 'You have made too many requests. Try again in {{minutes}} min.',
    'errors.http.default.title': 'Something went wrong',
    'errors.http.default.message': 'Please try again later.',
  };

  it('uses the per-status group', () => {
    expect(describeHttpError(httpError(429), translator(messages))).toEqual({
      title: 'Too many requests',
      message: 'You have made too many requests. Wait a few minutes.',
    });
  });

  it('prefers messageRetry and rounds Retry-After up to whole minutes', () => {
    const error = httpError(429, { headers: { 'Retry-After': '61' } });
    expect(describeHttpError(error, translator(messages)).message).toBe(
      'You have made too many requests. Try again in 2 min.',
    );
  });

  it('never says "0 minutes"', () => {
    const error = httpError(429, { headers: { 'Retry-After': '5' } });
    expect(describeHttpError(error, translator(messages)).message).toContain('in 1 min');
  });

  it('falls back to defaultRetryMinutes when the header is missing', () => {
    expect(
      describeHttpError(httpError(429), translator(messages), { defaultRetryMinutes: 10 }).message,
    ).toBe('You have made too many requests. Try again in 10 min.');
  });

  it('falls back to the default group for an unmapped status', () => {
    expect(describeHttpError(httpError(418), translator(messages))).toEqual({
      title: 'Something went wrong',
      message: 'Please try again later.',
    });
  });

  it('takes a group whole rather than mixing two', () => {
    // Status group resolves a title but no message: the title must not survive onto the default
    // group's body.
    const partial = { ...messages, 'errors.http.418.title': 'Teapot' };
    expect(describeHttpError(httpError(418), translator(partial)).title).toBe(
      'Something went wrong',
    );
  });

  it('honours a custom keyPrefix', () => {
    const custom = { 'app.http.429.message': 'Slow down' };
    expect(
      describeHttpError(httpError(429), translator(custom), { keyPrefix: 'app.http' }),
    ).toEqual({ title: '', message: 'Slow down' });
  });

  it('shows the backend text when nothing is translated', () => {
    const error = httpError(422, { body: { status: 422, message: 'Invalid VAT number' } });
    expect(describeHttpError(error, translator({}))).toEqual({
      title: 'HttpErrorResponse',
      message: '422: Invalid VAT number',
    });
  });

  it("keeps Angular's own message when the body carries no message", () => {
    const error = httpError(500);
    expect(describeHttpError(error, translator({})).message).toBe(error.message);
  });
});
