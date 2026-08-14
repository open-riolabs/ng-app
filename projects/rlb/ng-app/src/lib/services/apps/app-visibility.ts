import { AppInfo } from './app';

/**
 * Rules deciding which settings apps the shell chrome offers.
 *
 * Deliberately plain functions rather than component members: the same rule is applied by both the
 * navbar (`templates/app/app.component.html`) and the settings dropdown
 * (`pages/settings/settings-dropdown-selector`), and keeping it here means it can be unit-tested
 * without standing up a TestBed for either of those components.
 *
 * Not re-exported from `services/apps/index.ts` on purpose — `public-api.ts` re-exports that barrel
 * wholesale, and this is an internal detail, not API we want to support.
 */

/**
 * Whether a settings app should be offered to the current visitor.
 *
 * `AppDetails.auth` states whether the app *needs* a session. An app that does not is public, and is
 * offered to anonymous visitors — that is the whole meaning of `auth: false`. An app that does is
 * offered only once there is a session to satisfy it.
 */
export function isSettingsAppVisible(
  app: AppInfo,
  isAuthenticated: boolean | null | undefined,
): boolean {
  if (!app.settings || !app.enabled) {
    return false;
  }
  return !app.settings.auth || !!isAuthenticated;
}

/**
 * Whether any registered app exposes settings that need no session.
 *
 * Gates the *anonymous* rendering of the settings chrome. The shell is otherwise authenticated-only
 * by design, so this keeps the relaxation additive: with no public settings app — the case for every
 * consumer whose apps all declare `auth: true` — it returns false and the chrome behaves exactly as
 * it did before.
 */
export function hasPublicSettingsApps(apps: readonly AppInfo[]): boolean {
  return apps.some(app => !!app.settings && app.enabled && !app.settings.auth);
}
