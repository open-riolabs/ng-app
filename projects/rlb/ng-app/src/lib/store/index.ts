import { AuthState } from './auth';
import { SidebarState } from './sidebar';
import { NavbarState } from './navbar';

export * from './auth';
export * from './sidebar';
export * from './navbar';

export interface BaseState extends AuthState, SidebarState, NavbarState { }