---
name: rlb-app-apps
description: The @open-rlb/ng-app multi-app orchestration — the AppInfo/AppDescriber model, AppsService (the runtime engine), domain + ACL filtering of apps, current-app selection from the route, and root/deep-link redirect rules. Use when registering apps, building an app hub/selector, controlling which app is "current", or debugging why an app isn't shown or selected.
---

# @open-rlb/ng-app — Apps & Orchestration

`@open-rlb/ng-app` is a **multi-app shell**: a single host hosts one or more logical "apps", each
described by an `AppInfo`. **`AppsService`** is the runtime engine that filters those apps by
domain and ACL, selects the current app from the active route, and applies redirect rules. It is
exported from the public API and **eagerly bootstrapped** by `provideRlbConfig`
(`provideAppInitializer(() => inject(AppsService))`), so it runs as soon as the app starts.

## The app model — `AppInfo`

An app is registered via `provideApp(appDescriber)` (`AppDescriber.info` is an `AppInfo`). Fields
that drive runtime behavior:

| Field | Drives |
|---|---|
| `type` | App kind/category (e.g. `'app'`); used in `finalizeApp`/route matching. |
| `enabled` | Whether the app participates. |
| `core` / `settings` | `AppDetails` — `{ title, description, url, icon, auth }`. `core.url` is the app's landing route and the redirect target. |
| `viewMode` | `'app'` \| `'settings'` — how the shell frames the app. |
| `routes` | Route path strings owned by the app; matched against the active URL to select it. |
| `domains` | If set, the app only appears/activates on those `window.location.hostname`s (domain gating). |
| `actions` | ACL action names; the app is hidden unless the user holds a matching resource action (ACL gating). |
| `autoRedirectOnRootEnabled` | At root with multiple apps, redirect to this app's `core.url`. |
| `data` | Arbitrary payload; carries the ACL `businessIdKey` / `resourceIdKey` values used for permission checks. |

```typescript
export const appDescriber: AppDescriber = {
  info: {
    type: 'app',
    enabled: true,
    actions: ['sysadmin'],
    core: { title: 'My App', description: '', url: '/home', icon: 'bi bi-house', auth: true },
  },
  routes,   // Angular Routes; flattened paths are stored on RLB_APPS
};
```

## Registration → runtime lifecycle

```
provideApp(appDescriber)            register the AppInfo into RLB_APPS (multi)
  → RLB_INIT_PROVIDER.finalizeApps  ACL hook dispatches AppContextActions.finalizeApp → apps gain an `id`
  → AppsService.apps (computed)     filters finalized apps by domain + ACL resources/actions
  → router listener (NavigationEnd) matches the route → selects currentApp + applies redirects
```

This is the "AppsService orchestration" step of the auth pipeline
(`checkAuthMultiple → resourcesByUser → finalizeApp → AppsService orchestration`). See
[[rlb-app-auth-acl]] for the ACL hook and [[rlb-app-config]] for `provideApp`/`RLB_APPS`.

## Reading apps from a component

Inject `AppsService` and read its signals (zoneless — use signals, never zone.js):

```typescript
private apps = inject(AppsService);

readonly visibleApps = this.apps.apps;        // signal: domain- + ACL-filtered AppInfo[]
readonly current = this.apps.currentApp;      // signal: AppInfo | null
readonly currentId = this.apps.currentAppId;  // signal: string | undefined

canEdit = this.apps.checkPermissionInCurrentApp('catalog-editor'); // ACL in current app
this.apps.selectApp(app, 'app', '/home');     // manually select (the app hub/selector uses this)
```

The built-in app/settings selector pages (`pages/apps/*`, `pages/settings/*`) render
`apps()` and call `selectApp(...)`.

## Current-app selection & redirect rules

On each `NavigationEnd`, `AppsService` resolves the active route and applies (in order):

1. **Single app at root** → auto-redirect to that app's `core.url`.
2. **Multiple apps at root** → show the app hub (`currentApp` is `null`), unless an app has
   `autoRedirectOnRootEnabled` (then redirect to it).
3. **Deep link** (non-root) → select the app whose `routes`/`core.url` matches the path.

Selection waits until apps are **finalized** (every app has an `id`); until then `currentApp`
stays unresolved.

## ACL on initial deep-link — `findAppForPath`

Because `currentApp` isn't selected until `NavigationEnd` fires, `permissionGuard` handles the
first navigation specially: if no `currentApp` yet, it calls
`appsService.findAppForPath(path)` to locate the owning app from the URL, then
`checkPermissionForApp(app, action)`. After that, it uses `checkPermissionInCurrentApp(action)`.
The `*roles` directive also reads `checkPermissionInCurrentApp` (re-runs reactively). See
[[rlb-app-auth-acl]].

## Multi-provider auth by domain

`AppsService.initAuthProviders()` picks the OIDC provider at startup: if one provider, use it; if
several, match by `provider.domains` against the current hostname. Multiple matches (or none) log
a warning and leave the provider unset — give each provider a distinct `domains` entry.

## Gotchas

- **Apps must be finalized** (have an `id`) before selection resolves — driven by the ACL init
  hook; an empty `apps()` usually means ACL/finalize hasn't run yet.
- **`currentApp()` is `null` at root** in multi-app (hub) mode — that's expected, not an error.
- **Domain gating uses `window.location.hostname`** — `localhost` won't match production
  `domains`; include `localhost` (or omit `domains`) for local dev.
- Don't re-run `selectApp` redundantly — it no-ops when the id + viewMode are unchanged.

Related: [[rlb-app-config]], [[rlb-app-auth-acl]], [[rlb-app-shell]], [[rlb-app-store]].
