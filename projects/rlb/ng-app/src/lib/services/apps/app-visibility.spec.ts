import { AppInfo } from './app';
import { hasPublicSettingsApps, isSettingsAppVisible } from './app-visibility';

function settingsApp(overrides: { auth?: boolean; enabled?: boolean } = {}): AppInfo {
  return {
    type: 'sysadmin',
    id: 'sysadmin',
    enabled: overrides.enabled ?? true,
    viewMode: 'settings',
    settings: {
      title: 'sysadmin.appTitle',
      description: 'sysadmin.appDescription',
      url: '/settings/sysadmin',
      icon: 'bi bi-gear',
      auth: overrides.auth ?? true,
    },
  };
}

describe('isSettingsAppVisible', () => {
  it('offers a public app to an anonymous visitor', () => {
    // The regression this whole rule exists for: `auth: false` means "no session needed", so
    // hiding it from anonymous visitors is precisely backwards.
    expect(isSettingsAppVisible(settingsApp({ auth: false }), false)).toBe(true);
  });

  it('offers a public app to a signed-in visitor', () => {
    expect(isSettingsAppVisible(settingsApp({ auth: false }), true)).toBe(true);
  });

  it('hides an app that needs a session from an anonymous visitor', () => {
    expect(isSettingsAppVisible(settingsApp({ auth: true }), false)).toBe(false);
  });

  it('offers an app that needs a session once there is one', () => {
    expect(isSettingsAppVisible(settingsApp({ auth: true }), true)).toBe(true);
  });

  it('treats a null authentication state as anonymous', () => {
    // The navbar passes `isAuthenticated` straight through from a signal that starts as null.
    expect(isSettingsAppVisible(settingsApp({ auth: true }), null)).toBe(false);
    expect(isSettingsAppVisible(settingsApp({ auth: false }), null)).toBe(true);
  });

  it('hides a disabled app regardless of auth', () => {
    expect(isSettingsAppVisible(settingsApp({ auth: false, enabled: false }), true)).toBe(false);
  });

  it('hides an app that declares no settings entry', () => {
    const coreOnly: AppInfo = {
      type: 'home',
      id: 'home',
      enabled: true,
      viewMode: 'app',
      core: {
        title: 'home.appTitle',
        description: 'home.appDescription',
        url: '/home',
        icon: 'bi bi-house',
        auth: false,
      },
    };

    expect(isSettingsAppVisible(coreOnly, true)).toBe(false);
  });
});

describe('hasPublicSettingsApps', () => {
  it('is false when every settings app needs a session', () => {
    // The anti-regression assertion. Existing consumers declare `auth: true` throughout, so this
    // stays false for them and the anonymous chrome they have never rendered stays unrendered.
    expect(hasPublicSettingsApps([settingsApp({ auth: true }), settingsApp({ auth: true })])).toBe(
      false,
    );
  });

  it('is true when at least one settings app is public', () => {
    expect(hasPublicSettingsApps([settingsApp({ auth: true }), settingsApp({ auth: false })])).toBe(
      true,
    );
  });

  it('ignores a public but disabled app', () => {
    expect(hasPublicSettingsApps([settingsApp({ auth: false, enabled: false })])).toBe(false);
  });

  it('is false with no apps at all', () => {
    expect(hasPublicSettingsApps([])).toBe(false);
  });
});
