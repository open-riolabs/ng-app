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

/**
 * Initial-bundle budget the scaffolded shell needs.
 *
 * `ng new` writes a 1 MB error ceiling, but this library together with ng-bootstrap, Bootstrap,
 * NgRx and the OIDC client starts at ~1.55 MB — so without this a fresh `ng add` produces an app
 * that fails `ng build` before the consumer has written a line of code. Angular budgets measure
 * raw bytes; the same bundle transfers at ~277 kB compressed.
 */
const INITIAL_BUDGET = { maximumWarning: '2MB', maximumError: '4MB' } as const;

/** Keeps `.claude/skills` in step with the installed library version on every `npm install`. */
const SYNC_SKILLS_COMMAND = 'ng g @open-rlb/ng-app:sync-skills';

/**
 * The equivalent command from @open-rlb/ng-bootstrap. Our sync now delegates to it, so a
 * `postinstall` consisting of just this command is replaced rather than appended to.
 */
const COMPANION_SYNC_COMMAND = 'ng g @open-rlb/ng-bootstrap:sync-skills';

export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, _context: SchematicContext) => {
    const project = await resolveProject(tree, options.project);

    return chain([
      // 1. Install dependencies (a single npm install is scheduled automatically).
      ...DEPENDENCIES.map(dep => addDependency(dep.name, dep.version, { type: dep.type })),
      // 2. Register Bootstrap + ng-bootstrap global styles and the SCSS include path in angular.json.
      addBootstrapStyles(project),
      // 3. Raise the initial-bundle budget so the scaffolded app builds out of the box.
      raiseInitialBudget(project),
      // 4. Scaffold the runnable application shell (providers, environment, app component, routes).
      options.skipShell ? noop : scaffoldShell(tree, project),
      // 5. Optionally copy the bundled Claude skills into .claude/skills.
      options.skipSkills ? noop : schematic('sync-skills', {}),
      // 6. Optionally keep them in sync on every future `npm install`.
      options.skipSkills || options.skipSkillsAutoSync ? noop : addSkillsPostinstall(),
      // 7. Print next steps.
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

/**
 * Raises the production `initial` bundle budget to fit the shell.
 *
 * Only ever raises. A consumer who already allowed more keeps their setting, and a value we cannot
 * parse (a `%` budget, say) is left alone rather than guessed at — lowering someone's ceiling would
 * be a far worse failure than leaving it high.
 */
function raiseInitialBudget(project: string): Rule {
  return updateWorkspace(workspace => {
    type Budget = { type?: string; maximumWarning?: string; maximumError?: string };

    const target = workspace.projects.get(project)?.targets.get('build');
    const production = target?.configurations?.['production'] as { budgets?: Budget[] } | undefined;
    const budgets = production?.budgets;

    // No budgets configured means nothing is being enforced — there is nothing to raise.
    if (!production || !Array.isArray(budgets) || !budgets.some(b => b.type === 'initial')) {
      return;
    }

    // Replace the array wholesale rather than mutating the entry in place: the workspace writer
    // records changes per property, and cannot express an edit to an object nested in an array.
    production.budgets = budgets.map(budget => {
      if (budget.type !== 'initial') {
        return budget;
      }

      const raised: Budget = { ...budget };
      for (const key of ['maximumWarning', 'maximumError'] as const) {
        const current = parseBudgetBytes(raised[key]);
        const wanted = parseBudgetBytes(INITIAL_BUDGET[key]);
        if (current !== null && wanted !== null && current < wanted) {
          raised[key] = INITIAL_BUDGET[key];
        }
      }
      return raised;
    });
  });
}

/** Bytes for an Angular budget string such as `500kB`, or null when it is not a plain size. */
function parseBudgetBytes(value: string | undefined): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i.exec(value?.trim() ?? '');
  if (!match) {
    return null;
  }

  const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
  return Number(match[1]) * units[(match[2] ?? 'b').toLowerCase() as keyof typeof units];
}

function scaffoldShell(tree: Tree, project: string): Rule {
  return async () => {
    const workspace = await readWorkspace(tree);
    const def = workspace.projects.get(project);
    const sourceRoot = def?.sourceRoot ?? (def ? `${def.root}/src` : 'src');

    const templates = apply(url('./files'), [applyTemplates({ ...strings }), move(sourceRoot)]);

    // Overwrite the core shell files: ng add assumes a fresh/near-fresh app and the shell is the
    // deliverable. Existing files (e.g. the default app.config.ts from `ng new`) are replaced.
    return mergeWith(templates, MergeStrategy.Overwrite);
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
    // Appending to a script that already uses `||` (a fail-soft sync, say) would silently skip our
    // command whenever theirs succeeded, so group it first.
    const base = absorbsCompanion
      ? undefined
      : existing?.includes('||')
        ? `(${existing})`
        : existing;

    pkg.scripts = {
      ...pkg.scripts,
      postinstall: base ? `${base} && ${SYNC_SKILLS_COMMAND}` : SYNC_SKILLS_COMMAND,
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
      log.info(
        '     - src/environments/environment.ts (config: auth, endpoints, i18n, pages, acl)',
      );
      log.info('     - src/app/app.config.ts (provideRlbConfig + provideApp + RLB_INIT_PROVIDER)');
      log.info(
        '     - src/app/app.component.ts (<rlb-app-container> shell), app.describer.ts, routes, home',
      );
      log.info(
        '     A default root component from `ng new` (e.g. src/app/app.ts) is now unused and can be deleted.',
      );
    }
    if (!options.skipSkills) {
      log.info('   • Claude skills copied to .claude/skills/ (rlb-app-* guides, plus');
      log.info("     @open-rlb/ng-bootstrap's — the sync delegates to its own schematic)");
      if (!options.skipSkillsAutoSync) {
        log.info(`   • "postinstall": "${SYNC_SKILLS_COMMAND}" wired into package.json`);
        log.info("     One command refreshes every library's skills on `npm install`. Note");
        log.info('     `npm update <pkg>` skips root lifecycle scripts — follow it with a');
        log.info('     bare `npm install`.');
      }
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
