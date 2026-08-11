import { ProviderConfiguration } from '../../configuration';

/**
 * Why {@link resolveProvider} answered the way it did.
 *
 * The three failures are kept apart because they need different words in front of a developer:
 * nothing configured is a different mistake from a hostname no provider claims, which is a
 * different mistake again from two providers claiming the same one.
 */
export type ProviderResolutionReason =
  | 'store'
  | 'single'
  | 'domain'
  | 'no-providers'
  | 'no-domain-match'
  | 'ambiguous-domain-match';

export interface ProviderResolution {
  /** The provider to use, or undefined when none could be resolved. */
  provider?: ProviderConfiguration;
  reason: ProviderResolutionReason;
  /** Every provider that claimed the hostname. Only interesting for 'ambiguous-domain-match'. */
  matched: ProviderConfiguration[];
}

/**
 * Picks the auth provider this page should be using.
 *
 * One algorithm, shared by `AuthenticationService` and `AppsService`, because the two used to
 * re-derive it separately and could therefore disagree: the store-backed getter would return
 * undefined while the OIDC library — handed that undefined — silently used the first registered
 * configuration instead, a different realm holding none of this tenant's tokens.
 *
 * The order runs from most to least specific:
 *
 * 1. the id the store already holds, when it names a configured provider — this is the normal path
 *    once `checkAuthMultiple` or `AppsService` has settled the question;
 * 2. the only provider there is, when a single one is configured;
 * 3. the provider whose `domains` claims this hostname, when exactly one does.
 *
 * Resolution is by **hostname, never by configId**: the domain is what identifies a portal, while
 * `configId` is only the OIDC library's storage key and is free to differ between environments.
 *
 * Pure and side-effect-free — callers decide how loudly to react to a failure.
 */
export function resolveProvider(
  providers: ProviderConfiguration[] | undefined,
  storeConfigId: string | null | undefined,
  hostname: string,
): ProviderResolution {
  if (!providers?.length) return { reason: 'no-providers', matched: [] };

  const stored = storeConfigId
    ? providers.find(provider => provider.configId === storeConfigId)
    : undefined;
  if (stored) return { provider: stored, reason: 'store', matched: [] };

  if (providers.length === 1) return { provider: providers[0], reason: 'single', matched: [] };

  const matched = providers.filter(provider => provider.domains?.includes(hostname));

  if (matched.length === 1) return { provider: matched[0], reason: 'domain', matched };
  if (matched.length > 1) return { reason: 'ambiguous-domain-match', matched };

  return { reason: 'no-domain-match', matched };
}

/** Whether a resolution failed to name a provider. */
export function isProviderResolutionFailure(resolution: ProviderResolution): boolean {
  return !resolution.provider;
}

/**
 * The message to put in front of whoever has to fix a failed resolution.
 *
 * Names the hostname, every configured provider with the domains it claims, and the change that
 * would resolve it — a misconfigured domain used to surface as a console warning and an app that
 * stayed silently unauthenticated forever, which is the failure mode this text exists to end.
 */
export function describeProviderResolutionFailure(
  resolution: ProviderResolution,
  hostname: string,
  providers: ProviderConfiguration[] | undefined,
  operation?: string,
): string {
  const where = operation ? ` (required by ${operation})` : '';
  const configured = (providers ?? [])
    .map(provider => `${provider.configId} -> [${(provider.domains ?? []).join(', ') || 'no domains'}]`)
    .join('; ');

  if (resolution.reason === 'ambiguous-domain-match') {
    const ids = resolution.matched.map(provider => provider.configId).join(', ');
    return (
      `Several auth providers claim the domain '${hostname}'${where}: ${ids}. ` +
      `Give exactly one provider a 'domains' entry containing '${hostname}'. Configured: ${configured}`
    );
  }

  if (resolution.reason === 'no-providers') {
    return `No auth providers are configured${where}. Add at least one entry to auth.providers.`;
  }

  return (
    `No auth provider is configured for the domain '${hostname}'${where}. ` +
    `Add '${hostname}' to the 'domains' of the provider that serves it. Configured: ${configured}`
  );
}
