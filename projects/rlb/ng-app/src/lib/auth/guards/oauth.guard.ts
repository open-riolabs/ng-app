import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthenticationService } from "../services/auth.service";
import { RlbLoggerService } from "../services/rlb-logger.service";

export const oauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        console.warn("Attention! Guard navigates to login!!!")
				authService.login()
        return false;
      }
      return true;
    }),
  );
};
