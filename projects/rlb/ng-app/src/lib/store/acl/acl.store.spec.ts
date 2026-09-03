import { TestBed } from '@angular/core/testing';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { Store } from '@ngrx/store';
import { AdminApiService } from '../../services/acl/user-resources.service';
import { Acl, UserResource } from './acl.model';
import { AclStore } from './acl.store';

const RESOURCES: UserResource[] = [
  {
    companyId: 'acme',
    resources: [
      { resourceId: 'chat-1', actions: ['manager'] },
      { resourceId: 'chat-2', actions: ['director', 'sysadmin'] },
    ],
  },
  {
    companyId: 'globex',
    resources: [{ resourceId: 'chat-3', actions: ['operator'] }],
  },
];

describe('AclStore permission checks', () => {
  let store: InstanceType<typeof AclStore>;

  function build(resources: UserResource[] | null): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminApiService, useValue: {} },
        { provide: Store, useValue: { dispatch: () => undefined } },
      ],
    });
    store = TestBed.inject(AclStore);
    // The state is exposed read-only to consumers; specs seed it directly rather than driving
    // loadACL, which would only be testing the HTTP stub.
    patchState(store as unknown as WritableStateSource<Acl>, {
      resources,
      loaded: resources !== null,
    });
  }

  describe('hasPermission', () => {
    beforeEach(() => build(RESOURCES));

    it('grants a single action held on the resource', () => {
      expect(store.hasPermission('acme', 'chat-1', 'manager')).toBe(true);
    });

    it('denies a single action held on a different resource', () => {
      expect(store.hasPermission('acme', 'chat-1', 'director')).toBe(false);
    });

    it('denies when the business does not match', () => {
      expect(store.hasPermission('globex', 'chat-1', 'manager')).toBe(false);
    });

    it('grants a list the user holds any one of', () => {
      expect(store.hasPermission('acme', 'chat-2', ['manager', 'director'])).toBe(true);
    });

    it('denies a list the user holds none of', () => {
      expect(store.hasPermission('acme', 'chat-1', ['director', 'sysadmin'])).toBe(false);
    });

    it('keeps the no-action meaning: any grant on that resource', () => {
      // Load-bearing and asymmetric — AppsService.checkPermissionInCurrentApp denies with no
      // current app, while the store's no-action case is a resource existence check.
      expect(store.hasPermission('acme', 'chat-1')).toBe(true);
      expect(store.hasPermission('acme', 'nothing-here')).toBe(false);
    });

    it('reads an empty list the same way as no action at all', () => {
      expect(store.hasPermission('acme', 'chat-1', [])).toBe(true);
      expect(store.hasPermission('acme', 'nothing-here', [])).toBe(false);
    });

    it('denies everything before the resources have arrived', () => {
      build(null);

      expect(store.hasPermission('acme', 'chat-1', 'manager')).toBe(false);
      expect(store.hasPermission('acme', 'chat-1')).toBe(false);
    });
  });

  describe('hasPermissionAnywhere', () => {
    beforeEach(() => build(RESOURCES));

    it('grants an action held on any resource, whichever app is current', () => {
      expect(store.hasPermissionAnywhere('operator')).toBe(true);
      expect(store.hasPermissionAnywhere('sysadmin')).toBe(true);
    });

    it('denies an action nobody granted', () => {
      expect(store.hasPermissionAnywhere('show-system-status')).toBe(false);
    });

    it('grants a list held anywhere', () => {
      expect(store.hasPermissionAnywhere(['show-system-status', 'operator'])).toBe(true);
    });

    it('reads no action as "holds any resource at all"', () => {
      expect(store.hasPermissionAnywhere()).toBe(true);
      expect(store.hasPermissionAnywhere([])).toBe(true);

      build([]);
      expect(store.hasPermissionAnywhere()).toBe(false);
    });

    it('denies before the resources have arrived', () => {
      build(null);

      expect(store.hasPermissionAnywhere('operator')).toBe(false);
    });
  });
});
