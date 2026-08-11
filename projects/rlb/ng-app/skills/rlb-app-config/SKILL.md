---
name: rlb-app-config
description: Configuration and bootstrap of an app built on @open-rlb/ng-app — the ProjectConfiguration/environment shape, provideRlbConfig(), provideApp(), the AppDescriber, and the RLB_INIT_PROVIDER startup hook. Use when wiring up app.config.ts, editing environment.ts, or changing app metadata/routes.
---

# @open-rlb/ng-app — Configuration & Bootstrap

You are an expert in bootstrapping an Angular application on the **@open-rlb/ng-app** library. A host app is intentionally thin: it supplies a `ProjectConfiguration` (the environment), an `AppDescriber`, and an optional ACL init provider, then the library wires the store, router, auth, HTTP, i18n and service worker.

## app.config.ts — the three building blocks

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRlbConfig(environment),   // store + router + auth + i18n + http + SW + registries
    provideApp(appDescriber),        // app identity, ACL actions, routes, custom providers
    { provide: RLB_INIT_PROVIDER, useClass: AppInitAclProvider }, // optional startup ACL mapping
    provideZonelessChangeDetection(),
  ],
};
```

- `provideRlbConfig(environment)` is the only place the library config is read. It internally calls `provideRlbBootstrap()` (so do NOT call it again), registers the four NgRx feature slices, the default routes derived from `environment.pages`, OIDC auth (`provideRlbCodeBrowserOAuth(env.auth)`), i18n (`provideRlbI18n(env.i18n)`), `provideHttpClient(withInterceptorsFromDi())`, the service worker, and the built-in modal/toast registries.
- `provideApp(appDescriber)` registers `RLB_APPS` (multi), adds `appDescriber.routes` via `provideRouter`, and spreads any `appDescriber.providers`. At runtime those registered apps are filtered and selected by `AppsService` — see [[rlb-app-apps]].

### Describer providers are global — scope them yourself

`appDescriber.providers` and `.routes` land in the **root injector on every domain**. `info.domains`
gates what the shell shows and which app the router selects; it does not gate registration, and
cannot — `AppsService` needs every `AppInfo` for the hub, for domain filtering and for
`findAppForPath`.

So a tenant-local interceptor or app initializer added to one app's describer silently joins the
chain on every other tenant, where it was never tested. Wrap it:

```typescript
import { provideForDomains } from '@open-rlb/ng-app';

const PARTNER_DOMAINS = ['partner.example.com', 'legacy.example.com'];

export const partnerDescriber: AppDescriber = {
  info: { /* ... */ domains: PARTNER_DOMAINS },
  providers: [
    ...provideForDomains(PARTNER_DOMAINS, [
      { provide: HTTP_INTERCEPTORS, useClass: PartnerInterceptor, multi: true },
    ]),
  ],
};
```

The check runs while the providers array is being built — before bootstrap — so the providers are
genuinely never registered, not registered and then disabled. Pass a third `hostname` argument for
SSR and in specs; without a `location` it registers nothing.

## environment.ts — ProjectConfiguration

`ProjectConfiguration = IConfiguration & { production: boolean }`. Sections:

| Key | Purpose |
|---|---|
| `environment` | app metadata: `appTitle`, `appLogo`, `baseUrl`, `errorDialogName`, `logLevel`, `pwaUpdateEnabled`, `navbarDisabled` |
| `auth` | OIDC: `protocol: 'oauth'`, `storage`, `interceptor`, `allowedUrls`, `providers[]` (per-provider `authority`/`clientId`/`redirectUrl`/`acl`) |
| `i18n` | `availableLangs`, `defaultLanguage`, `useLanguageBrowser`, `storeSelectedLanguage`, `cookieStoreName` |
| `pages` | named route paths for standard pages (notFound, forbidden, support, …) |
| `endpoints` | named HTTP/WS backends (`{ baseUrl, healthPath, auth, wss }`) referenced by key (e.g. `http-gateway`) |
| `acl` | `businessIdKey`, `resourceIdKey`, `interceptorMapping` |

Inject any slice with the tokens: `RLB_CFG`, `RLB_CFG_ENV`, `RLB_CFG_I18N`, `RLB_CFG_PAGES`, `RLB_CFG_ACL`, `RLB_CFG_CMS`.

## AppDescriber

```typescript
export const appDescriber: AppDescriber = {
  info: {
    type: 'app',
    enabled: true,
    actions: ['sysadmin', ...],   // ACL action names this app understands
    core: { title, description, url, icon, auth: true },
    settings: { title, description, url, icon, auth: true },
  },
  routes,                          // Angular Routes; flattened paths are registered with RLB_APPS
  providers: [ /* optional: e.g. RLB_APP_NAVCOMP overrides */ ],
};
```

## RLB_INIT_PROVIDER

A class implementing `RlbInitProvider.finalizeApps(resources, store, acl)`. It runs after authentication, turning the user's ACL `UserResource[]` into app instances via `AppContextActions.finalizeApp(...)`. Optional — omit the provider if you don't drive apps from ACL. See [[rlb-app-auth-acl]].

## Common gotchas

- The app is **zoneless** — never rely on zone.js; use signals.
- `appLogo`/i18n files live under `src/assets`; ensure `assets` includes `src/assets` in `angular.json`.
- The service worker is `enabled: !isDevMode()`, so it's off under `ng serve`. For production builds, configure `ngsw-config.json` (e.g. `ng add @angular/pwa`).

Related: [[rlb-app-apps]], [[rlb-app-shell]], [[rlb-app-store]], [[rlb-app-auth-acl]].
