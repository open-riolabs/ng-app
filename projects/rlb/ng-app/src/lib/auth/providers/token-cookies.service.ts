import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';
import { SsrCookieService } from 'ngx-cookie-service-ssr';

@Injectable({
  providedIn: 'root'
})
export class TokenCookiesService implements AbstractSecurityStorage {

  constructor(private cookies: SsrCookieService) {

  }

  read(key: string): string {
    return this.cookies.get(key);
  }

  remove(key: string): void {
    this.cookies.delete(key);
  }

  write(key: string, data: string): void {
    this.cookies.set(key, data);
  }

  clear(): void {

  }
}
