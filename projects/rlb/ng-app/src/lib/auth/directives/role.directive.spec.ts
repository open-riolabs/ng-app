import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppsService } from '../../services/apps/apps.service';
import { AclAction, normalizeAclActions } from '../../store/acl/acl.model';
import { RlbRole } from './role.directive';

/** Stands in for the real service; `held` is a signal so specs can flip the ACL mid-test. */
class AppsServiceStub {
  held = signal<string[]>([]);

  checkPermissionInCurrentApp(action?: AclAction): boolean {
    const asked = normalizeAclActions(action);
    const held = this.held();
    return asked.some(a => held.includes(a));
  }
}

@Component({
  selector: 'rlb-role-host',
  imports: [RlbRole],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="then"
      *roles="action(); not: not()"
    >
      granted
    </div>
  `,
})
class HostComponent {
  action = signal<AclAction | undefined>(undefined);
  not = signal(false);
}

@Component({
  selector: 'rlb-role-else-host',
  imports: [RlbRole],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="then"
      *roles="action(); else denied"
    >
      granted
    </div>
    <ng-template #denied><div class="else">denied</div></ng-template>
  `,
})
class ElseHostComponent {
  action = signal<AclAction | undefined>(undefined);
}

describe('RlbRole (*roles)', () => {
  let apps: AppsServiceStub;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AppsServiceStub, { provide: AppsService, useExisting: AppsServiceStub }],
    });
    apps = TestBed.inject(AppsServiceStub);
  });

  function host(): ComponentFixture<HostComponent> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  const count = (fixture: ComponentFixture<unknown>, selector: string): number =>
    fixture.nativeElement.querySelectorAll(selector).length;

  it('renders a public element when no action is given', () => {
    const fixture = host();

    expect(count(fixture, '.then')).toBe(1);
  });

  it('renders a single granted action', () => {
    apps.held.set(['manager']);
    const fixture = host();
    fixture.componentInstance.action.set('manager');
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(1);
  });

  it('hides a single denied action', () => {
    apps.held.set(['manager']);
    const fixture = host();
    fixture.componentInstance.action.set('director');
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(0);
  });

  it('renders a list when the user holds any one of it', () => {
    // "management and superior": the control is for managers *or* directors. This is the case the
    // whole OR-list exists for.
    apps.held.set(['director']);
    const fixture = host();
    fixture.componentInstance.action.set(['manager', 'director']);
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(1);
  });

  it('hides a list the user holds none of', () => {
    apps.held.set(['operator']);
    const fixture = host();
    fixture.componentInstance.action.set(['manager', 'director']);
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(0);
  });

  it('treats an empty list as public, not as a denial', () => {
    // A consumer computing the list dynamically gets an empty array before the data arrives.
    // Reading that as "deny" would blank the UI on first render.
    apps.held.set([]);
    const fixture = host();
    fixture.componentInstance.action.set([]);
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(1);
  });

  it('inverts the decision under `not`', () => {
    apps.held.set(['manager']);
    const fixture = host();
    fixture.componentInstance.not.set(true);

    fixture.componentInstance.action.set('director');
    fixture.detectChanges();
    expect(count(fixture, '.then')).toBe(1);

    fixture.componentInstance.action.set('manager');
    fixture.detectChanges();
    expect(count(fixture, '.then')).toBe(0);
  });

  it('renders the else template on a denial and swaps back on a grant', () => {
    apps.held.set([]);
    const fixture = TestBed.createComponent(ElseHostComponent);
    fixture.componentInstance.action.set('manager');
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(0);
    expect(count(fixture, '.else')).toBe(1);

    apps.held.set(['manager']);
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(1);
    expect(count(fixture, '.else')).toBe(0);
  });

  it('swaps the view on a signal change rather than accumulating copies', () => {
    apps.held.set([]);
    const fixture = TestBed.createComponent(ElseHostComponent);
    fixture.componentInstance.action.set('manager');
    fixture.detectChanges();

    apps.held.set(['manager']);
    fixture.detectChanges();
    apps.held.set([]);
    fixture.detectChanges();
    apps.held.set(['manager']);
    fixture.detectChanges();

    expect(count(fixture, '.then')).toBe(1);
    expect(count(fixture, '.else')).toBe(0);
  });

  it('leaves the rendered view alone when a change does not flip the decision', () => {
    // The effect re-runs on every ACL change. Clearing and recreating unconditionally would
    // remount the subtree and drop any component state inside it.
    apps.held.set(['manager']);
    const fixture = host();
    fixture.componentInstance.action.set('manager');
    fixture.detectChanges();

    const before = fixture.nativeElement.querySelector('.then');
    apps.held.set(['manager', 'director']);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.then')).toBe(before);
  });
});
