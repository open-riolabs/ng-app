import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { AuthEffects } from './auth.effects';
import { HttpClient } from '@angular/common/http';

// describe('AuthEffects', () => {
//   let actions$: Observable<any>;
//   let effects: AuthEffects;

//   beforeEach(() => {
//     TestBed.configureTestingModule({
//       providers: [
//         AuthEffects,
//         HttpClient,
//         provideMockActions(() => actions$)
//       ]
//     });

//     effects = TestBed.inject(AuthEffects);
//   });

//   it('should be created', () => {
//     expect(effects).toBeTruthy();
//   });
// });
