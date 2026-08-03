// Asserts the packed tarball retains schematics/package.json — the `{"type":"commonjs"}`
// marker that lets `ng add` load the CommonJS schematics under the package's
// `"type": "module"`. `npm pack` silently strips nested package.json files, which
// breaks `ng add` without any error at build time. Run after `npm pack`.
const { execSync } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const path = require('node:path');

const pkg = require(path.join(__dirname, '..', 'dist', 'rlb', 'ng-app', 'package.json'));
const tarball = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;

if (!existsSync(tarball)) {
  console.error(`✗ Tarball not found: ${tarball}. Run \`npm pack ./dist/rlb/ng-app\` first.`);
  process.exit(1);
}

const entries = execSync(`tar -tzf "${tarball}"`, { encoding: 'utf8' });
if (!entries.includes('package/schematics/package.json')) {
  console.error(`✗ ${tarball} is missing schematics/package.json (the CommonJS marker).`);
  console.error('  ng add would fail: the CJS schematics load as ESM under "type":"module".');
  process.exit(1);
}

// The bundled skills are the whole point of the sync-skills schematic: consumers re-run it from
// their postinstall to pick up skill updates. If they silently stop shipping, sync-skills becomes
// a no-op and nobody finds out until the guidance is stale.
const SKILLS_PREFIX = 'package/schematics/sync-skills/claude-skills/';
const packedSkills = new Set(
  entries
    .split('\n')
    .filter(entry => entry.startsWith(SKILLS_PREFIX))
    .map(entry => entry.slice(SKILLS_PREFIX.length).split('/')[0])
    .filter(Boolean),
);

if (packedSkills.size === 0) {
  console.error(`✗ ${tarball} is missing schematics/sync-skills/claude-skills/.`);
  console.error(
    '  sync-skills would copy nothing. Build with `npm run lib:build`, not `ng build`.',
  );
  process.exit(1);
}

// Guard against foreign skills leaking into our package. `.claude/skills` in this repo holds
// @open-rlb/ng-bootstrap's skills; only `projects/rlb/ng-app/skills` is ours to publish.
const ownSkills = readdirSync(path.join(__dirname, '..', 'projects', 'rlb', 'ng-app', 'skills'), {
  withFileTypes: true,
})
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

const unexpected = [...packedSkills].filter(name => !ownSkills.includes(name));
const missing = ownSkills.filter(name => !packedSkills.has(name));
if (unexpected.length || missing.length) {
  console.error(`✗ ${tarball} skill bundle does not match projects/rlb/ng-app/skills.`);
  if (unexpected.length)
    console.error(`  unexpected (not ours to publish): ${unexpected.join(', ')}`);
  if (missing.length) console.error(`  missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`✓ ${tarball} retains schematics/package.json — ng add will load correctly.`);
console.log(`✓ ${tarball} ships exactly our ${ownSkills.length} skills: ${ownSkills.join(', ')}`);
