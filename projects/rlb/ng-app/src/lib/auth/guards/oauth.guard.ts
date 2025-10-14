import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take, withLatestFrom } from 'rxjs';
import { AuthenticationService } from "../services/auth.service";
import { Store } from "@ngrx/store";
import { authsFeatureKey, BaseState } from "../../store";

export const oauthGuard: CanActivateFn = (route, state) => {
	const authService = inject(AuthenticationService);
	const store = inject(Store<BaseState>);
	const router = inject(Router);
	
	return authService.isAuthenticated$.pipe(
		take(1),
		withLatestFrom(store.select(s => s[authsFeatureKey].isAuth)),
		map(([isAuthenticated, authEnabled]) => {
			if (!isAuthenticated && authEnabled) {
				authService.authorize();
				// TODO: Consider possible alternative:
				// return router.createUrlTree(['/login']);
				return false;
			}
			return true;
		}),
	);
};