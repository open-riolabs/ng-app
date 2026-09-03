import { Route } from '@angular/router';
import { PagesConfiguration } from '../configuration';
import { getDefaultRoutes } from './shared.routes';

const find = (routes: Route[], path: string): Route | undefined =>
  routes.find(route => route.path === path);

describe('getDefaultRoutes', () => {
  it('registers the forbidden route even with no pages configured', () => {
    // Item 4's regression: it used to be registered only when `pages.forbidden` was configured,
    // and the key is optional. Without it, permissionGuard's redirect fell through to the
    // consumer's `**` route — a permission denial presenting as a redirect to an unrelated app.
    expect(find(getDefaultRoutes(), 'forbidden')).toBeDefined();
    expect(find(getDefaultRoutes({}), 'forbidden')).toBeDefined();
  });

  it('still registers the optional pages only when they are configured', () => {
    expect(find(getDefaultRoutes(), 'privacy')).toBeUndefined();
    expect(find(getDefaultRoutes({ privacy: { path: 'privacy' } }), 'privacy')).toBeDefined();
  });

  it('leaves a page without an action ungated', () => {
    const routes = getDefaultRoutes({ privacy: { path: 'privacy' } });

    expect(find(routes, 'privacy')?.canActivate).toBeUndefined();
  });

  it('guards a page that declares an action', () => {
    const config: PagesConfiguration = {
      privacy: { path: 'privacy', action: 'read-privacy' },
    };

    expect(find(getDefaultRoutes(config), 'privacy')?.canActivate?.length).toBe(1);
  });

  it('appends the ACL guard to the guards a page already has', () => {
    // `settings` carries oauthGuard; gating it must not drop the session requirement.
    const ungated = find(getDefaultRoutes(), 'settings')?.canActivate ?? [];

    expect(ungated.length).toBe(1);
  });

  it('never guards the pages a denial lands on', () => {
    // Guarding these is a redirect loop.
    const config: PagesConfiguration = {
      forbidden: { path: 'forbidden', action: 'nobody-holds-this' },
      notFound: { path: 'not-found', action: 'nobody-holds-this' },
    };
    const routes = getDefaultRoutes(config);

    expect(find(routes, 'forbidden')?.canActivate).toBeUndefined();
    expect(find(routes, 'notFound')?.canActivate).toBeUndefined();
  });
});
