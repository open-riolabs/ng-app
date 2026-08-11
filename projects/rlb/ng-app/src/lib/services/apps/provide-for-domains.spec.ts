import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideForDomains } from './provide-for-domains';

const TENANT_ONLY = new InjectionToken<string>('tenant-only');

describe('provideForDomains', () => {
  it('registers the providers on a domain in the list', () => {
    const providers = [{ provide: TENANT_ONLY, useValue: 'on' }];

    expect(provideForDomains(['partner.example.com'], providers, 'partner.example.com')).toBe(
      providers,
    );
  });

  it('registers nothing on a domain outside the list', () => {
    const providers = [{ provide: TENANT_ONLY, useValue: 'on' }];

    expect(provideForDomains(['partner.example.com'], providers, 'dashboard.example.com')).toEqual(
      [],
    );
  });

  it('registers nothing where there is no location, as on the server', () => {
    expect(provideForDomains(['partner.example.com'], [{ provide: TENANT_ONLY, useValue: 'on' }], ''))
      .toEqual([]);
  });

  it('keeps a scoped provider out of the injector entirely', () => {
    // Not merely inert: describer providers reach the root injector on every domain, so a
    // tenant-local interceptor has to be absent rather than present-but-disabled.
    TestBed.configureTestingModule({
      providers: [
        ...provideForDomains(
          ['partner.example.com'],
          [{ provide: TENANT_ONLY, useValue: 'on' }],
          'dashboard.example.com',
        ),
      ],
    });

    expect(TestBed.inject(TENANT_ONLY, null)).toBeNull();
  });
});
