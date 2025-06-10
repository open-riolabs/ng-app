import { EnvironmentProviders, Provider } from "@angular/core";
import { Routes } from "@angular/router";
import { AppInfo } from "./app";

export interface AppDescriber<T = any> {
  info: AppInfo;
  routes?: Routes;
  providers?: (Provider | EnvironmentProviders)[];
}
