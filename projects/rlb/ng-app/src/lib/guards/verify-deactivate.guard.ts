import { ActivatedRouteSnapshot, CanDeactivateFn, RouterStateSnapshot } from '@angular/router';
import { Injectable, inject, importProvidersFrom } from '@angular/core';
import { Observable } from 'rxjs';

export interface VerifyDeactivate {
  verifyDeactivate: () => boolean | Observable<boolean>;
}

export const verifyDeactivate: CanDeactivateFn<VerifyDeactivate> = (
  component: VerifyDeactivate,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState: RouterStateSnapshot
) => {
  return component.verifyDeactivate();
};
