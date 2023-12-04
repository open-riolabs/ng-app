import { LogLevel } from 'angular-auth-oidc-client'
import { PassedInitialConfig } from 'angular-auth-oidc-client/lib/auth-config'
import { environment } from '~/environments/environment'

export const authCodeFlowConfig: PassedInitialConfig = {
  // Url of the Identity Provider
  config: {
    configId: environment.auth?.configId,
    authority: environment.auth?.issuer,
    redirectUrl: environment.auth?.redirectUrlLogin,
    postLogoutRedirectUri: environment.auth?.redirectUrlLogout,
    clientId: environment.auth?.clientId,
    scope: environment.auth?.scope,
    secureRoutes: environment.auth?.allowedUrls,
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    autoUserInfo: true,
    renewUserInfoAfterTokenRenew: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
    logLevel: LogLevel.None,
  }
}
