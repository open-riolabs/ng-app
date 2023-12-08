import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { SidebarEffects } from './sidebar.effects';

describe('SidebarEffects', () => {
  let actions$: Observable<any>;
  let effects: SidebarEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SidebarEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(SidebarEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
