import { Injectable } from '@angular/core';
import { AbstractLoggerService } from 'angular-auth-oidc-client';

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'log';

export type LoggerContext = {
	error: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	info: (...args: any[]) => void;
	debug: (...args: any[]) => void;
	log: (...args: any[]) => void;
};

const LEVEL_PRIORITIES: Record<LogLevel, number> = {
	off: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
	log: 5,
};

@Injectable({ providedIn: 'root' })
export class RlbLoggerService extends AbstractLoggerService {
	private currentLevel: LogLevel = 'off';
	private timestamps = true;
	
	constructor() {
		super();
	}
	
	setLogLevel(level: LogLevel) {
		if (!(level in LEVEL_PRIORITIES)) {
			throw new Error(`Unknown log level: ${level}`);
		}
		this.currentLevel = level;
	}
	
	getLogLevel(): LogLevel {
		return this.currentLevel;
	}
	
	enableTimestamps(enabled: boolean) {
		this.timestamps = enabled;
	}
	
	/**
	 * returns logger with context / class name
	 */
	for(context: string): LoggerContext {
		return {
			error: (...args: any[]) => this.logError(context, ...args),
			warn: (...args: any[]) => this.logWarning(context, ...args),
			info: (...args: any[]) => this.logInfo(context, ...args),
			debug: (...args: any[]) => this.logDebug(context, ...args),
			log: (...args: any[]) => this.log(context, ...args),
		};
	}
	
	logError(contextOrMessage: any, ...args: any[]): void {
		this.print('error', contextOrMessage, args);
	}
	logWarning(contextOrMessage: any, ...args: any[]): void {
		this.print('warn', contextOrMessage, args);
	}
	logDebug(contextOrMessage: any, ...args: any[]): void {
		this.print('debug', contextOrMessage, args);
	}
	logInfo(contextOrMessage: any, ...args: any[]): void {
		this.print('info', contextOrMessage, args);
	}
	log(contextOrMessage: any, ...args: any[]): void {
		this.print('log', contextOrMessage, args);
	}
	
	private print(level: LogLevel, contextOrMessage: any, args: any[]) {
		if (LEVEL_PRIORITIES[level] > LEVEL_PRIORITIES[this.currentLevel]) {
			return;
		}
		
		const colors: Record<LogLevel, string> = {
			error: 'color:#e57373;',
			warn: 'color:#ffb74d;',
			info: 'color:#64b5f6;',
			debug: 'color:#90a4ae;',
			log: 'color:#757575;',
			off: 'color:inherit;',
		};
		
		let context = 'GLOBAL';
		let messageArgs: any[] = [];
		
		if (args.length > 0) {
			context = contextOrMessage;
			messageArgs = args;
		} else {
			messageArgs = [contextOrMessage];
		}
		
		const timePrefix = this.timestamps ? `[${new Date().toISOString()}]` : '';
		const prefix = `[${level.toUpperCase()}][${context}]${timePrefix} -`;
		
		switch (level) {
			case 'error':
				console.error(`%c${prefix}`, colors.error, ...messageArgs);
				break;
			case 'warn':
				console.warn(`%c${prefix}`, colors.warn, ...messageArgs);
				break;
			case 'info':
				console.info(`%c${prefix}`, colors.info, ...messageArgs);
				break;
			case 'debug':
				console.debug(`%c${prefix}`, colors.debug, ...messageArgs);
				break;
			default:
				console.log(`%c${prefix}`, colors.log, ...messageArgs);
		}
	}
}
