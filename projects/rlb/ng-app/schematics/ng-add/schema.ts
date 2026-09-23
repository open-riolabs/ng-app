/** Options for the `ng add @open-rlb/ng-app` schematic. */
export interface Schema {
  /** Name of the core application to create. Defaults to `core`. */
  name?: string;
  /** When true, the bundled Claude skills are not copied into .claude/skills. */
  skipSkills?: boolean;
  /** When true, no `postinstall` script is added to keep the skills in sync on future installs. */
  skipSkillsAutoSync?: boolean;
}
