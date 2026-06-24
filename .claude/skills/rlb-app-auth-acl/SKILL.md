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
