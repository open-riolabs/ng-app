/**
 * Import-hygiene guard for the library source.
 *
 * Ported from @open-rlb/ng-bootstrap, which established these invariants by hand after having
 * already lost them once. Four rules:
 *
 *   1. No import cycles (including a file importing itself). Next door `public-api.ts` imported
 *      from './public-api', which only "worked" because the binding was not dereferenced until
 *      call time.
 *   2. Nothing imports `rlb-app.module` except `public-api.ts`. It imports and re-exports the
 *      aggregate surface, so a library file importing it creates a cycle and drags the whole
 *      library in. Consumers may still import `RlbAppModule` from the package root: that is
 *      public API and deliberately unaffected. This rule governs only the library's own sources.
 *   3. No deep imports past a package root (e.g. `@open-rlb/date-tz/date-tz`). Those resolve under
 *      a bundler but not under Node ESM, so they break consumers' unit tests while their builds
 *      pass. That exact defect shipped in ng-bootstrap, invisible from inside its own repo.
 *   4. No runtime import of `bootstrap`. Its ESM and UMD builds are mirror images and it ships no
 *      `exports` map, so a bundler resolves `module` (named exports, no default) while Node
 *      resolves `main` (a UMD bundle whose names its lexer cannot see): no direct import form
 *      works under both. This library has none today and should not gain one -- reach Bootstrap's
 *      JS through @open-rlb/ng-bootstrap, which owns the interop shim.
 *
 * Run: npm run check:imports
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'projects/rlb/ng-app/src';
const MODULE_FILE = 'rlb-app.module.ts';
const MODULE_ALLOWED_IMPORTER = 'public-api.ts';

/** Packages we must not reach past the root of. */
const NO_DEEP_IMPORT = ['@open-rlb/date-tz', '@open-rlb/ng-bootstrap'];

/** Dual-format package that must not be imported at runtime in this library at all. */
const CJS_ONLY = 'bootstrap';
const CJS_INTEROP_FILE = 'lib/shared/bootstrap.ts';

const norm = (p) => p.split(path.sep).join('/');

if (!fs.existsSync(ROOT)) {
  console.error(`✗ ${ROOT} not found — run this from the workspace root.`);
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(norm(p));
  }
})(ROOT);

const resolveRelative = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec);
  for (const candidate of [base + '.ts', path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return norm(path.relative('.', candidate));
  }
  return null;
};

const IMPORT_RE = /(?:from|import)\s*['"]([^'"]+)['"]/g;
/** Captures the whole import clause, so we can tell `{ Collapse }` from `{ type Collapse }`. */
const IMPORT_CLAUSE_RE = /import\s+([^'"]+?)\s+from\s*['"]([^'"]+)['"]/g;
const graph = new Map();
const deepImports = [];
const moduleImporters = [];
const cjsNamedImports = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const deps = new Set();

  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];

    if (spec.startsWith('.')) {
      const target = resolveRelative(file, spec);
      if (target) {
        deps.add(target);
        if (target.endsWith('/' + MODULE_FILE) && !file.endsWith('/' + MODULE_ALLOWED_IMPORTER)) {
          moduleImporters.push({ file, spec });
        }
      }
      continue;
    }

    for (const pkg of NO_DEEP_IMPORT) {
      if (spec.startsWith(pkg + '/')) deepImports.push({ file, spec, pkg });
    }
  }

  for (const [, clause, spec] of src.matchAll(IMPORT_CLAUSE_RE)) {
    if (spec !== CJS_ONLY) continue;
    /* `import type` is erased before the emit, so it never reaches a module loader. */
    if (clause.trim().startsWith('type ')) continue;
    if (file.endsWith('/' + CJS_INTEROP_FILE)) continue;
    cjsNamedImports.push({ file, spec, kind: clause.trim() });
  }

  graph.set(file, deps);
}

/* ---- 1. cycles ---------------------------------------------------------- */
const selfImports = [...graph].filter(([f, deps]) => deps.has(f)).map(([f]) => f);

const cycles = [];
const done = new Set();
(function findCycles() {
  const walkNode = (node, stack) => {
    if (done.has(node)) return;
    const at = stack.indexOf(node);
    if (at !== -1) {
      cycles.push(stack.slice(at).concat(node));
      return;
    }
    stack.push(node);
    for (const dep of graph.get(node) ?? []) walkNode(dep, stack);
    stack.pop();
    done.add(node);
  };
  for (const node of graph.keys()) walkNode(node, []);
})();

const distinctCycles = [];
const seen = new Set();
for (const cycle of cycles) {
  if (cycle.length <= 2) continue; // self-imports reported separately
  const key = [...new Set(cycle)].sort().join('|');
  if (seen.has(key)) continue;
  seen.add(key);
  distinctCycles.push(cycle);
}

/* ---- report ------------------------------------------------------------- */
const short = (p) => p.replace(ROOT + '/', '');
let failed = false;

if (selfImports.length) {
  failed = true;
  console.error(`\n✗ ${selfImports.length} file(s) import themselves:`);
  for (const f of selfImports) console.error(`    ${short(f)}`);
}

if (distinctCycles.length) {
  failed = true;
  console.error(`\n✗ ${distinctCycles.length} import cycle(s):`);
  for (const cycle of distinctCycles) {
    console.error('    ' + cycle.map(short).join('\n      -> '));
  }
  console.error('\n  Inside the library, import the concrete file — never a barrel or the module.');
}

if (moduleImporters.length) {
  failed = true;
  console.error(`\n✗ ${moduleImporters.length} file(s) import ${MODULE_FILE} (only ${MODULE_ALLOWED_IMPORTER} may):`);
  for (const { file, spec } of moduleImporters) console.error(`    ${short(file)}  ->  '${spec}'`);
  console.error('\n  It imports and exports the whole library. Import the specific components instead.');
}

if (deepImports.length) {
  failed = true;
  console.error(`\n✗ ${deepImports.length} deep import(s) past a package root:`);
  for (const { file, spec } of deepImports) console.error(`    ${short(file)}  ->  '${spec}'`);
  console.error('\n  These resolve under a bundler but not under Node ESM, so they break consumers’ unit tests.');
}

if (cjsNamedImports.length) {
  failed = true;
  console.error(`\n✗ ${cjsNamedImports.length} runtime import(s) of '${CJS_ONLY}' outside the interop shim:`);
  for (const { file, spec, kind } of cjsNamedImports) {
    console.error(`    ${short(file)}  ->  import ${kind} from '${spec}'`);
  }
  console.error('\n  No direct import form works under both a bundler and Node ESM. Use types only:');
  console.error("    import type { Collapse } from 'bootstrap';        // types only, erased");
}

if (failed) {
  console.error(`\nChecked ${files.length} files — import hygiene FAILED.\n`);
  process.exit(1);
}

console.log(`✓ Import hygiene OK — ${files.length} files, no cycles, no god-module imports, no deep package imports, no stray bootstrap imports.`);
