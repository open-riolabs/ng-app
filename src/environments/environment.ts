import { ProjectConfiguration } from "@sicilyaction/lib-ng-app";

export const environment: ProjectConfiguration = {
  eventsEndpoint: 'wss://notify.addubby.com',
  production: false,
  environment: {
    baseUrl: 'http://localhost:4202',
    ssr: false,
    phone: false,
    appLogo: 'assets/logo.svg',
    appTitle: 'Riolabs',
    navbarDisabled: false,
    errorDialogName: 'error-modal-component',
    errorToastName: 'error-toast',
    errorToastContainer: 'error-toast-container',
    pwaUpdateEnabled: true,
  },
  i18n: {
    availableLangs: ['it'],
    defaultLanguage: 'en',
    useLanguageBrowser: true,
    storeSelectedLanguage: true,
    cookieStoreName: 'language'
  },
  cms: {
    endpoint: 'https://cms.addubby.com',
    chacheDuration: 3600,
    useAppLanguage: true,
    contentLanguages: ['en', 'it'],
    markdown: 'ignore'
  },
  auth: {
    protocol: 'oauth',
    storage: 'localStorage',
    interceptor: 'oauth-code-ep',
    configId: 'transfeero',
    issuer: 'https://login.transfeero.com/realms/transfeero-dev',
    redirectUrlLogin: 'http://localhost:4202',
    redirectUrlLogout: 'http://localhost:4202',
    clientId: 'admin',
    scope: 'openid profile offline_access',
    showDebugInformation: false,
    allowedUrls: [
      'http://localhost:5002',
      'http://localhost:5001',
    ],
    debug: false
  },
  pages: {
    content: { path: 'content', },
    cookies: { path: 'cookies', },
    notFound: { path: 'not-found', },
    privacy: { path: 'privacy', },
    support: { path: 'support', },
    terms: { path: 'terms', },
    logger : { path: 'logger', },
    status: { path: 'status', },
  },
  endpoints: {}
}

