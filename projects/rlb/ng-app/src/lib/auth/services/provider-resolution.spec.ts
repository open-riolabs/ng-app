import { ProviderConfiguration } from '../../configuration';
import { describeProviderResolutionFailure, resolveProvider } from './provider-resolution';

const provider = (configId: string, domains?: string[]): ProviderConfiguration =>
  ({ configId, domains }) as ProviderConfiguration;

describe('resolveProvider', () => {
  const dashboard = provider('dashboard-realm', ['app.example.com']);
  const partner = provider('partner-realm', ['partner.example.com', 'legacy.example.com']);

  it('prefers the id the store already settled on', () => {
    const resolution = resolveProvider([dashboard, partner], 'partner-realm', 'app.example.com');

    // The store wins even against a hostname pointing elsewhere: checkAuthMultiple sets it from the
    // configuration that actually authenticated, which is better evidence than the URL.
    expect(resolution.provider).toBe(partner);
    expect(resolution.reason).toBe('store');
  });

  it('ignores a stored id that names no configured provider', () => {
    const resolution = resolveProvider([dashboard, partner], 'removed-realm', 'app.example.com');

    expect(resolution.provider).toBe(dashboard);
    expect(resolution.reason).toBe('domain');
  });

  it('uses the only provider there is, whatever the hostname', () => {
    const resolution = resolveProvider([dashboard], null, 'localhost');

    expect(resolution.provider).toBe(dashboard);
    expect(resolution.reason).toBe('single');
  });

  it('resolves by hostname when several providers are configured', () => {
    const resolution = resolveProvider([dashboard, partner], null, 'legacy.example.com');

    expect(resolution.provider).toBe(partner);
    expect(resolution.reason).toBe('domain');
  });

  it('reports a hostname no provider claims rather than picking one', () => {
    const resolution = resolveProvider([dashboard, partner], null, 'retired.example.com');

    // Falling back to providers[0] here is the production bug this function exists to prevent: it
    // would authorize against the dashboard realm on a domain that holds no dashboard tokens.
    expect(resolution.provider).toBeUndefined();
    expect(resolution.reason).toBe('no-domain-match');
  });

  it('reports a hostname two providers claim', () => {
    const other = provider('other-realm', ['partner.example.com']);
    const resolution = resolveProvider([partner, other], null, 'partner.example.com');

    expect(resolution.provider).toBeUndefined();
    expect(resolution.reason).toBe('ambiguous-domain-match');
    expect(resolution.matched).toEqual([partner, other]);
  });

  it('distinguishes having no providers from having no match', () => {
    expect(resolveProvider([], null, 'app.example.com').reason).toBe('no-providers');
    expect(resolveProvider(undefined, null, 'app.example.com').reason).toBe('no-providers');
  });
});

describe('describeProviderResolutionFailure', () => {
  const providers = [provider('a-realm', ['a.example.com']), provider('b-realm', [])];

  it('names the hostname, the operation and every configured provider', () => {
    const resolution = resolveProvider(providers, null, 'c.example.com');
    const message = describeProviderResolutionFailure(
      resolution,
      'c.example.com',
      providers,
      'login',
    );

    expect(message).toContain('c.example.com');
    expect(message).toContain('login');
    expect(message).toContain('a-realm');
    expect(message).toContain('b-realm');
  });

  it('names the competing providers when two claim the same host', () => {
    const clashing = [provider('a-realm', ['x.example.com']), provider('b-realm', ['x.example.com'])];
    const resolution = resolveProvider(clashing, null, 'x.example.com');

    expect(describeProviderResolutionFailure(resolution, 'x.example.com', clashing)).toContain(
      'a-realm, b-realm',
    );
  });
});
