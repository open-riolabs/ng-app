/** Options for the `ng add @open-rlb/ng-app` schematic. */
export interface Schema {
  /** The name of the project to add the library to. Defaults to the workspace's default/first app. */
  project?: string;
  /** When true, the application shell (environment, providers, app component, routes, home) is not scaffolded. */
  skipShell?: boolean;
  /** When true, the bundled Claude skills are not copied into .claude/skills. */
  skipSkills?: boolean;
}
