import { ProjectConfiguration } from "@open-rlb/ng-app";

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
    allowedUrls: ['https://api.riolabs.net', 'http://localhost:8000'],
    providers: [{
      configId: 'riolabs',
      authority: 'https://login.riolabs.net/realms/customers',
      redirectUrl: 'http://localhost:4202',
      postLogoutRedirectUri: 'http://localhost:4202',
      clientId: 'chatbot',
      scope: 'openid profile offline_access',
      logLevel: 2,
    }]
  },
  pages: {
    content: { path: 'content', },
    cookies: { path: 'cookies', },
    notFound: { path: 'not-found', },
    privacy: { path: 'privacy', },
    support: { path: 'support', },
    terms: { path: 'terms', },
    logger: { path: 'logger', },
    status: { path: 'status', },
  },
  endpoints: {}
}

