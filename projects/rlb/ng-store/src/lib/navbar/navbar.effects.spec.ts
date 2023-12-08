import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { NavbarEffects } from './navbar.effects';

describe('NavbarEffects', () => {
  let actions$: Observable<any>;
  let effects: NavbarEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavbarEffects,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(NavbarEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
