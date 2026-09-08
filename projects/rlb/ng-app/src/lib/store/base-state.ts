import { AppState } from './app-context/app-context.model';
import { AuthState } from './auth/auth.model';
import { NavbarState } from './navbar/navbar.model';
import { SidebarState } from './sidebar/sidebar.model';
import { AclState } from './acl/acl.model';

/**
 * The library's aggregate store shape.
 *
 * It lives here rather than in `index.ts` because the barrel re-exports `acl.store`, which itself
 * needs this type: declaring it in the barrel made every consumer of `BaseState` import the barrel
 * and closed an import cycle. Re-exported from `index.ts`, so the public API is unchanged.
 */
export interface BaseState extends AclState, AuthState, SidebarState, NavbarState, AppState {}
