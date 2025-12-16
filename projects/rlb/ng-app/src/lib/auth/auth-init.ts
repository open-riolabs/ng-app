import { APP_INITIALIZER } from '@angular/core';
import { AuthenticationService } from "./services/auth.service";

export function authInitializer(authService: AuthenticationService) {
  console.warn("authInitializer!!")
  return () => authService.checkAuthMultiple();
}
