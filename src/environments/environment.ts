import { ProjectConfiguration } from "@rlb/ng-app";


export const environment: ProjectConfiguration = {
  eventsEndpoint: 'wss://notify.addubby.com',
  production: false,
  environment: {
    baseUrl: 'http://localhost:2001',
    ssr: false,
    phone: false,
    appLogo: 'assets/logo.svg',
    appTitle: 'Riolabs',
    sidebarMode: 'logo',
    navbarDisabled: false
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
    issuer: 'https://login.riolabs.net/realms/riolabs',
    redirectUrlLogin: 'http://localhost:2001',
    redirectUrlLogout: 'http://localhost:2001',
    clientId: 'addubby',
    scope: 'openid profile offline_access',
    showDebugInformation: false,
    allowedUrls: [
      'http://localhost:5002',
      'http://localhost:5001',
    ],
  },
  pages: {
    content: { path: 'content', },
    cookies: { path: 'cookies', },
    notFound: { path: 'not-found', },
    privacy: { path: 'privacy', },
    support: { path: 'support', },
    terms: { path: 'terms', },
  },
  endpoints: {}
}