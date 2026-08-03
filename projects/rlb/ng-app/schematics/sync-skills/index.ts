import {
  apply,
  callRule,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { isObservable, firstValueFrom } from 'rxjs';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { Schema } from './schema';

/** Where the consumer's Claude skills live. */
const SKILLS_ROOT = '/.claude/skills';

/**
 * Records which skill folders this library owns, so a later sync can delete the ones it no
 * longer ships without touching skills the consumer wrote themselves.
 *
 * The filename is package-specific on purpose. A consumer typically installs @open-rlb/ng-bootstrap
 * alongside this library and both sync into the same `.claude/skills`; sharing one manifest would
 * make each library believe it owned the other's skills and delete them.
 */
const MANIFEST_PATH = `${SKILLS_ROOT}/.rlb-skills.ng-app.json`;

/** Set this in CI if a pipeline asserts a clean working tree after `npm install`. */
const SKIP_ENV_VAR = 'RLB_SKIP_SKILL_SYNC';

const PACKAGE_NAME = '@open-rlb/ng-app';

/**
 * Companion libraries whose skills we refresh alongside ours, so a consumer needs a single
 * `postinstall` command to keep every skill current.
 *
 * We delegate to their schematic rather than bundling their skill files into our package. Their
 * version is resolved from the consumer's own `node_modules`, so the guidance always matches the
 * code they actually installed — our peer range (`^3.0.1`) lets them resolve a newer release than
 * the one we built against. Delegation also keeps each library the sole owner of its manifest;
 * republishing would make our prune and theirs fight over the same folders.
 *
 * @open-rlb/ng-bootstrap is a peerDependency of this library, so it is normally installed — but
 * `resolveCompanion` still handles it being missing or too old rather than assuming.
 */
const COMPANIONS: ReadonlyArray<string> = ['@open-rlb/ng-bootstrap'];

interface Manifest {
  package: string;
  version: string;
  skills: string[];
}

/**
 * Copies the Claude skills bundled with the *installed* version of the library into the
 * consumer's `.claude/skills`. Safe to re-run: it is how consumers pick up skill changes after
 * `npm update`, typically from their own `postinstall` script.
 */
export function syncSkills(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    if (process.env[SKIP_ENV_VAR]) {
      context.logger.info(`• ${SKIP_ENV_VAR} is set — skipping Claude skill sync.`);
      return noop;
    }

    const bundled = await readBundledSkills(context);

    if (bundled.skills.length === 0) {
      context.logger.warn(
        `⚠ ${PACKAGE_NAME} shipped without Claude skills — nothing of ours to sync. ` +
          'This usually means the package was built with a bare `ng build` instead of `npm run lib:build`.',
      );
      // Companions are packaged independently, so a broken bundle on our side must not cost the
      // consumer their skills too.
      return options.companions === false ? noop : syncCompanions(options);
    }

    const previous = readManifest(tree);
    // Only folders a previous sync claimed are ours to delete. Anything else in .claude/skills
    // was authored in the consumer and must survive.
    const stale =
      options.prune === false
        ? []
        : (previous?.skills ?? []).filter(name => !bundled.skills.includes(name));

    const added = bundled.files.filter(file => !tree.exists(join(SKILLS_ROOT, file.path)));
    const updated = bundled.files.filter(file => {
      const target = join(SKILLS_ROOT, file.path);
      const current = tree.read(target);
      return current !== null && !current.equals(file.content);
    });

    return chain([
      prune(stale),
      mergeWith(apply(url('./claude-skills'), [move(SKILLS_ROOT)]), MergeStrategy.Overwrite),
      writeManifest(bundled.skills),
      logSummary({ skills: bundled.skills, added: added.length, updated: updated.length, stale }),
      options.companions === false ? noop : syncCompanions(options),
    ]);
  };
}

/**
 * Runs each installed companion library's own `sync-skills`, so one command refreshes every skill.
 *
 * A companion that is absent, too old to ship the schematic, or that fails outright must never
 * abort our sync — this typically runs from the consumer's `postinstall`, where throwing would
 * break `npm install` over a documentation refresh.
 */
function syncCompanions(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    for (const pkg of COMPANIONS) {
      const companion = resolveCompanion(pkg);

      // Not a dependency of this workspace at all — nothing to say.
      if (companion.status === 'absent') {
        continue;
      }

      // Installed, but predating the schematic. Silence here looks identical to "it worked",
      // leaving the consumer with stale guidance and no idea why, so name the fix.
      if (companion.status === 'unsupported') {
        context.logger.info(
          `• ${pkg}@${companion.version} ships no sync-skills schematic — its Claude skills were not refreshed.`,
        );
        context.logger.info(`  Upgrade ${pkg} to pick them up.`);
        continue;
      }

      try {
        // `externalSchematic` throws when the rule is *executed*, not when it is built, so the
        // chain would swallow our try/catch. Run it explicitly to keep the failure local.
        // The resolved absolute collection path is passed instead of the package name so it does
        // not matter which root the engine host resolves external collections against.
        tree = await firstValueFrom(
          callRule(
            externalSchematic(companion.collection, 'sync-skills', { prune: options.prune }),
            tree,
            context,
          ),
        );
      } catch (error) {
        context.logger.warn(
          `⚠ Could not sync Claude skills from ${pkg}: ${error instanceof Error ? error.message : error}`,
        );
        context.logger.warn(`  Run \`ng g ${pkg}:sync-skills\` directly to see the full error.`);
      }
    }

    return tree;
  };
}

/**
 * What we found for a companion package. "absent" and "unsupported" are deliberately distinct:
 * one is a normal setup, the other is a silently degraded one worth telling the consumer about.
 */
type Companion =
  | { status: 'ready'; collection: string; version: string }
  | { status: 'unsupported'; version: string }
  | { status: 'absent' };

/**
 * Locates a companion's `sync-skills` schematic. Resolved from the real filesystem rather than the
 * Tree: `node_modules` is not part of the schematic Tree. `process.cwd()` is the workspace root
 * when run through the Angular CLI.
 *
 * A package that resolves but declares no `sync-skills` (any @open-rlb/ng-bootstrap before 3.3) is
 * reported as `unsupported` rather than folded into `absent`, and so is one whose manifest or
 * collection cannot be read — from the consumer's side the outcome and the fix are the same.
 */
function resolveCompanion(pkg: string): Companion {
  let manifestPath: string;
  try {
    manifestPath = require.resolve(`${pkg}/package.json`, { paths: [process.cwd()] });
  } catch {
    return { status: 'absent' };
  }

  let manifest: { version?: string; schematics?: string };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    return { status: 'unsupported', version: 'unknown' };
  }

  const version = manifest.version ?? 'unknown';
  if (!manifest.schematics) {
    return { status: 'unsupported', version };
  }

  try {
    const collection = resolve(dirname(manifestPath), manifest.schematics);
    const declared = JSON.parse(readFileSync(collection, 'utf-8')) as {
      schematics?: Record<string, unknown>;
    };

    return declared.schematics?.['sync-skills']
      ? { status: 'ready', collection, version }
      : { status: 'unsupported', version };
  } catch {
    return { status: 'unsupported', version };
  }
}

/** Reads the skills packaged alongside this schematic (see scripts/build-schematics.mjs). */
async function readBundledSkills(
  context: SchematicContext,
): Promise<{ skills: string[]; files: Array<{ path: string; content: Buffer }> }> {
  const source = url('./claude-skills')(context);
  const bundledTree = isObservable(source) ? await firstValueFrom(source) : source;

  const skills = new Set<string>();
  const files: Array<{ path: string; content: Buffer }> = [];

  bundledTree.visit((path, entry) => {
    const folder = path.replace(/^\//, '').split('/')[0];
    if (folder) {
      skills.add(folder);
    }
    if (entry) {
      files.push({ path, content: entry.content });
    }
  });

  return { skills: [...skills].sort(), files };
}

function readManifest(tree: Tree): Manifest | null {
  const raw = tree.read(MANIFEST_PATH);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw.toString('utf-8')) as Partial<Manifest>;
    return Array.isArray(parsed.skills)
      ? { package: PACKAGE_NAME, version: '', ...parsed, skills: parsed.skills }
      : null;
  } catch {
    // A hand-mangled manifest must not abort the sync — treat it as "nothing owned yet".
    return null;
  }
}

/** Deletes every file under the named skill folders. */
function prune(stale: string[]): Rule {
  return (tree: Tree) => {
    for (const name of stale) {
      const dir = tree.getDir(join(SKILLS_ROOT, name));
      const paths: string[] = [];
      dir.visit(path => paths.push(path));
      paths.forEach(path => tree.delete(path));
    }
    return tree;
  };
}

function writeManifest(skills: string[]): Rule {
  return (tree: Tree) => {
    const manifest: Manifest = { package: PACKAGE_NAME, version: installedVersion(), skills };
    const content = JSON.stringify(manifest, null, 2) + '\n';

    if (tree.exists(MANIFEST_PATH)) {
      tree.overwrite(MANIFEST_PATH, content);
    } else {
      tree.create(MANIFEST_PATH, content);
    }
    return tree;
  };
}

/**
 * The version of the library these skills came from. Resolved from the package.json two levels
 * up from the compiled `schematics/sync-skills/index.js`, i.e. the installed package's own.
 */
function installedVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require('../../package.json') as { version?: string }).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function logSummary(summary: {
  skills: string[];
  added: number;
  updated: number;
  stale: string[];
}): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const log = context.logger;
    log.info('');
    log.info(`✅ Claude skills synced from ${PACKAGE_NAME}@${installedVersion()}`);
    log.info(`   • ${summary.skills.length} skills: ${summary.skills.join(', ')}`);
    log.info(`   • ${summary.added} new file(s), ${summary.updated} updated`);
    if (summary.stale.length) {
      log.info(`   • pruned (no longer shipped): ${summary.stale.join(', ')}`);
    }
    log.info('');
  };
}

function join(base: string, path: string): string {
  return `${base}/${path}`.replace(/\/+/g, '/');
}

/** A no-op rule. */
const noop: Rule = tree => tree;
