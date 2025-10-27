import { Injectable } from '@angular/core';
import { AbstractLoggerService } from 'angular-auth-oidc-client';

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'all';

const LEVEL_PRIORITIES: Record<LogLevel, number> = {
	off: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
	all: 5,
};

@Injectable({ providedIn: 'root' })
export class RlbLoggerService implements AbstractLoggerService {
	private currentLevel: LogLevel = 'warn';
	private timestamps = true;
	
	setLogLevel(level: LogLevel) {
		if (!Object.prototype.hasOwnProperty.call(LEVEL_PRIORITIES, level)) {
			throw new Error(`Unknown log level: ${String(level)}`);
		}
		this.currentLevel = level;
	}
	
	getLogLevel(): LogLevel {
		return this.currentLevel;
	}
	
	enableTimestamps(enabled: boolean) {
		this.timestamps = enabled;
	}
	
	logError(message: any, ...args: any[]): void {
		if (this.shouldLog('error')) {
			console.error(this.prefix('error'), message, ...args);
		}
	}
	
	logWarning(message: any, ...args: any[]): void {
		if (this.shouldLog('warn')) {
			console.warn(this.prefix('warn'), message, ...args);
		}
	}
	
	logDebug(message: any, ...args: any[]): void {
		if (this.shouldLog('debug')) {
			console.debug(this.prefix('debug'), message, ...args);
		}
	}
	
	logInfo(message: any, ...args: any[]): void {
		if (this.shouldLog('info')) {
			console.info(this.prefix('info'), message, ...args);
		}
	}
	
	log(message: any, ...args: any[]): void {
		if (this.shouldLog('info')) {
			console.log(this.prefix('log'), message, ...args);
		}
	}
	
	private prefix(level: string) {
		return this.timestamps ? `[${level.toUpperCase()}] ${new Date().toISOString()} -` : `[${level.toUpperCase()}]`;
	}
	
	private shouldLog(messageLevel: LogLevel): boolean {
		return (LEVEL_PRIORITIES[messageLevel] ?? 0) <= (LEVEL_PRIORITIES[this.currentLevel] ?? 0);
	}
}
