// Asserts the packed tarball retains schematics/package.json — the `{"type":"commonjs"}`
// marker that lets `ng add` load the CommonJS schematics under the package's
// `"type": "module"`. `npm pack` silently strips nested package.json files, which
// breaks `ng add` without any error at build time. Run after `npm pack`.
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
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

console.log(`✓ ${tarball} retains schematics/package.json — ng add will load correctly.`);
