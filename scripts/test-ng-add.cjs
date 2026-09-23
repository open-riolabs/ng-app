// Isolated, in-memory verification of the ng-add and sync-skills schematics.
// No real npm install, no writes to the repo.
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const { Tree } = require('@angular-devkit/schematics');
const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const distSchematics = path.join(__dirname, '..', 'dist', 'rlb', 'ng-app', 'schematics');
const collection = path.join(distSchematics, 'collection.json');

/** The skills the freshly built package actually bundles — the expected sync result. */
const bundledSkills = readdirSync(path.join(distSchematics, 'sync-skills', 'claude-skills'), {
  withFileTypes: true,
})
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

/**
 * The skills the *installed* @open-rlb/ng-bootstrap bundles. sync-skills delegates to its
 * schematic, so these are what fan-out is expected to deliver. Read from node_modules rather than
 * hard-coded: the point of delegating is that the companion's own version decides.
 */
const companionSkillsDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@open-rlb',
  'ng-bootstrap',
  'schematics',
  'sync-skills',
  'claude-skills',
);
const companionInstalled = existsSync(companionSkillsDir);
const companionSkills = companionInstalled
  ? readdirSync(companionSkillsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
  : [];

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`);
  }
}

/** Mirrors what `ng new --no-create-application` writes: a workspace with no projects. */
function angularJson(projects = {}) {
  return {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    newProjectRoot: 'projects',
    projects,
  };
}

/** The ng-add postinstall, failing soft so an install never breaks on it. */
const POSTINSTALL = 'ng g @open-rlb/ng-app:sync-skills || echo Skipped Claude skill sync';

function appTree(packageJson, workspace = angularJson()) {
  const tree = Tree.empty();
  tree.create('/package.json', JSON.stringify(packageJson, null, 2));
  tree.create('/angular.json', JSON.stringify(workspace, null, 2));
  tree.create('/tsconfig.json', JSON.stringify({ compilerOptions: {}, files: [] }, null, 2));
  return tree;
}

/** What `ng new --no-create-application` puts in package.json. */
function workspacePackageJson() {
  return {
    name: 'demo',
    version: '0.0.0',
    scripts: {
      ng: 'ng',
      start: 'ng serve',
      build: 'ng build',
      watch: 'ng build --watch --configuration development',
      test: 'ng test',
    },
    dependencies: { '@angular/core': '^22.1.0', '@angular/platform-browser': '^22.1.0' },
    devDependencies: { '@angular/cli': '^22.1.0' },
  };
}

const CORE_FILES = [
  '/projects/core/tsconfig.app.json',
  '/projects/core/src/index.html',
  '/projects/core/src/main.ts',
  '/projects/core/src/assets/favicon.ico',
  '/projects/core/src/assets/i18n/en.json',
  '/projects/core/src/assets/i18n/it.json',
  '/projects/core/src/app/app.config.ts',
  '/projects/core/src/app/app-init.provider.ts',
  '/projects/core/src/app/app.component.ts',
  '/projects/core/src/app/app.routes.ts',
  '/projects/core/src/environments/environment.ts',
];

async function testNgAdd() {
  console.log('\n=== ng-add on a workspace without applications ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const result = await runner.runSchematic('ng-add', {}, appTree(workspacePackageJson()));

  console.log('\n--- scheduled tasks (should include node-package install) ---');
  console.log(
    runner.tasks.map(t => t.name + ' ' + JSON.stringify(t.options || {})).join('\n') || '(none)',
  );

  console.log('\n--- /package.json ---');
  console.log(result.readContent('/package.json'));

  const workspace = JSON.parse(result.readContent('/angular.json'));
  console.log('--- /angular.json projects.core ---');
  console.log(JSON.stringify(workspace.projects.core, null, 2));

  const coreFiles = result.files.filter(f => f.startsWith('/projects/core/'));
  console.log('\n--- core files ---');
  console.log(coreFiles.join('\n') || '(none)');

  console.log('\n--- Claude skills copied to .claude/skills ---');
  console.log(result.files.filter(f => f.startsWith('/.claude/skills')).join('\n') || '(none)');

  console.log('\n--- assertions ---');
  check(
    'core scaffolds exactly the expected files',
    JSON.stringify([...coreFiles].sort()) === JSON.stringify([...CORE_FILES].sort()),
    `got: ${coreFiles.join(', ')}`,
  );
  check(
    'nothing scaffolded outside the core project',
    result.files.every(
      f =>
        f.startsWith('/projects/core/') ||
        f.startsWith('/.claude/') ||
        ['/package.json', '/angular.json', '/tsconfig.json'].includes(f),
    ),
    result.files.join(', '),
  );

  const favicon = result.read('/projects/core/src/assets/favicon.ico');
  const sourceFavicon = readFileSync(
    path.join(distSchematics, 'ng-add', 'files', 'src', 'assets', 'favicon.ico'),
  );
  check('favicon copied byte for byte', Boolean(favicon) && favicon.equals(sourceFavicon));

  const core = workspace.projects.core;
  check('core registered as an application', Boolean(core) && core.projectType === 'application');
  check(
    'core rooted at newProjectRoot',
    core.root === 'projects/core' && core.sourceRoot === 'projects/core/src',
  );

  const build = core.architect.build;
  check(
    'build points at the core sources',
    build.options.browser === 'projects/core/src/main.ts' &&
      build.options.index === 'projects/core/src/index.html' &&
      build.options.tsConfig === 'projects/core/tsconfig.app.json',
    JSON.stringify(build.options),
  );
  check(
    'assets served from src/assets at /assets',
    build.options.assets.some(a => a.input === 'projects/core/src/assets' && a.output === 'assets'),
  );
  check(
    'ng-bootstrap styles registered',
    build.options.styles.includes('node_modules/@open-rlb/ng-bootstrap/assets/scss/app.scss'),
  );
  check(
    'SCSS include path set',
    build.options.stylePreprocessorOptions.includePaths.includes('node_modules'),
  );
  check(
    'production, staging and development configurations for build and serve',
    ['production', 'staging', 'development'].every(
      c => build.configurations[c] && core.architect.serve.configurations[c],
    ),
  );
  const initial = build.configurations.production.budgets.find(b => b.type === 'initial');
  check('initial budget fits the shell', initial.maximumError === '4MB', JSON.stringify(initial));

  check(
    'tsconfig.app.json extends the workspace tsconfig',
    result.readContent('/projects/core/tsconfig.app.json').includes('"extends": "../../tsconfig.json"'),
  );

  const component = result.readContent('/projects/core/src/app/app.component.ts');
  check('app component mounts the shell', component.includes('<rlb-app-container'));
  check('app component configures the core chrome', component.includes('setInitialCoreAppConfig'));
  check(
    'template placeholders all resolved',
    CORE_FILES.filter(f => f.endsWith('.ts') || f.endsWith('.html')).every(f => !result.readContent(f).includes('<%')),
  );

  const pkg = JSON.parse(result.readContent('/package.json'));
  const expectedScripts = {
    ng: 'ng',
    start: 'ng serve core',
    build: 'ng build core --configuration production',
    watch: 'ng build core --watch --configuration development',
    test: 'ng test',
    'build:dev': 'ng build core --configuration development',
    'build:staging': 'ng build core --configuration staging',
    postinstall: POSTINSTALL,
  };
  check(
    'package.json scripts point at core',
    JSON.stringify(pkg.scripts) === JSON.stringify(expectedScripts),
    `got: ${JSON.stringify(pkg.scripts)}`,
  );
  check(
    'application builder added at the workspace Angular version',
    pkg.devDependencies['@angular/build'] === '^22.1.0',
    JSON.stringify(pkg.devDependencies),
  );
  check('CDK added at the workspace Angular version', pkg.dependencies['@angular/cdk'] === '^22.1.0');
  check(
    'library dependencies added',
    Boolean(pkg.dependencies['@ngrx/store'] && pkg.dependencies['angular-auth-oidc-client']),
  );

  check(
    'manifest written to .claude/skills/.rlb-skills.ng-app.json',
    result.files.includes('/.claude/skills/.rlb-skills.ng-app.json'),
  );
  if (result.files.includes('/.claude/skills/.rlb-skills.ng-app.json')) {
    const manifest = JSON.parse(result.readContent('/.claude/skills/.rlb-skills.ng-app.json'));
    check(
      'manifest lists every bundled skill',
      JSON.stringify(manifest.skills) === JSON.stringify(bundledSkills),
      `expected ${JSON.stringify(bundledSkills)}, got ${JSON.stringify(manifest.skills)}`,
    );
    check('manifest records the package name', manifest.package === '@open-rlb/ng-app');
  }

  check(
    'every bundled skill has a SKILL.md in the tree',
    bundledSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
  );

  if (companionInstalled) {
    check(
      "ng add also delivered @open-rlb/ng-bootstrap's skills (fan-out)",
      companionSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
      `expected ${companionSkills.join(', ')}`,
    );
  }
}

async function testCustomName() {
  console.log('\n=== ng-add --name creates the core app under another name ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const result = await runner.runSchematic(
    'ng-add',
    { name: 'shell', skipSkills: true },
    appTree(workspacePackageJson()),
  );
  const workspace = JSON.parse(result.readContent('/angular.json'));
  const pkg = JSON.parse(result.readContent('/package.json'));

  check('project registered as "shell"', Boolean(workspace.projects.shell) && !workspace.projects.core);
  check('files under projects/shell', result.files.includes('/projects/shell/src/app/app.component.ts'));
  check(
    'serve targets reference the name',
    workspace.projects.shell.architect.serve.configurations.staging.buildTarget ===
      'shell:build:staging',
  );
  check('scripts reference the name', pkg.scripts.start === 'ng serve shell');
  check('no postinstall with --skip-skills', pkg.scripts.postinstall === undefined);
}

async function testRefusesExistingProject() {
  console.log('\n=== ng-add refuses to overwrite an existing project ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree(
    workspacePackageJson(),
    angularJson({ core: { projectType: 'application', root: 'projects/core', architect: {} } }),
  );

  let error;
  try {
    await runner.runSchematic('ng-add', {}, tree);
  } catch (e) {
    error = e;
  }
  check(
    'fails naming the clashing project',
    Boolean(error && /"core" already exists/.test(error.message)),
    error ? error.message : 'no error',
  );
}

async function testAppendsToExistingPostinstall() {
  console.log('\n=== ng-add appends to an existing postinstall ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  // Something unrelated to skills: an exact ng-bootstrap sync would be absorbed instead (below).
  const existing = 'husky install';
  const tree = appTree({
    name: 'demo',
    version: '0.0.0',
    scripts: { postinstall: existing },
    dependencies: {},
    devDependencies: {},
  });

  const result = await runner.runSchematic('ng-add', {}, tree);
  const pkg = JSON.parse(result.readContent('/package.json'));

  console.log(`  postinstall: ${pkg.scripts.postinstall}`);
  check(
    'existing command preserved and ours appended',
    pkg.scripts.postinstall === `${existing} && (${POSTINSTALL})`,
    `got: ${pkg.scripts.postinstall}`,
  );
}

async function testAbsorbsCompanionPostinstall() {
  console.log('\n=== ng-add absorbs a standalone ng-bootstrap sync postinstall ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  // What @open-rlb/ng-bootstrap's own `ng add` leaves behind. Our sync delegates to it now, so
  // keeping both would just run the same schematic twice on every install.
  const existing = 'ng g @open-rlb/ng-bootstrap:sync-skills';
  const tree = appTree({
    name: 'demo',
    version: '0.0.0',
    scripts: { postinstall: existing },
    dependencies: {},
    devDependencies: {},
  });

  const result = await runner.runSchematic('ng-add', {}, tree);
  const pkg = JSON.parse(result.readContent('/package.json'));

  console.log(`  postinstall: ${pkg.scripts.postinstall}`);
  check(
    'redundant companion command replaced, not appended',
    pkg.scripts.postinstall === POSTINSTALL,
    `got: ${pkg.scripts.postinstall}`,
  );
}

async function testGroupsExistingPostinstallWithOr() {
  console.log('\n=== ng-add groups an existing postinstall that uses || ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  // Windows cmd.exe parses `A || B && C` as `A || (B && C)`, so an ungrouped append would be
  // silently skipped whenever the existing command succeeded. Verified empirically.
  const existing = 'ng g @open-rlb/ng-bootstrap:sync-skills || echo Skipped';
  const tree = appTree({
    name: 'demo',
    version: '0.0.0',
    scripts: { postinstall: existing },
    dependencies: {},
    devDependencies: {},
  });

  const result = await runner.runSchematic('ng-add', {}, tree);
  const pkg = JSON.parse(result.readContent('/package.json'));

  console.log(`  postinstall: ${pkg.scripts.postinstall}`);
  check(
    'existing || script is parenthesised before appending',
    pkg.scripts.postinstall === `(${existing}) && (${POSTINSTALL})`,
    `got: ${pkg.scripts.postinstall}`,
  );
}

async function testSyncSkillsPrunes() {
  console.log('\n=== sync-skills prunes stale library skills, spares hand-written ones ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  // A previous sync of an older library version: it owned one skill that no longer ships.
  tree.create(
    '/.claude/skills/.rlb-skills.ng-app.json',
    JSON.stringify(
      {
        package: '@open-rlb/ng-app',
        version: '0.0.1',
        skills: [...bundledSkills, 'rlb-app-retired'],
      },
      null,
      2,
    ),
  );
  tree.create('/.claude/skills/rlb-app-retired/SKILL.md', '# retired');
  tree.create('/.claude/skills/rlb-app-retired/references/notes.md', 'stale');
  // Authored in the consumer, never listed in the manifest — must survive.
  tree.create('/.claude/skills/my-own-skill/SKILL.md', '# mine');
  // A stale copy of a skill that IS still shipped — must be overwritten.
  tree.create(`/.claude/skills/${bundledSkills[0]}/SKILL.md`, 'outdated content');

  // Fan-out off: this test is about our own prune semantics, and the companion's files would only
  // add noise to the diff it inspects.
  const result = await runner.runSchematic('sync-skills', { companions: false }, tree);

  console.log('\n--- .claude/skills after sync ---');
  console.log(result.files.filter(f => f.startsWith('/.claude/skills')).join('\n') || '(none)');

  console.log('\n--- assertions ---');
  check(
    'retired skill pruned',
    !result.files.some(f => f.startsWith('/.claude/skills/rlb-app-retired/')),
    result.files.filter(f => f.startsWith('/.claude/skills/rlb-app-retired/')).join(', '),
  );
  check(
    'hand-written skill survived',
    result.files.includes('/.claude/skills/my-own-skill/SKILL.md'),
  );
  check(
    'stale copy of a shipped skill was overwritten',
    result.readContent(`/.claude/skills/${bundledSkills[0]}/SKILL.md`) !== 'outdated content',
  );

  const manifest = JSON.parse(result.readContent('/.claude/skills/.rlb-skills.ng-app.json'));
  check(
    'manifest no longer lists the retired skill',
    JSON.stringify(manifest.skills) === JSON.stringify(bundledSkills),
    `got ${JSON.stringify(manifest.skills)}`,
  );
}

async function testCoexistsWithNgBootstrap() {
  console.log(
    '\n=== sync-skills alone (--companions=false) leaves @open-rlb/ng-bootstrap alone ===',
  );
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  // What ng-bootstrap's own sync leaves behind in the same folder. None of it is ours to touch.
  const ngBootstrapSkills = ['date-tz', 'rlb-components', 'rlb-modals'];
  tree.create(
    '/.claude/skills/.rlb-skills.json',
    JSON.stringify(
      { package: '@open-rlb/ng-bootstrap', version: '3.3.46', skills: ngBootstrapSkills },
      null,
      2,
    ),
  );
  for (const name of ngBootstrapSkills) {
    tree.create(`/.claude/skills/${name}/SKILL.md`, `# ${name} from ng-bootstrap`);
  }

  // Fan-out disabled, so this isolates OUR sync: it must not read, write, or prune anything
  // outside the folders our own manifest claims. (Fan-out is covered separately below, where
  // ng-bootstrap's schematic legitimately refreshes its own files.)
  const result = await runner.runSchematic('sync-skills', { companions: false }, tree);

  console.log('\n--- .claude/skills after sync ---');
  console.log(result.files.filter(f => f.startsWith('/.claude/skills')).join('\n') || '(none)');

  console.log('\n--- assertions ---');
  check(
    "ng-bootstrap's skills all survived",
    ngBootstrapSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
  );
  check(
    "ng-bootstrap's skill content untouched",
    ngBootstrapSkills.every(
      name =>
        result.readContent(`/.claude/skills/${name}/SKILL.md`) === `# ${name} from ng-bootstrap`,
    ),
  );
  check(
    "ng-bootstrap's manifest untouched",
    JSON.stringify(JSON.parse(result.readContent('/.claude/skills/.rlb-skills.json')).skills) ===
      JSON.stringify(ngBootstrapSkills),
  );
  check(
    'our manifest written separately',
    result.files.includes('/.claude/skills/.rlb-skills.ng-app.json'),
  );
  check(
    'no companion skills delivered when --companions=false',
    !companionSkills.some(
      name =>
        !ngBootstrapSkills.includes(name) &&
        result.files.includes(`/.claude/skills/${name}/SKILL.md`),
    ),
  );
}

async function testFansOutToNgBootstrap() {
  console.log('\n=== sync-skills delegates to @open-rlb/ng-bootstrap ===');
  if (!companionInstalled) {
    console.log('  (skipped — @open-rlb/ng-bootstrap is not installed)');
    return;
  }

  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  const result = await runner.runSchematic('sync-skills', {}, tree);

  console.log('\n--- .claude/skills after sync ---');
  console.log(result.files.filter(f => f.startsWith('/.claude/skills')).join('\n') || '(none)');

  console.log('\n--- assertions ---');
  check(
    'our own skills synced',
    bundledSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
  );
  check(
    "the companion's skills synced too",
    companionSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
    `expected ${companionSkills.join(', ')}`,
  );

  check(
    'the companion wrote its own manifest, not ours',
    result.files.includes('/.claude/skills/.rlb-skills.json'),
  );
  if (result.files.includes('/.claude/skills/.rlb-skills.json')) {
    const theirs = JSON.parse(result.readContent('/.claude/skills/.rlb-skills.json'));
    check('companion manifest names the companion', theirs.package === '@open-rlb/ng-bootstrap');
    check(
      'companion manifest claims exactly its own skills',
      JSON.stringify(theirs.skills.slice().sort()) === JSON.stringify(companionSkills),
      `got ${JSON.stringify(theirs.skills)}`,
    );
  }

  const ours = JSON.parse(result.readContent('/.claude/skills/.rlb-skills.ng-app.json'));
  check(
    'our manifest still claims only our skills',
    JSON.stringify(ours.skills) === JSON.stringify(bundledSkills),
    `got ${JSON.stringify(ours.skills)}`,
  );
}

async function testMissingCompanionIsNonFatal() {
  console.log('\n=== sync-skills survives a companion that is not installed ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  // The companion is resolved from process.cwd(). Running from an empty temp dir outside the
  // workspace makes it unresolvable — the same situation as a consumer without it installed.
  const logged = [];
  const subscription = runner.logger.subscribe(entry => logged.push(entry.message));
  const cwd = process.cwd();
  process.chdir(mkdtempSync(path.join(os.tmpdir(), 'rlb-no-companion-')));
  let result;
  try {
    result = await runner.runSchematic('sync-skills', {}, tree);
  } finally {
    process.chdir(cwd);
    subscription.unsubscribe();
  }

  console.log('\n--- assertions ---');
  check(
    'our own skills synced anyway',
    bundledSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
  );
  check(
    'no companion manifest written',
    !result.files.includes('/.claude/skills/.rlb-skills.json'),
  );
  check(
    'stays quiet about a companion that was never installed',
    !logged.some(line => line.includes('sync-skills schematic')),
    logged.join(' | '),
  );
}

async function testTooOldCompanionIsReported() {
  console.log('\n=== sync-skills reports a companion that predates the schematic ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  // A fabricated node_modules holding an @open-rlb/ng-bootstrap from before sync-skills existed:
  // resolvable, with a schematics collection, but no sync-skills entry in it. Our peer range
  // (^3.0.1) permits exactly this, and silence would leave the consumer without its 7 skills and
  // without a clue why.
  const root = mkdtempSync(path.join(os.tmpdir(), 'rlb-old-companion-'));
  const pkgDir = path.join(root, 'node_modules', '@open-rlb', 'ng-bootstrap');
  mkdirSync(path.join(pkgDir, 'schematics'), { recursive: true });
  writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({
      name: '@open-rlb/ng-bootstrap',
      version: '3.1.0',
      schematics: './schematics/collection.json',
    }),
  );
  writeFileSync(
    path.join(pkgDir, 'schematics', 'collection.json'),
    JSON.stringify({ schematics: { 'ng-add': { factory: './ng-add/index#ngAdd' } } }),
  );

  const logged = [];
  const subscription = runner.logger.subscribe(entry => logged.push(entry.message));
  const cwd = process.cwd();
  process.chdir(root);
  let result;
  try {
    result = await runner.runSchematic('sync-skills', {}, tree);
  } finally {
    process.chdir(cwd);
    subscription.unsubscribe();
  }

  console.log('\n--- assertions ---');
  check(
    'our own skills synced anyway',
    bundledSkills.every(name => result.files.includes(`/.claude/skills/${name}/SKILL.md`)),
  );
  check(
    'no companion manifest written',
    !result.files.includes('/.claude/skills/.rlb-skills.json'),
  );

  const notice = logged.find(line => line.includes('ships no sync-skills schematic'));
  console.log(`  logged: ${notice ?? '(nothing)'}`);
  check('the too-old companion is reported', Boolean(notice), logged.join(' | '));
  check(
    'the notice names the installed version',
    Boolean(notice && notice.includes('3.1.0')),
    notice,
  );
  check(
    'the notice says how to fix it',
    logged.some(line => line.includes('Upgrade @open-rlb/ng-bootstrap')),
    logged.join(' | '),
  );
}

async function testSyncSkillsRespectsSkipEnv() {
  console.log('\n=== sync-skills honours RLB_SKIP_SKILL_SYNC ===');
  const runner = new SchematicTestRunner('open-rlb', collection);
  const tree = appTree({ name: 'demo', version: '0.0.0', dependencies: {}, devDependencies: {} });

  process.env.RLB_SKIP_SKILL_SYNC = '1';
  try {
    const result = await runner.runSchematic('sync-skills', {}, tree);
    check(
      'nothing written to .claude/skills',
      !result.files.some(f => f.startsWith('/.claude/skills')),
    );
  } finally {
    delete process.env.RLB_SKIP_SKILL_SYNC;
  }
}

(async () => {
  console.log(`Bundled skills: ${bundledSkills.join(', ')}`);
  console.log(
    `Companion skills (@open-rlb/ng-bootstrap): ${companionSkills.join(', ') || '(not installed)'}`,
  );
  await testNgAdd();
  await testCustomName();
  await testRefusesExistingProject();
  await testAppendsToExistingPostinstall();
  await testAbsorbsCompanionPostinstall();
  await testGroupsExistingPostinstallWithOr();
  await testSyncSkillsPrunes();
  await testCoexistsWithNgBootstrap();
  await testFansOutToNgBootstrap();
  await testMissingCompanionIsNonFatal();
  await testTooOldCompanionIsReported();
  await testSyncSkillsRespectsSkipEnv();

  if (failures > 0) {
    console.error(`\n✗ ${failures} assertion(s) failed.`);
    process.exit(1);
  }
  console.log('\n✓ All schematic assertions passed.');
})().catch(err => {
  console.error('SCHEMATIC FAILED:\n', err);
  process.exit(1);
});
