import { Injectable } from '@angular/core';
import { AbstractLoggerService } from 'angular-auth-oidc-client';

@Injectable({
  providedIn: 'root'
})
export class LoggerService implements AbstractLoggerService {


  logError(message: any, ...args: any[]): void {
    console.error(message, args);
  }

  logWarning(message: any, ...args: any[]): void {
    console.warn(message, args);
  }

  logDebug(message: any, ...args: any[]): void {
    console.info(message, args);
  }
}
