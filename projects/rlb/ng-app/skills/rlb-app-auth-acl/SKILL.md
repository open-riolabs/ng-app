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

```typescript
auth: {
  interceptor: 'oauth-code-ep-retry',
  renewal: {
    // Calls anonymous visitors legitimately make on an authenticated host. Without this they
    // fail locally with a 401 instead of going out. Matched as substrings of the URL.
    publicPaths: ['/register', '/check-vies'],
    // Everything below is optional; these are the defaults.
    renewLeadSeconds: 90,        // must stay ahead of the library's own 30s check
    retryDelaysSeconds: [5, 20, 60],
    transientRetrySeconds: 120,
    maxOutageSeconds: 1800,      // then stand down; the next 401 still recovers
    autoStart: true,             // false → call TokenRenewalService.start() yourself
  },
}
```

Notes:

- It **replaces** the `'oauth-code-ep'` interceptor rather than stacking on it.
- Requests pass through untouched on any domain where no auth provider resolves, so a shell serving
  several tenants is unaffected on the ones this build has no provider for.
- Set `publicPaths` before switching, or your front-door calls will start failing.

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
import { oauthGuard, permissionGuard } from '@open-rlb/ng-app';

{ path: 'account', component: AccountComponent, canActivate: [oauthGuard] },
{ path: 'admin', component: AdminComponent, canActivate: [permissionGuard], data: { action: 'sysadmin' } },
```

- `oauthGuard` — requires an authenticated session.
- `permissionGuard` — requires the ACL action named in `route.data.action`.

## Guarding UI

The `*roles` structural directive shows content only if the user holds the action:

```html
<button *roles="'sysadmin'">Admin only</button>
```

(`RlbAppModule` provides the directive.)

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
