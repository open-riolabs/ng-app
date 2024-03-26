import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';
import { AppStorageService } from '../../services/utils/app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TokenStoreService implements AbstractSecurityStorage {

  constructor(private readonly store: AppStorageService) { }

  read(key: string) {
    return this.store.readLocal(key);
  }

  write(key: string, value: any): void {
    this.store.writeLocal(key, value);
  }

  remove(key: string): void {
    this.store.removeLocal(key);
  }

  clear(): void {
    this.store.clearLocal();
  }
}
