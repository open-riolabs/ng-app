import { EnvironmentProviders, Provider } from '@angular/core';

/**
 * Registers `providers` only on the domains that should have them.
 *
 * `provideApp` spreads an `AppDescriber`'s providers into the **root** injector, unconditionally
 * and on every domain — `AppInfo.domains` filters what the shell *shows*, never what it *provides*.
 * So a host that registers several describers gives every tenant every describer's interceptors,
 * initializers and services. That is easy to miss: a tenant-local HTTP interceptor added to one
 * app's describer silently joins the chain on all the others, where it was never tested.
 *
 * Wrap anything tenant-local in this helper:
 *
 * ```ts
 * providers: [
 *   ...provideForDomains(PARTNER_DOMAINS, [
 *     { provide: HTTP_INTERCEPTORS, useClass: PartnerInterceptor, multi: true },
 *   ]),
 * ]
 * ```
 *
 * The check runs while the providers array is being built — before bootstrap, in the browser — so
 * the providers are genuinely never registered rather than registered and then disabled at runtime.
 *
 * On the server there is no `location`, so nothing is registered; pass `hostname` explicitly for
 * SSR, and in specs, where it also makes the intent readable.
 */
export function provideForDomains(
  domains: readonly string[],
  providers: (Provider | EnvironmentProviders)[],
  hostname: string = globalThis.location?.hostname ?? '',
): (Provider | EnvironmentProviders)[] {
  return domains.includes(hostname) ? providers : [];
}
