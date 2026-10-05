import { strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  schematic,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  addDependency,
  DependencyType,
  ExistingBehavior,
  readWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility';
import { Schema } from './schema';

/**
 * Dependencies the library needs at the consumer side. Versions mirror the ranges declared in the
 * library's `peerDependencies`.
 */
const DEPENDENCIES: ReadonlyArray<{ name: string; version: string; type: DependencyType }> = [
  { name: '@open-rlb/ng-bootstrap', version: '^4.0.0', type: DependencyType.Default },
  // Pinned exactly, not caret-ranged: 2.1.4 is the version we consider stable. Later 2.1.x
  // releases have known problems, and `^2.1.4` would resolve straight past it to the newest.
  { name: '@open-rlb/date-tz', version: '2.1.4', type: DependencyType.Default },
  { name: '@ngrx/store', version: '^22.0.0', type: DependencyType.Default },
  { name: '@ngrx/effects', version: '^22.0.0', type: DependencyType.Default },
  { name: '@ngrx/operators', version: '^22.0.0', type: DependencyType.Default },
  { name: '@ngrx/signals', version: '^22.0.0', type: DependencyType.Default },
  { name: '@ngx-translate/core', version: '^17.0.0', type: DependencyType.Default },
  { name: '@ngx-translate/http-loader', version: '^17.0.0', type: DependencyType.Default },
  { name: 'angular-auth-oidc-client', version: '^19.0.1', type: DependencyType.Default },
  { name: 'ngx-cookie-service', version: '^22.0.0', type: DependencyType.Default },
  { name: 'ngx-cookie-service-ssr', version: '^22.0.0', type: DependencyType.Default },
  { name: '@angular/service-worker', version: '^22.0.0', type: DependencyType.Default },
  { name: 'bootstrap-icons', version: '^1.13.1', type: DependencyType.Default },
  { name: '@types/bootstrap', version: '^5.2.10', type: DependencyType.Dev },
];

/**
 * Angular packages a workspace created with `--no-create-application` does not ship but the core
 * app needs: the application builder, and the CDK the library's templates import. Installed at the
 * workspace's own Angular version and never replaced when already present.
 */
const ANGULAR_DEPENDENCIES: ReadonlyArray<{ name: string; type: DependencyType }> = [
  { name: '@angular/cdk', type: DependencyType.Default },
  { name: '@angular/platform-browser', type: DependencyType.Default },
  { name: '@angular/build', type: DependencyType.Dev },
];

/** Used when package.json does not name `@angular/core` at all. */
const FALLBACK_ANGULAR_VERSION = '^22.0.0';

/** Global styles required for the Bootstrap + @open-rlb/ng-bootstrap look & feel. */
const STYLE_PATHS: ReadonlyArray<string> = [
  'node_modules/bootstrap-icons/font/bootstrap-icons.css',
  'node_modules/@open-rlb/ng-bootstrap/assets/scss/app.scss',
  'node_modules/@open-rlb/ng-bootstrap/assets/scss/icons.scss',
];

/** SCSS `@use`/`@import` resolution root needed by the ng-bootstrap stylesheets. */
const STYLE_INCLUDE_PATH = 'node_modules';

/**
 * Production budgets of the core app.
 *
 * `ng new`'s 1 MB initial ceiling does not fit: this library together with ng-bootstrap, Bootstrap,
 * NgRx and the OIDC client starts at ~1.55 MB raw (~277 kB compressed), so the default would make
 * the very first `ng build` fail.
 */
const BUDGETS = [
  { type: 'initial', maximumWarning: '2MB', maximumError: '4MB' },
  { type: 'anyComponentStyle', maximumWarning: '6kB', maximumError: '10kB' },
];

/** Keeps `.claude/skills` in step with the installed library version on every `npm install`. */
const SYNC_SKILLS_COMMAND = 'ng g @open-rlb/ng-app:sync-skills';

/** The `postinstall` we write: the sync, failing soft so an install never breaks on it. */
const SYNC_SKILLS_POSTINSTALL = `${SYNC_SKILLS_COMMAND} || echo Skipped Claude skill sync`;

/**
 * The equivalent command from @open-rlb/ng-bootstrap. Our sync now delegates to it, so a
 * `postinstall` consisting of just this command is replaced rather than appended to.
 */
const COMPANION_SYNC_COMMAND = 'ng g @open-rlb/ng-bootstrap:sync-skills';

/**
 * Creates the `core` application — the shell every app of the workspace is registered into — in a
 * workspace made with `ng new --no-create-application`.
 */
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree) => {
    const name = options.name || 'core';
    const workspace = await readWorkspace(tree);

    if (workspace.projects.has(name)) {
      throw new SchematicsException(
        `Project "${name}" already exists in the workspace. Pass --name to create the core app under another name.`,
      );
    }

    const newProjectRoot = String(workspace.extensions['newProjectRoot'] ?? 'projects');
    const projectRoot = [newProjectRoot, name].filter(Boolean).join('/');
    const angularVersion = readAngularVersion(tree);

    return chain([
      // 1. Install dependencies (a single npm install is scheduled automatically).
      ...ANGULAR_DEPENDENCIES.map(dep =>
        addDependency(dep.name, angularVersion, { type: dep.type, existing: ExistingBehavior.Skip }),
      ),
      ...DEPENDENCIES.map(dep => addDependency(dep.name, dep.version, { type: dep.type })),
      // 2. Register the core app in angular.json.
      addCoreProject(name, projectRoot),
      // 3. Scaffold its files.
      scaffoldCore(name, projectRoot),
      // 4. Point the package.json scripts at it.
      addScripts(name),
      // 5. Optionally copy the bundled Claude skills into .claude/skills.
      options.skipSkills ? noop : schematic('sync-skills', {}),
      // 6. Optionally keep them in sync on every future `npm install`.
      options.skipSkills || options.skipSkillsAutoSync ? noop : addSkillsPostinstall(),
      // 7. Print next steps.
      logNextSteps(name, projectRoot, options),
    ]);
  };
}

/** The workspace's `@angular/core` range, so the Angular packages we add match it. */
function readAngularVersion(tree: Tree): string {
  const raw = tree.read('/package.json');
  if (!raw) {
    return FALLBACK_ANGULAR_VERSION;
  }
  const pkg = JSON.parse(raw.toString('utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return (
    pkg.dependencies?.['@angular/core'] ??
    pkg.devDependencies?.['@angular/core'] ??
    FALLBACK_ANGULAR_VERSION
  );
}

function addCoreProject(name: string, projectRoot: string): Rule {
  const sourceRoot = `${projectRoot}/src`;

  return updateWorkspace(workspace => {
    workspace.projects.add({
      name,
      root: projectRoot,
      sourceRoot,
      prefix: 'app',
      projectType: 'application',
      schematics: {
        '@schematics/angular:component': { style: 'scss' },
      },
      targets: {
        build: {
          builder: '@angular/build:application',
          defaultConfiguration: 'production',
          options: {
            browser: `${sourceRoot}/main.ts`,
            index: `${sourceRoot}/index.html`,
            tsConfig: `${projectRoot}/tsconfig.app.json`,
            inlineStyleLanguage: 'scss',
            assets: [{ glob: '**/*', input: `${sourceRoot}/assets`, output: 'assets' }],
            styles: [...STYLE_PATHS],
            stylePreprocessorOptions: { includePaths: [STYLE_INCLUDE_PATH] },
          },
          configurations: {
            production: {
              budgets: BUDGETS,
              outputHashing: 'all',
            },
            staging: {
              budgets: BUDGETS,
              outputHashing: 'all',
              sourceMap: true,
            },
            development: {
              optimization: false,
              extractLicenses: false,
              sourceMap: true,
            },
          },
        },
        serve: {
          builder: '@angular/build:dev-server',
          defaultConfiguration: 'development',
          options: {},
          configurations: {
            production: { buildTarget: `${name}:build:production` },
            staging: { buildTarget: `${name}:build:staging` },
            development: { buildTarget: `${name}:build:development` },
          },
        },
      },
    });
  });
}

function scaffoldCore(name: string, projectRoot: string): Rule {
  const depth = projectRoot.split('/').filter(Boolean).length;
  const relativePathToWorkspaceRoot = Array(depth).fill('..').join('/') || '.';

  const templates = apply(url('./files'), [
    applyTemplates({ ...strings, name, relativePathToWorkspaceRoot }),
    move(projectRoot),
  ]);
  return mergeWith(templates, MergeStrategy.Overwrite);
}

/** Points the workspace scripts at the core app. Other scripts are left untouched. */
function addScripts(name: string): Rule {
  return (tree: Tree) => {
    const raw = tree.read('/package.json');
    if (!raw) {
      return tree;
    }

    const pkg = JSON.parse(raw.toString('utf-8')) as { scripts?: Record<string, string> };
    pkg.scripts = {
      ...pkg.scripts,
      start: `ng serve ${name}`,
      build: `ng build ${name} --configuration production`,
      'build:dev': `ng build ${name} --configuration development`,
      'build:staging': `ng build ${name} --configuration staging`,
      watch: `ng build ${name} --watch --configuration development`,
      test: 'ng test',
    };
    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2) + '\n');
    return tree;
  };
}

/**
 * Adds a `postinstall` script that re-runs the sync-skills schematic, so `npm install` alone
 * refreshes `.claude/skills` to match the newly installed library version.
 *
 * The script deliberately lives in the consumer's package.json rather than the library's: a
 * library-side install script is silently skipped under `--ignore-scripts`, has to guess the
 * app root via INIT_CWD, and would fire in unrelated repos on transitive installs.
 *
 * npm allows only one `postinstall`, so an existing script is appended to, never dropped — with
 * one exception: a script that is *only* @open-rlb/ng-bootstrap's sync is replaced, since our
 * sync-skills already delegates to it and running it twice just makes `npm install` slower.
 */
function addSkillsPostinstall(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const raw = tree.read('/package.json');
    if (!raw) {
      return tree;
    }

    const pkg = JSON.parse(raw.toString('utf-8')) as { scripts?: Record<string, string> };
    const existing = pkg.scripts?.['postinstall'];

    if (existing?.includes(SYNC_SKILLS_COMMAND)) {
      return tree;
    }

    // Left over from @open-rlb/ng-bootstrap's `ng add`. Our sync covers it now, so absorb it.
    // Only an exact match is replaced — anything else may carry work we know nothing about.
    const absorbsCompanion = existing?.trim() === COMPANION_SYNC_COMMAND;

    // Windows `cmd.exe` parses `A || B && C` as `A || (B && C)` — not `(A || B) && C` as sh does.
    // Both sides may use `||` (ours does, to fail soft), so each is grouped before joining.
    const base = absorbsCompanion
      ? undefined
      : existing?.includes('||')
        ? `(${existing})`
        : existing;

    pkg.scripts = {
      ...pkg.scripts,
      postinstall: base ? `${base} && (${SYNC_SKILLS_POSTINSTALL})` : SYNC_SKILLS_POSTINSTALL,
    };
    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2) + '\n');

    if (absorbsCompanion) {
      context.logger.info(
        `• Replaced the standalone "${COMPANION_SYNC_COMMAND}" postinstall — our sync delegates to it.`,
      );
    } else if (existing) {
      context.logger.info(`• Appended the skill sync to the existing "postinstall" script.`);
    }
    return tree;
  };
}

function logNextSteps(name: string, projectRoot: string, options: Schema): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const log = context.logger;
    log.info('');
    log.info('✅ @open-rlb/ng-app added successfully.');
    log.info('   • Dependencies installed and added to package.json');
    log.info(`   • "${name}" application registered in angular.json (${projectRoot})`);
    log.info(`     - src/main.ts, src/index.html, src/assets/favicon.ico, src/assets/i18n/{en,it}.json`);
    log.info('     - src/app/app.config.ts (provideRlbConfig + RLB_INIT_PROVIDER)');
    log.info('     - src/app/app-init.provider.ts, src/app/app.component.ts, src/app/app.routes.ts');
    log.info('     - src/environments/environment.ts');
    log.info(`   • package.json scripts point at "${name}" (start, build, build:dev, build:staging, watch)`);
    if (!options.skipSkills) {
      log.info('   • Claude skills copied to .claude/skills/ (rlb-app-* guides, plus');
      log.info("     @open-rlb/ng-bootstrap's — the sync delegates to its own schematic)");
      if (!options.skipSkillsAutoSync) {
        log.info(`   • "postinstall": "${SYNC_SKILLS_POSTINSTALL}" wired into package.json`);
        log.info('     `npm update <pkg>` skips root lifecycle scripts — follow it with a');
        log.info('     bare `npm install`.');
      }
    }
    log.info('');
    log.info(`⚠ Before running: edit ${projectRoot}/src/environments/environment.ts and replace the`);
    log.info('  placeholder OIDC authority/clientId/redirectUrl and endpoint baseUrls.');
    log.info('  Then start the app with: npm start');
    log.info('');
  };
}

/** A no-op rule. */
const noop: Rule = tree => tree;
