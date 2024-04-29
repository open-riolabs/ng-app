import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';
import { AppStorageService } from '../../services/utils/app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TokenSessionService implements AbstractSecurityStorage {

  constructor(private readonly store: AppStorageService) { }

  read(key: string) {
    return this.store.readSession(key);
  }

  write(key: string, value: any): void {
    this.store.writeSession(key, value);
  }

  remove(key: string): void {
    this.store.readSession(key);
  }

  clear(): void {
    this.store.clearSession();
  }
}
