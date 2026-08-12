import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs';
import { RLB_CFG_AUTH } from "../../configuration";
import { TokenRenewalService } from "../renewal/token-renewal.service";
import { AuthenticationService } from "../services/auth.service";

/**
 * Requires an authenticated session, and sends the visitor to the provider when there is none.
 *
 * **Except while the session is merely mid-outage.** A failed token refresh makes the OIDC library
 * publish `isAuthenticated$: false` even when the session is perfectly alive on the provider and
 * only the login host was briefly unreachable. Bouncing then is worse than useless: it takes the
 * user out of the app and hands them to the very host that is failing. So when the renewal watchdog
 * is still working on the session, navigation is allowed through — requests keep their normal error
 * handling meanwhile, and everything resumes silently once the host answers again. See
 * {@link TokenRenewalService.isRecoverable}.
 *
 * That only applies under `auth.interceptor: 'oauth-code-ep-retry'`, the mode that runs the
 * watchdog. Reading the configuration first also keeps this guard usable in an app with no auth
 * configured at all, where the watchdog's own dependencies would not resolve.
 */
export const oauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const renewal =
    inject(RLB_CFG_AUTH, { optional: true })?.interceptor === 'oauth-code-ep-retry'
      ? inject(TokenRenewalService)
      : null;

  return authService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) return true;
      if (renewal?.isRecoverable()) return true;

      authService.login(state.url)
      return false;
    }),
  );
};
