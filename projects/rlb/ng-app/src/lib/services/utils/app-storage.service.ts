import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class AppStorageService  {

  readLocal(key: string) {
    return localStorage.getItem(key);
  }

  writeLocal(key: string, value: any): void {
    localStorage.setItem(key, value);
  }

  removeLocal(key: string): void {
    localStorage.removeItem(key);
  }

  clearLocal(): void {
    localStorage.clear();
  }

  readSession(key: string) {
    return sessionStorage.getItem(key);
  }

  writeSession(key: string, value: any): void {
    localStorage.setItem(key, value);
  }

  removeSession(key: string): void {
    sessionStorage.removeItem(key);
  }

  clearSession(): void {
    sessionStorage.clear();
  }
}
