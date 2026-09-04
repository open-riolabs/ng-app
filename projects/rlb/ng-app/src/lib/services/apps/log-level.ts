/**
 * Severity levels accepted by {@link AppLoggerService} and by `EnvironmentConfiguration.logLevel`.
 *
 * It lives in its own file rather than beside the service because the service depends on
 * `configuration.ts` for `RLB_CFG_ENV`, while `configuration.ts` needs this type: declaring it
 * next to the service closed an import cycle. Re-exported from `app-logger.service.ts`, so the
 * public API is unchanged.
 */
export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'log';
