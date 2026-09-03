---
name: rlb-app-auth-acl
description: Authentication (OIDC) and authorization (ACL) in @open-rlb/ng-app — OAuth provider config, the oauthGuard and permissionGuard route guards, the *roles structural directive, and the RLB_INIT_PROVIDER ACL startup hook. Use when securing routes/UI or configuring login.
---

# @open-rlb/ng-app — Auth & ACL

Authentication is OIDC via `angular-auth-oidc-client`; authorization is action-based ACL resolved from the backend on startup.

## Configuring auth

In `environment.ts` under `auth`:

```typescript
auth: {
  protocol: 'oauth',
  storage: 'localStorage',            // 'cookies' | 'localStorage' | 'sessionStorage'
  interceptor: 'oauth-code-ep',       // attach tokens to endpoint calls
  allowedUrls: ['https://api.example.com'],
  enableCompanyInterceptor: true,
  providers: [{
    configId: 'default',
    authority: 'https://login.example.com/realms/your-realm',
    clientId: 'your-client-id',
    redirectUrl: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scope: 'openid profile offline_access',
    acl: { endpointKey: 'http-gateway', path: 'admin/acl/resources' },  // where to fetch ACL
  }],
}
```

The startup pipeline is `checkAuthMultiple → resourcesByUser → finalizeApp → AppsService orchestration` (wired by `provideRlbConfig`). The final step — filtering apps by domain/ACL and selecting the current app from the route — is handled by `AppsService`; see [[rlb-app-apps]].

### Which interceptor to pick

| `interceptor` | Behaviour |
| --- | --- |
| `'oauth-code-all'` | The OIDC library's own, matching `allowedUrls`. |
| `'oauth-code-ep'` | Attaches the token to `endpoints` marked `auth`. **No token → the request goes out anonymously.** |
| `'oauth-code-ep-retry'` | As above, plus never sending an authenticated request without a token, one 401 retry, and a renewal watchdog. |
| `'none'` | No interceptor. |

### Surviving a login-host outage — `'oauth-code-ep-retry'`

The OIDC library's own renewal is one-strike: a single failed refresh tears down its periodic check
and nothing restarts it, so the token quietly expires and every later request 401s until the page is
reloaded. Worse, a refresh failure that is not a *network* error (a gateway 504 counts) makes the
library erase the refresh token from storage even though the session is still alive on the provider.

`'oauth-code-ep-retry'` covers both. It brings up `TokenRenewalService`, which keeps its own clock,
snapshots storage before each attempt and restores a wiped refresh token, and retries on a ladder
then a slow heartbeat until an outage budget runs out. Its interceptor never sends an authenticated
request without a token — failing locally with a 401 instead of letting the backend see a call it
cannot attribute to anyone — and retries a 401 once with a fresh token.

It also switches the library's own `silentRenew` off, so the watchdog is the **only** renewer. That
matters more than it sounds: only the watchdog's own attempts restore a wiped refresh token, so a
second renewer running beside it will eventually fail an attempt nothing puts right and end the
session mid-outage. Put the library's check back on one provider with `silentRenew: true` if you have
a reason to; nothing else about the OIDC configuration is overridable.

```typescript
auth: {
  interceptor: 'oauth-code-ep-retry',
  renewal: {
    // Calls anonymous visitors legitimately make on an authenticated host. Without this they
    // fail locally with a 401 instead of going out. Matched as substrings of the URL.
    publicPaths: ['/register', '/check-vies'],
    // Everything below is optional; these are the defaults.
    renewLeadSeconds: 90,        // room for the retry ladder before the token actually expires
    retryDelaysSeconds: [5, 20, 60],
    transientRetrySeconds: 120,
    maxOutageSeconds: 1800,      // then stand down; the next 401 still recovers
    autoStart: true,             // false → call TokenRenewalService.start() yourself
    restoreOnBoot: true,         // renew at startup from a refresh token that outlived the tab
  },
}
```

Notes:

- It **replaces** the `'oauth-code-ep'` interceptor rather than stacking on it.
- `oauthGuard` stops bouncing while the watchdog is mid-outage. A failed refresh makes the OIDC
  library publish `isAuthenticated$: false` even though the session is alive on the provider, so
  without this a user who *clicks anything* during an outage is sent to the login host that is down —
  the "infinite login loop" symptom. Routes render instead, requests keep their normal error
  handling, and everything resumes when the host answers. Once `maxOutageSeconds` is spent the
  watchdog stands down and a genuinely dead session reaches the login page as before.
- Requests pass through untouched on any domain where no auth provider resolves, so a shell serving
  several tenants is unaffected on the ones this build has no provider for.
- Set `publicPaths` before switching, or your front-door calls will start failing.

### Staying signed in after the browser is closed

Three things have to be true, and the first two are yours to set:

1. `scope` includes **`offline_access`**, so the provider issues a refresh token that outlives its
   own SSO session (Keycloak calls it an offline token).
2. `storage: 'localStorage'` — `sessionStorage` dies with the tab, and the cookie storage writes
   session cookies, which die with the browser.
3. `restoreOnBoot` (default **on** under `'oauth-code-ep-retry'`), which is what actually spends it.

The third is easy to miss, because without it the other two look like they are working. The OIDC
library decides at startup by *reading storage*: an expired access token means unauthenticated, and
the refresh token beside it is never tried. The user is sent to the login host, which recognises its
own SSO cookie and sends them back signed in — so closing a tab and reopening it seems to keep the
session. Once that cookie expires, the same user gets a login form with a perfectly good refresh
token still in storage. `restoreOnBoot` renews once before the startup concludes anybody is a guest,
which is the difference between a session that lasts as long as the SSO cookie and one that lasts as
long as the refresh token.

The renewal goes through the watchdog, so a failure cannot cost you the refresh token: reloading
during a login-host outage boots signed out, as it would anyway, and recovers on the next reload.
Test it by deleting the provider's SSO cookies rather than by closing the tab — closing a tab only
exercises the SSO cookie path, which works with or without any of this.

> A **reload** during an outage still reaches the login host: the startup renewal is the only thing
> that can re-establish the session, and it is the thing that is failing. In-app navigation is
> protected (`oauthGuard` above); a reload is a boundary, not a bug.

### Failing loud on a misconfigured domain

`AuthenticationService` resolves the provider from the store, then by hostname. When nothing
resolves it **stops rather than guessing**: `login()` does not authorize, token getters emit
`undefined`, and `isAuthenticated$` emits `false` — throwing in dev and logging at error level in
production. Previously an unresolved provider was passed to the OIDC library as `undefined`, which
silently selects the *first registered configuration* — a different realm. See [[rlb-app-apps]].

### Reading the Keycloak account API

`KeycloakAccountService` is the composable one: reads degrade to a documented fallback (`null` /
`[]`) on failure, timeout or missing token, and writes propagate their errors. Use it anywhere the
caller needs to know what happened — especially inside a `forkJoin`.

`KeycloakProfileService` covers the same endpoints but gates every call behind
`filter(isAuthenticated)` and ends in `manageUI('error', 'dialog')`, so failures complete the stream
*empty*: a caller cannot tell failure from an empty result, and one failing call silently aborts
every sibling in a `forkJoin`. Keep it for simple template bindings and for `configureOTP` /
`updatePassword`, which are redirects rather than HTTP.

## Guarding routes

```typescript
import { oauthGuard, pagePermissionGuard, permissionGuard } from '@open-rlb/ng-app';

{ path: 'account', component: AccountComponent, canActivate: [oauthGuard] },
{ path: 'admin', component: AdminComponent, canActivate: [permissionGuard], data: { action: 'sysadmin' } },
{ path: 'admin', component: AdminComponent, canActivate: [permissionGuard],
  data: { action: ['manager', 'director'] } },        // any one of them grants
```

- `oauthGuard` — requires an authenticated session.
- `permissionGuard` — requires the ACL action named in `route.data.action`, **in the app that owns
  the route**. A list grants on any one of its actions.
- `pagePermissionGuard(action)` — requires the action on *any* resource the user holds. For chrome
  that no app owns; see [page entries](#gating-a-pages-entry) below.

Both guards wait for the ACL resources to arrive before deciding, so a cold-start deep link is not
denied for being early.

A denial goes to `/forbidden`, which the kit **always registers** — it no longer depends on
`pages.forbidden` being configured. Where it was not, the redirect used to fall through to the
consumer's `**` route, so a permission denial presented as a redirect to some unrelated page with
nothing logged. Configuring `pages.forbidden` still only decides whether the entry exists in your
config; add the `pages.forbidden.{title,content,button}` i18n keys (the `ng add` scaffold ships
them) so the page reads properly.

## Guarding UI

The `*roles` structural directive shows content only if the user holds the action **in the current
app**:

```html
<button *roles="'sysadmin'">Admin only</button>

<!-- OR-list: "management and superior" — any one of the actions grants -->
<button *roles="[ACL_ACTIONS.manager, ACL_ACTIONS.director]">Approve</button>

<!-- inverse: render only for a user who LACKS the action -->
<span *roles="ACL_ACTIONS.editCatalog; not: true">Read-only — ask an editor to change this.</span>

<!-- else: a fallback template, mirroring *ngIf -->
<button *roles="ACL_ACTIONS.convert; else noConvert">Convert</button>
<ng-template #noConvert><span class="text-muted">Not available on your plan</span></ng-template>
```

| Input | Microsyntax | Meaning |
| --- | --- | --- |
| `roles` | `*roles="x"` | the action, or a list the user only has to hold **one** of |
| `rolesNot` | `; not: true` | invert — render when the user *lacks* it |
| `rolesElse` | `; else tpl` | `TemplateRef` rendered instead when the check fails |

No action — `undefined`, `''` or `[]` — is **public**. An empty array in particular is not a denial:
a list computed from data arrives empty on the first render, and reading that as "deny" would blank
the UI. `not: true` inverts whatever the decision was, so `*roles="[]; not: true"` renders nothing.

`SidebarNavigableItem.action` is fed straight into this directive by the shell (at both nesting
levels), so sidebar items accept a list too.

(`RlbAppModule` provides the directive; it is standalone, so you can also `import` it directly.)

The directive tracks which template is on screen and only touches the view when the decision
actually changes — an unrelated ACL update will not remount the subtree and drop component state
inside it.

Hide/show only: it is a structural directive, so it cannot *disable* a control it never renders.
Disabling instead of hiding is deliberately not supported.

### Gating a `pages.*` entry

The `pages` config entries — `status`, `logger`, `privacy`, `support`, … — render as buttons in the
settings dropdown and the settings list. Give one an `action` and both the button and the route are
gated:

```typescript
pages: {
  status: { path: 'status', action: 'show-system-status' },
  logger: { path: 'logger', action: ['sysadmin', 'director'] },  // any one grants
  privacy: { path: 'privacy' },                                  // no action → everyone, as before
}
```

- **Omitting `action` means visible to everyone.** Every config written before this existed omits
  it, so upgrading hides nothing.
- The check is "does the user hold it on **any** resource", not "in the current app": these pages
  belong to no app, and while one is open `AppsService` has deselected the current app — a
  resource-scoped check would deny whatever the user holds. That is why they use
  `pagePermissionGuard`, not `permissionGuard`.
- The kit puts the guard on the routes it registers itself. `status` and `logger` are **your**
  routes, so gate them yourself with the same action, or the button hides while the URL still works:

  ```typescript
  { path: 'status', component: StatusComponent,
    canActivate: [pagePermissionGuard('show-system-status')] }
  ```

- A guard alone is never enough for chrome: the button would stay visible and bounce.

### What is gated where

| Surface | Gate | Scope |
| --- | --- | --- |
| A whole app (shell nav, app hub, settings tile) | `AppInfo.actions` on the describer | that app's resource |
| A route | `permissionGuard` + `data.action` | the app owning the route |
| A control, a sidebar item | `*roles` | the current app |
| A `pages.*` entry and its route | `pages.<key>.action` + `pagePermissionGuard` | any resource |

## ACL startup hook — RLB_INIT_PROVIDER

Implement `RlbInitProvider` to map the user's `UserResource[]` into app instances:

```typescript
@Injectable()
export class AppInitAclProvider implements RlbInitProvider {
  async finalizeApps(resources: UserResource[], store: Store<BaseState>, acl: AclConfiguration) {
    resources.forEach(company => company.resources.forEach(res => {
      store.dispatch(AppContextActions.finalizeApp({
        appType: 'app',
        appId: `app-${res.resourceId}`,
        data: {
          title: res.friendlyName,
          [acl.businessIdKey]: company.companyId,
          [acl.resourceIdKey]: res.resourceId,
        },
      }));
    }));
  }
}
```

Register it: `{ provide: RLB_INIT_PROVIDER, useClass: AppInitAclProvider }`. The action names in `appDescriber.info.actions` must match the ACL actions your backend returns.

Related: [[rlb-app-apps]], [[rlb-app-config]], [[rlb-app-store]], [[rlb-app-shell]].
