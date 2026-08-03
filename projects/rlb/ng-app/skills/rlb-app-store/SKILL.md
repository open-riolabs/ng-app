---
name: rlb-app-store
description: The @open-rlb/ng-app NgRx store — the auth, appContext, navbars, and sidebars feature slices, their action groups, and reading state with signals. Use when dispatching actions or selecting app/auth/navbar/sidebar state.
---

# @open-rlb/ng-app — Store (NgRx)

The library owns the store. `provideRlbConfig()` registers four feature slices; the host app dispatches actions and selects state. Prefer **signals** (`store.selectSignal`, `toSignal`) over the `async` pipe — the app is zoneless.

## Feature slices

| Feature key | Purpose | Actions |
|---|---|---|
| `auth` | login/logout, user info, token | `AuthActions` |
| `app` (`appContextFeatureKey`) | current app, apps list, theme, language | `AppContextActions` |
| `navbars` | navbar items, layout mode, visibility | `NavbarActions` |
| `sidebars` | sidebar items (nested), visibility | `SidebarActions` |

`BaseState` is the combined root state (`AclState & AuthState & SidebarState & NavbarState & AppState`). Type your store as `Store<BaseState>`.

## Reading state

```typescript
private store = inject(Store<BaseState>);

// signal (preferred)
currentApp = this.store.selectSignal(s => s[appContextFeatureKey].currentApp);

// or observable
this.store.select(s => s[appContextFeatureKey].apps).subscribe(/* … */);
```

## Common actions

```typescript
AppContextActions.setSupportedLanguages({ supportedLanguages: ['en', 'it'] });
AppContextActions.finalizeApp({ appType, appId, data });   // register an app instance (see ACL)

NavbarActions.setLoginVisible({ visible });
NavbarActions.setSettingsVisible({ visible });
NavbarActions.setAppsVisible({ visible });

SidebarActions.setItems({ items });
SidebarActions.setAppsVisible({ visible });
```

`*Internal` action groups (e.g. `AppContextActionsInternal`) are driven by the library's effects — don't dispatch them from app code.

Related: [[rlb-app-shell]], [[rlb-app-apps]], [[rlb-app-auth-acl]], [[rlb-app-config]].
