// audit-imports.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { builtinModules } = require('module');

const projectRoot = process.cwd();
const pkg = require(path.join(projectRoot, 'package.json'));
const allDeps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

const isBuiltin = (mod) => builtinModules.includes(mod) || mod.startsWith('node:');

const extractImports = (content) => {
  const importRegex = /(?:import|require)\s+(?:.*?from\s+)?'"['"]/g;
  const matches = [];
  let match;
  while ((match = importRegex.exec(content))) {
    matches.push(match[1]);
  }
  return matches;
};

const getTopLevelPackage = (name) => {
  if (name.startsWith('.') || path.isAbsolute(name)) return null;
  return name.split('/')[0].startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
};

const files = glob.sync('**/*.{ts,tsx}', {
  cwd: projectRoot,
  ignore: ['node_modules/**', 'dist/**', 'build/**'],
});

const usedPackages = new Set();

files.forEach((file) => {
  const content = fs.readFileSync(path.join(projectRoot, file), 'utf-8');
  const imports = extractImports(content);
  imports.forEach((imp) => {
    const pkg = getTopLevelPackage(imp);
    if (pkg && !isBuiltin(pkg)) {
      usedPackages.add(pkg);
    }
  });
});

const missing = [...usedPackages].filter((pkg) => !allDeps.has(pkg));

console.log('\n🔍 Missing dependencies:');
if (missing.length === 0) {
  console.log('✅ No missing packages found!');
} else {
  missing.forEach((pkg) => console.log(`- ${pkg}`));
}
