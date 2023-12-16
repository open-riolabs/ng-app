/*
 * Public API Surface of ng-store
 */

import { AuthState } from './lib/auth';
import { SidebarState } from './lib/sidebar';
import { NavbarState } from './lib/navbar';

export * from './lib/auth';
export * from './lib/sidebar';
export * from './lib/navbar';

export interface BaseState extends AuthState, SidebarState, NavbarState { }