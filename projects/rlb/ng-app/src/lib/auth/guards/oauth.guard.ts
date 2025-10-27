import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthenticationService } from "../services/auth.service";

export const oauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
				authService.login()
        return false;
      }
      return true;
    }),
  );
};
