import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class TokenStoreService implements AbstractSecurityStorage {

  read(key: string) {
    return localStorage.getItem(key);
  }

  write(key: string, value: any): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
