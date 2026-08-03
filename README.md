# NgBaseapp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4202/`. The application will automatically reload if you change any of the source files.

## Using @open-rlb/ng-app in another app (`ng add`)

`@open-rlb/ng-app` ships an `ng add` schematic that bootstraps a consuming app in one command:

```bash
ng add @open-rlb/ng-app
```

It installs the peer dependencies, registers the Bootstrap + ng-bootstrap styles in `angular.json`,
and scaffolds a runnable application shell: `src/environments/environment.ts`,
`src/app/app.config.ts` (`provideRlbConfig` + `provideApp` + `RLB_INIT_PROVIDER`),
`app.component.ts` (the `<rlb-app-container>` shell), `app.describer.ts`, routes, a home page, and
i18n assets. It also copies the bundled Claude skills into `.claude/skills/`.

After running it, **edit `src/environments/environment.ts`** to replace the placeholder OIDC
`authority`/`clientId`/`redirectUrl` and endpoint `baseUrl`s with your real values, then `ng serve`.

Options: `--skip-shell` (don't scaffold the shell), `--skip-skills` (don't copy Claude skills),
`--skip-skills-auto-sync` (copy them once, but don't add the `postinstall` below),
`--project <name>` (target a specific workspace project).

## Claude skills

The library ships the [Claude Code](https://claude.ai/code) skills that document it
(`rlb-app-apps`, `rlb-app-auth-acl`, `rlb-app-config`, `rlb-app-shell`, `rlb-app-store`) inside the
npm package, so every installed version carries the guidance that matches it.

The sync also **delegates to companion `@open-rlb` libraries** that ship their own `sync-skills`
schematic — today `@open-rlb/ng-bootstrap`, a peer dependency — so a single command refreshes every
skill in the workspace, not just ours. Pass `--companions=false` to sync only this library's.

`ng add` copies them into `.claude/skills/` and wires a `postinstall` so they stay current:

```json
{
  "scripts": {
    "postinstall": "ng g @open-rlb/ng-app:sync-skills"
  }
}
```

A bare `npm install` or an `npm ci` then refreshes them. You can also run it directly:

```bash
ng g @open-rlb/ng-app:sync-skills
```

⚠️ **Upgrading a package does not trigger it.** npm runs a project's own `postinstall` only when
the command targets the whole project:

| Command                       | Refreshes skills |
| ----------------------------- | ---------------- |
| `npm install` (no arguments)  | ✅ yes            |
| `npm ci`                      | ✅ yes            |
| `npm install <pkg>`           | ❌ no             |
| `npm update <pkg>`            | ❌ no             |

So the natural way to upgrade — `npm update @open-rlb/ng-app` — leaves the skills at the old
version silently. Follow it with a bare `npm install`.

The sync is re-runnable and conservative:

- Skills the library ships are overwritten to match the installed version.
- Skills you wrote yourself are never touched.
- Skills the library no longer ships are deleted, tracked via `.claude/skills/.rlb-skills.ng-app.json`
  (commit it). `--prune=false` keeps them, and is forwarded to companion libraries too.

**Coexisting with `@open-rlb/ng-bootstrap`:** that library has its own `sync-skills` schematic and
its own `.rlb-skills.json` manifest, and our sync invokes it rather than shipping copies of its
skills. Each library therefore remains the sole owner of what it delivers, at the version you
actually installed — republishing its skills inside our package would pin them to whatever version
_we_ built against and make the two prunes fight over the same folders.

A companion never aborts the sync, since this normally runs from `postinstall`. It is skipped
silently when not installed at all; a version that ships no `sync-skills` schematic
(`@open-rlb/ng-bootstrap` before 3.3, which our `^3.0.1` peer range still permits) is reported by
name and version with an upgrade hint, so missing skills are never silent; and one that fails
outright is reported as a warning.

`ng add` appends to an existing `postinstall` rather than replacing it, since npm allows only one —
parenthesising it first if it contains `||`, because Windows `cmd.exe` parses `A || B && C` as
`A || (B && C)` and would otherwise skip the appended command. The one exception: a `postinstall`
that is *only* `ng g @open-rlb/ng-bootstrap:sync-skills` (what its `ng add` leaves behind) is
replaced, because our sync already delegates to it.

Set `RLB_SKIP_SKILL_SYNC=1` to make the schematic a no-op — useful in a CI job that asserts a clean
working tree after `npm install`.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
