import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { OauthPasswordService } from '../services/oauth-password.service';

export const oauthPasswordGuard: CanActivateFn = (route, state) => {
  const auth = inject(OauthPasswordService);
  const router = inject(Router);

  return of(auth.loggedIn()).pipe(
    map(o => {
      if (!o) {
        router.navigate(['login']);
        return false;
      }
      return true;
    })
  );
};
