import { JwtUser } from '../auth';
import { AppState } from './app-context/app-context.model';
import { AuthState } from './auth/auth.model';
import { NavbarState } from './navbar/navbar.model';
import { SidebarState } from './sidebar/sidebar.model';

export * from './app-context/app-context.actions';
export * from './app-context/app-context.model';
export * from './auth/auth-feature.service';
export * from './auth/auth.actions';
export * from './auth/auth.model';
export * from './navbar/navbar.actions';
export * from './navbar/navbar.model';
export * from './sidebar/sidebar.actions';
export * from './sidebar/sidebar.model';


export interface BaseState<User = JwtUser> extends AuthState<User>, SidebarState, NavbarState, AppState { }
