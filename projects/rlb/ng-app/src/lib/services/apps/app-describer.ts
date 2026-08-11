import { EnvironmentProviders, Provider } from "@angular/core";
import { Routes } from "@angular/router";
import { AppInfo } from "./app";

export interface AppDescriber<T = any> {
  info: AppInfo;
  routes?: Routes;
  /**
   * Providers this app needs, spread into the **root injector on every domain** — `info.domains`
   * does not scope them. Wrap anything tenant-local (interceptors, app initializers) in
   * `provideForDomains(domains, providers)`.
   */
  providers?: (Provider | EnvironmentProviders)[];
}
