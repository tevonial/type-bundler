const fs = require('fs');
const path = require('path');
 
// Read root package.json
const rootPackage = require('../package.json');
const tsConfig = require('../tsconfig.json');

const distPath = path.resolve(tsConfig.compilerOptions.outDir);
 
// Define fields to keep in the published package.json
const prunedPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  description: rootPackage.description,
  main: 'index.js',                  // Path to compiled entry (in dist/)
  types: 'index.d.ts',               // TypeScript types (if using TS)
  keywords: rootPackage.keywords,
  author: rootPackage.author,
  license: rootPackage.license,
  repository: rootPackage.repository,
  bugs: rootPackage.bugs,
  homepage: rootPackage.homepage,
  dependencies: rootPackage.dependencies
};
 
// Write pruned package.json to dist/
const distPackagePath = path.join(distPath, 'package.json');
fs.writeFileSync(distPackagePath, JSON.stringify(prunedPackage, null, 2));
console.log(`Pruned package.json and copied to: ${distPath}`);