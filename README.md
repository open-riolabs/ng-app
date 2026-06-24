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
`--project <name>` (target a specific workspace project).

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
