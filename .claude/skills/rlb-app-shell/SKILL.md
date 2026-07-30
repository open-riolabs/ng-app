---
name: rlb-app-shell
description: The @open-rlb/ng-app application shell — <rlb-app-container>, navbar/sidebar configuration via NgRx actions, language selection, and custom navbar item components (RLB_APP_NAVCOMP). Use when building or customizing the app layout/chrome.
---

# @open-rlb/ng-app — Application Shell

The shell renders the full app chrome (navbar, sidebar, modal/toast containers, routed content). The host `AppComponent` is thin: it mounts `<rlb-app-container>` and dispatches store actions to configure visibility and items.

## Mounting the shell

```typescript
@Component({
  selector: 'app-root',
  imports: [RlbAppModule],
  template: `
    <rlb-app-container
      modal-container-id="modal-c-1"
      toast-container-ids="toast-c-1"
    />
  `,
})
export class AppComponent {
  /* dispatch config in constructor */
}
```

`RlbAppModule` aggregates the library's standalone components/directives/pipes; import it wherever you use shell elements (`rlb-app-container`, `rlb-navbar-item`, the `*roles` directive, etc.).

## Configuring navbar & sidebar (NgRx actions)

Dispatch in `AppComponent`'s constructor:

```typescript
this.store.dispatch(NavbarActions.setLoginVisible({ visible: true }));
this.store.dispatch(NavbarActions.setSettingsVisible({ visible: true }));
this.store.dispatch(NavbarActions.setAppsVisible({ visible: true }));

this.store.dispatch(SidebarActions.setAppsVisible({ visible: true }));
this.store.dispatch(
  SidebarActions.setItems({
    items: [
      { title: 'Menu' }, // section header
      { label: 'Home', url: '/', icon: 'bi bi-house' },
      { label: 'Profile', url: '/profile', icon: 'bi bi-person', badgeCounter: 3 },
      {
        label: 'Links',
        icon: 'bi bi-link',
        items: [
          // nested
          { label: 'GitHub', icon: 'bi bi-github', externalUrl: 'https://github.com' },
        ],
      },
    ],
  }),
);

this.store.dispatch(AppContextActions.setSupportedLanguages({ supportedLanguages: ['en', 'it'] }));
```

Sidebar item shape: `{ title }` (header) or `{ label, url? | externalUrl?, icon?, badgeCounter?, items? }`.

## Custom navbar item components

Override navbar slots by providing `RLB_APP_NAVCOMP` (via `appDescriber.providers`):

```typescript
{
  provide: RLB_APP_NAVCOMP,
  useValue: {
    left:   [{ component: MyNavItemComponent, name: 'my-item' }],
    right:  [{ component: MyNavItemComponent, name: 'my-item' }],
    mobile: [{ component: MyMobileMenuComponent, name: 'my-mobile-menu' }], // optional
  },
}
```

Registering a component is not enough — activate it from the store:

```typescript
this.store.dispatch(NavbarActions.setLeftItems({ items: ['my-item'] }));
this.store.dispatch(NavbarActions.setRightItems({ items: ['my-item'] }));
this.store.dispatch(NavbarActions.setMobileItems({ items: ['my-mobile-menu'] }));
```

Icons are Bootstrap Icons (`bi bi-*`), available because the shell registers `bootstrap-icons.css`.

### The mobile surface

Below the `lg` breakpoint the navbar collapse is not reachable, so `left`/`right` components are
**not rendered**. That breakpoint has its own surface: an offcanvas "Menu" panel, filled from
`mobileItems` (resolved against the `mobile` slot, falling back to `right` when `mobile` is
omitted).

Alongside the app's own components the panel renders core content — the apps grid
(`setAppsVisible`) and the settings/account carousel (`setSettingsVisible`). Both honour the same
flags as the desktop navbar, so `setSettingsVisible({ visible: false })` removes the core account,
status and cookies tiles on mobile too. When nothing at all would render, the toggler is hidden
rather than opening an empty panel — an app that suppresses the core content should register
`mobileItems`, otherwise mobile users get no menu button.

To serve both surfaces from one component, register the same name in `right` and `mobile` and
branch on the surface the shell provides:

```typescript
private readonly surface = inject(RLB_NAV_SURFACE, { optional: true }); // 'navbar' | 'mobile-menu' | null
```

Keep it `{ optional: true }` — the token is absent anywhere the component is used outside the
shell outlets.

Related: [[rlb-app-config]], [[rlb-app-apps]], [[rlb-app-store]], [[rlb-app-auth-acl]].
