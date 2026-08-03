/** Options for the `ng generate @open-rlb/ng-app:sync-skills` schematic. */
export interface Schema {
  /**
   * When false, skills that the library used to ship but no longer does are left in place
   * instead of being deleted. Skills authored in the consumer are never pruned either way.
   */
  prune?: boolean;

  /**
   * When false, only this library's own skills are synced. By default the sync also delegates to
   * companion @open-rlb libraries that ship their own `sync-skills` schematic, so one command
   * refreshes every skill in the workspace. Each library still owns and prunes only its own.
   */
  companions?: boolean;
}
