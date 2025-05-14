import { Routes } from "@angular/router";
import { AppInfo } from "./app";
import { EnvironmentProviders, Provider } from "@angular/core";

export interface AppDescriber<T = any> {
  info: AppInfo;
  routes?: Routes
  providers?: (Provider | EnvironmentProviders)[]
  data?: T
}
