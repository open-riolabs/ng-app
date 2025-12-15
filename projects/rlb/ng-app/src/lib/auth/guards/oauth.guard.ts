import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthenticationService } from "../services/auth.service";
import { RlbLoggerService } from "../services/rlb-logger.service";

export const oauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const logger = inject(RlbLoggerService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        logger.log('oauthGuard, not authenticated, call authService.login()');
				authService.login()
        return false;
      }
      return true;
    }),
  );
};
