import { AuthenticationService } from "./services/auth.service";

export function authInitializer(authService: AuthenticationService) {
  return () => authService.checkAuthMultiple();
}
