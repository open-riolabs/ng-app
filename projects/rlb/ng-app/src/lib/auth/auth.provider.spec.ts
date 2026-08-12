import { AuthConfiguration, ProviderConfiguration } from '../configuration';
import { oidcConfigsFor } from './auth.provider';

const provider = (configId: string, extra?: Partial<ProviderConfiguration>): ProviderConfiguration =>
  ({ configId, authority: `https://login.example.com/realms/${configId}`, ...extra }) as
    ProviderConfiguration;

const authConfig = (
  interceptor: AuthConfiguration['interceptor'],
  providers: ProviderConfiguration[] = [provider('dashboard-realm')],
): AuthConfiguration => ({
  protocol: 'oauth',
  storage: 'localStorage',
  interceptor,
  allowedUrls: ['https://api.example.com'],
  providers,
});

describe('oidcConfigsFor', () => {
  it('leaves the library renewing on its own under every other interceptor', () => {
    // The behaviour every consumer on 'oauth-code-ep' / 'oauth-code-all' has today: nothing else
    // renews their token, so the library's periodic check has to.
    for (const interceptor of ['oauth-code-all', 'oauth-code-ep', 'none', undefined] as const) {
      const [config] = oidcConfigsFor(authConfig(interceptor));

      expect(config.silentRenew)
        .withContext(`interceptor: ${interceptor}`)
        .toBeTrue();
    }
  });

  it('switches the library renewal off when the watchdog owns it', () => {
    // Two renewers against one refresh token, and only the watchdog's attempts restore storage after
    // the library wipes it: through an outage the unguarded one ends the session (audit F8).
    const configs = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('dashboard-realm'), provider('partner-realm')]),
    );

    expect(configs.map(config => config.silentRenew)).toEqual([false, false]);
  });

  it('lets a provider ask for the library renewal back', () => {
    // The escape hatch this function exists for: silentRenew used to be pinned after the spread, so
    // a host could not override it from its environment at all.
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('legacy-realm', { silentRenew: true })]),
    );

    expect(config.silentRenew).toBeTrue();
  });

  it('pins everything else whatever the provider says', () => {
    // These carry the flow the whole kit assumes — refresh tokens, code flow, user info on renewal.
    // A provider silently turning one off would break renewal in a way no spec below would catch.
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [
        provider('partner-realm', {
          responseType: 'id_token token',
          useRefreshToken: false,
          autoUserInfo: false,
          secureRoutes: ['https://elsewhere.example.com'],
        }),
      ]),
    );

    expect(config.responseType).toBe('code');
    expect(config.useRefreshToken).toBeTrue();
    expect(config.autoUserInfo).toBeTrue();
    expect(config.renewUserInfoAfterTokenRenew).toBeTrue();
    expect(config.ignoreNonceAfterRefresh).toBeTrue();
    expect(config.renewTimeBeforeTokenExpiresInSeconds).toBe(30);
    expect(config.secureRoutes).toEqual(['https://api.example.com']);
  });

  it('keeps what the provider itself declares', () => {
    const [config] = oidcConfigsFor(
      authConfig('oauth-code-ep-retry', [provider('partner-realm', { clientId: 'partner' })]),
    );

    expect(config.configId).toBe('partner-realm');
    expect(config.clientId).toBe('partner');
    expect(config.authority).toBe('https://login.example.com/realms/partner-realm');
  });
});
