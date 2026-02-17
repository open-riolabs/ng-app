import { ProjectConfiguration } from '@open-rlb/ng-app';

export const environment: ProjectConfiguration & { payment: { stripe: { key: string; }; }; } = {
  production: false,
  environment: {
    baseUrl: 'http://localhost:4200',
    ssr: false,
    phone: false,
    appLogo: 'assets/logo.svg',
    appTitle: 'Riolabs',
    navbarDisabled: false,
    errorDialogName: 'error-modal-component',
    pwaUpdateEnabled: true,
    errorDialogSize: 'md',
  },
  i18n: {
    availableLangs: ['it'],
    defaultLanguage: 'en',
    useLanguageBrowser: true,
    storeSelectedLanguage: true,
    cookieStoreName: 'language',
  },
  auth: {
    protocol: 'oauth',
    storage: 'localStorage',
    interceptor: 'oauth-code-ep',
    allowedUrls: ['api.staging.riolabs.net'],
    enableCompanyInterceptor: true,
    providers: [{
      configId: 'chattoo',
      authority: 'https://login.riolabs.net/realms/riolabs-dev',
      redirectUrl: 'http://localhost:4200',
      postLogoutRedirectUri: 'http://localhost:4200',
      clientId: 'chattoo',
      scope: 'openid profile offline_access',
      logLevel: 2,
    }]
  },
  pages: {
    content: { path: 'content' },
    cookies: { path: 'cookies' },
    notFound: { path: 'not-found' },
    privacy: { path: 'privacy' },
    support: { path: 'support' },
    terms: { path: 'terms' },
    status: { path: 'status' },
    logger: { path: 'logger' },
  },
  endpoints: {
    "http-gateway": { baseUrl: 'https://api.staging.riolabs.net', auth: true, healthPath: 'health', wss: false },
    "ws-gateway": { baseUrl: 'wss://api.staging.riolabs.net', healthPath: 'health', auth: true, wss: true, }
  },
  acl: {
    endpointKey: 'http-gateway',
    path: 'admin/acl/resources',
    businessIdKey: 'businessId',
    resourceIdKey: 'resourceId',
    interceptorMapping: {
      companyId: 'companyId',
      chatId: 'productId',
    },
  },
  payment: {
    stripe: {
      key: ""
    }
  }
};
