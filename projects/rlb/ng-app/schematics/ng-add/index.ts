import { strings } from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import {
  addDependency,
  DependencyType,
  readWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility';
import { Schema } from './schema';

/**
 * Dependencies the library needs at the consumer side. `@angular/{core,common,forms,router}`
 * and `rxjs` are intentionally omitted: every Angular app already provides them. Versions mirror
 * the ranges declared in the library's `peerDependencies`.
 */
const DEPENDENCIES: ReadonlyArray<{ name: string; version: string; type: DependencyType }> = [
  { name: '@open-rlb/ng-bootstrap', version: '^3.0.1', type: DependencyType.Default },
  { name: '@open-rlb/date-tz', version: '^2.1.1', type: DependencyType.Default },
  { name: '@ngrx/store', version: '^21.0.0', type: DependencyType.Default },
  { name: '@ngrx/effects', version: '^21.0.0', type: DependencyType.Default },
  { name: '@ngrx/operators', version: '^21.0.0', type: DependencyType.Default },
  { name: '@ngrx/signals', version: '^21.0.0', type: DependencyType.Default },
  { name: '@ngx-translate/core', version: '^17.0.0', type: DependencyType.Default },
  { name: '@ngx-translate/http-loader', version: '^17.0.0', type: DependencyType.Default },
  { name: 'angular-auth-oidc-client', version: '^19.0.1', type: DependencyType.Default },
  { name: 'ngx-cookie-service', version: '^21.1.0', type: DependencyType.Default },
  { name: 'ngx-cookie-service-ssr', version: '^21.1.0', type: DependencyType.Default },
  { name: '@angular/service-worker', version: '^21.0.0', type: DependencyType.Default },
  { name: 'bootstrap-icons', version: '^1.13.1', type: DependencyType.Default },
  { name: '@types/bootstrap', version: '^5.2.10', type: DependencyType.Dev },
];

/** Global styles required for the Bootstrap + @open-rlb/ng-bootstrap look & feel. */
const STYLE_PATHS: ReadonlyArray<string> = [
  'node_modules/bootstrap-icons/font/bootstrap-icons.css',
  'node_modules/@open-rlb/ng-bootstrap/assets/scss/app.scss',
  'node_modules/@open-rlb/ng-bootstrap/assets/scss/icons.scss',
];

/** SCSS `@use`/`@import` resolution root needed by the ng-bootstrap stylesheets. */
const STYLE_INCLUDE_PATH = 'node_modules';

/** Source folder for the scaffolded runtime assets (i18n JSON, logo), served at `/assets`. */
const ASSETS_INPUT = 'src/assets';

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, _context: SchematicContext) => {
    const project = await resolveProject(tree, options.project);

    return chain([
      // 1. Install dependencies (a single npm install is scheduled automatically).
      ...DEPENDENCIES.map(dep => addDependency(dep.name, dep.version, { type: dep.type })),
      // 2. Register Bootstrap + ng-bootstrap global styles and the SCSS include path in angular.json.
      addBootstrapStyles(project),
      // 3. Scaffold the runnable application shell (providers, environment, app component, routes).
      options.skipShell ? noop : scaffoldShell(tree, project),
      // 4. Optionally copy the bundled Claude skills into .claude/skills.
      options.skipSkills ? noop : copyClaudeSkills(),
      // 5. Print next steps.
      logNextSteps(project, options),
    ]);
  };
}

/** Resolves the target project: the provided name, else the first application, else the first project. */
async function resolveProject(tree: Tree, name?: string): Promise<string> {
  const workspace = await readWorkspace(tree);

  if (name) {
    if (!workspace.projects.has(name)) {
      throw new SchematicsException(`Project "${name}" was not found in the workspace.`);
    }
    return name;
  }

  for (const [projectName, project] of workspace.projects) {
    if (project.extensions['projectType'] === 'application') {
      return projectName;
    }
  }

  const first = workspace.projects.keys().next().value;
  if (!first) {
    throw new SchematicsException('No project found in the workspace to add @open-rlb/ng-app to.');
  }
  return first;
}

function addBootstrapStyles(project: string): Rule {
  return updateWorkspace(workspace => {
    const target = workspace.projects.get(project)?.targets.get('build');
    if (!target) {
      return;
    }
    target.options ??= {};

    const styles = (target.options['styles'] as Array<string | { input: string }>) ?? [];
    for (const style of STYLE_PATHS) {
      const present = styles.some(s => (typeof s === 'string' ? s : s.input) === style);
      if (!present) {
        styles.unshift(style);
      }
    }
    target.options['styles'] = styles;

    const preprocessor =
      (target.options['stylePreprocessorOptions'] as { includePaths?: string[] } | undefined) ?? {};
    const includePaths = preprocessor.includePaths ?? [];
    if (!includePaths.includes(STYLE_INCLUDE_PATH)) {
      includePaths.push(STYLE_INCLUDE_PATH);
    }
    preprocessor.includePaths = includePaths;
    target.options['stylePreprocessorOptions'] = preprocessor;

    // Ensure the scaffolded src/assets (i18n JSON, logo) are served at `/assets`. Fresh Angular
    // apps only ship `public/`, so the library's `./assets/i18n/*.json` loader would 404 without this.
    type AssetEntry = string | { glob: string; input: string; output?: string };
    const assets = (target.options['assets'] as AssetEntry[]) ?? [];
    const servesAssets = assets.some(a => {
      const input = typeof a === 'string' ? a : a.input;
      return input === ASSETS_INPUT;
    });
    if (!servesAssets) {
      assets.push({ glob: '**/*', input: ASSETS_INPUT, output: 'assets' });
    }
    target.options['assets'] = assets;
  });
}

function scaffoldShell(tree: Tree, project: string): Rule {
  return async () => {
    const workspace = await readWorkspace(tree);
    const def = workspace.projects.get(project);
    const sourceRoot = def?.sourceRoot ?? (def ? `${def.root}/src` : 'src');

    const templates = apply(url('./files'), [
      applyTemplates({ ...strings }),
      move(sourceRoot),
    ]);

    // Overwrite the core shell files: ng add assumes a fresh/near-fresh app and the shell is the
    // deliverable. Existing files (e.g. the default app.config.ts from `ng new`) are replaced.
    return mergeWith(templates, MergeStrategy.Overwrite);
  };
}

/**
 * Copies the Claude skills bundled with the package into the consumer's
 * `.claude/skills` folder. Library-authored skills are authoritative, so existing
 * copies are overwritten to stay in sync with the installed version.
 */
function copyClaudeSkills(): Rule {
  const skills = apply(url('./claude-skills'), [move('.claude/skills')]);
  return mergeWith(skills, MergeStrategy.Overwrite);
}

function logNextSteps(project: string, options: Schema): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const log = context.logger;
    log.info('');
    log.info('✅ @open-rlb/ng-app added successfully.');
    log.info('   • Dependencies installed and added to package.json');
    log.info('   • Bootstrap + ng-bootstrap styles registered in angular.json');
    if (!options.skipShell) {
      log.info(`   • Application shell scaffolded into the "${project}" app:`);
      log.info('     - src/main.ts bootstraps the AppComponent shell');
      log.info('     - src/environments/environment.ts (config: auth, endpoints, i18n, pages, acl)');
      log.info('     - src/app/app.config.ts (provideRlbConfig + provideApp + RLB_INIT_PROVIDER)');
      log.info('     - src/app/app.component.ts (<rlb-app-container> shell), app.describer.ts, routes, home');
      log.info('     A default root component from `ng new` (e.g. src/app/app.ts) is now unused and can be deleted.');
    }
    if (!options.skipSkills) {
      log.info('   • Claude skills copied to .claude/skills/ (rlb-app-* guides)');
    }
    log.info('');
    log.info('⚠ Before running: edit src/environments/environment.ts and replace the placeholder');
    log.info('  OIDC authority/clientId/redirectUrl and endpoint baseUrls with your real values.');
    log.info('  Then start the app with: ng serve');
    log.info('');
  };
}

/** A no-op rule. */
const noop: Rule = tree => tree;
