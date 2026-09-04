import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { AppsService } from '../../services/apps/apps.service';
import { AppInfo } from '../../services/apps/app';
import { AclAction, normalizeAclActions } from '../../store/acl/acl.model';
import { AclStore } from '../../store/acl/acl.store';
import { pagePermissionGuard, permissionGuard } from './permission.guard';

const FORBIDDEN = { forbidden: true } as unknown as UrlTree;

class AppsStub {
  current: AppInfo | null = null;
  appForPath: AppInfo | undefined = undefined;
  granted: string[] = [];
  grantedAnywhere: string[] = [];
  aclConfigured = true;
  pathsAsked: string[] = [];

  currentApp = (): AppInfo | null => this.current;

  findAppForPath = (path: string): AppInfo | undefined => {
    this.pathsAsked.push(path);
    return this.appForPath;
  };

  checkPermissionInCurrentApp = (action?: AclAction): boolean =>
    !!this.current && this.holds(this.granted, action);

  checkPermissionForApp = (app: AppInfo, action?: AclAction): boolean =>
    !!app && this.holds(this.granted, action);

  checkPermissionAnywhere = (action?: AclAction): boolean =>
    this.aclConfigured ? this.holds(this.grantedAnywhere, action) : true;

  private holds(held: string[], action?: AclAction): boolean {
    const asked = normalizeAclActions(action);
    return asked.length === 0 ? held.length > 0 : asked.some(a => held.includes(a));
  }
}

describe('permissionGuard', () => {
  let apps: AppsStub;
  let created: unknown[][];
  const loaded = signal(true);

  beforeEach(() => {
    created = [];
    loaded.set(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AppsStub,
        { provide: AppsService, useExisting: AppsStub },
        { provide: AclStore, useValue: { loaded } },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: unknown[]) => {
              created.push(commands);
              return FORBIDDEN;
            },
          },
        },
      ],
    });
    apps = TestBed.inject(AppsStub);
  });

  const app = (id: string): AppInfo => ({ id, type: 'app' }) as AppInfo;

  const snapshot = (action?: AclAction, path = 'sysadmin/users'): ActivatedRouteSnapshot =>
    ({
      data: { action },
      pathFromRoot: [{ url: path.split('/').map(segment => ({ path: segment })) }],
    }) as unknown as ActivatedRouteSnapshot;

  async function run(result: unknown): Promise<boolean | UrlTree> {
    const pending = firstValueFrom(result as Observable<boolean | UrlTree>);
    TestBed.tick();
    return pending;
  }

  const runGuard = (route: ActivatedRouteSnapshot) =>
    run(
      TestBed.runInInjectionContext(() =>
        permissionGuard(route, {} as RouterStateSnapshot),
      ) as unknown,
    );

  describe('with an app already selected', () => {
    beforeEach(() => (apps.current = app('sysadmin')));

    it('allows a granted action', async () => {
      apps.granted = ['sysadmin'];

      expect(await runGuard(snapshot('sysadmin'))).toBe(true);
    });

    it('allows any one of a list of actions', async () => {
      apps.granted = ['director'];

      expect(await runGuard(snapshot(['manager', 'director']))).toBe(true);
    });

    it('sends a denial to the forbidden page', async () => {
      apps.granted = ['operator'];

      expect(await runGuard(snapshot('sysadmin'))).toBe(FORBIDDEN);
      expect(created).toEqual([['/forbidden']]);
    });
  });

  describe('on a deep link, before an app is selected', () => {
    beforeEach(() => (apps.current = null));

    it('resolves the app from the path and allows a granted action', async () => {
      apps.appForPath = app('sysadmin');
      apps.granted = ['sysadmin'];

      expect(await runGuard(snapshot('sysadmin', 'sysadmin/users'))).toBe(true);
      expect(apps.pathsAsked).toEqual(['sysadmin/users']);
    });

    it('sends a denial to the forbidden page', async () => {
      apps.appForPath = app('sysadmin');
      apps.granted = [];

      expect(await runGuard(snapshot('sysadmin'))).toBe(FORBIDDEN);
      expect(created).toEqual([['/forbidden']]);
    });

    it('denies when no app claims the path', async () => {
      apps.appForPath = undefined;
      apps.granted = ['sysadmin'];

      expect(await runGuard(snapshot('sysadmin'))).toBe(FORBIDDEN);
    });
  });

  it('waits for the ACL to load before deciding', async () => {
    // Denying while `resources` is still null would bounce every deep link on a cold start.
    loaded.set(false);
    apps.current = app('sysadmin');
    apps.granted = ['sysadmin'];

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(snapshot('sysadmin'), {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;

    let settled: boolean | UrlTree | undefined;
    const sub = result.subscribe(value => (settled = value));
    TestBed.tick();
    expect(settled).toBeUndefined();

    loaded.set(true);
    TestBed.tick();
    expect(settled).toBe(true);
    sub.unsubscribe();
  });
});

describe('pagePermissionGuard', () => {
  let apps: AppsStub;
  let created: unknown[][];
  const loaded = signal(true);

  beforeEach(() => {
    created = [];
    loaded.set(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AppsStub,
        { provide: AppsService, useExisting: AppsStub },
        { provide: AclStore, useValue: { loaded } },
        {
          provide: Router,
          useValue: {
            createUrlTree: (commands: unknown[]) => {
              created.push(commands);
              return FORBIDDEN;
            },
          },
        },
      ],
    });
    apps = TestBed.inject(AppsStub);
  });

  async function run(action?: AclAction): Promise<boolean | UrlTree> {
    const guard = pagePermissionGuard(action);
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
    const pending = firstValueFrom(result);
    TestBed.tick();
    return pending;
  }

  it('allows a page action held on any resource, with no app selected', async () => {
    // The whole point: while a pages.* route is open there is no current app, so the resource
    // scoped check would deny whatever the user holds.
    apps.current = null;
    apps.grantedAnywhere = ['show-system-status'];

    expect(await run('show-system-status')).toBe(true);
  });

  it('allows any one of a list', async () => {
    apps.grantedAnywhere = ['director'];

    expect(await run(['manager', 'director'])).toBe(true);
  });

  it('sends a denial to the forbidden page', async () => {
    apps.grantedAnywhere = [];

    expect(await run('show-system-status')).toBe(FORBIDDEN);
    expect(created).toEqual([['/forbidden']]);
  });
});
