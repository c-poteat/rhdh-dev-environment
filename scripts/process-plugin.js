#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('path');
const processed_yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const pluginFolder = process.argv[2];

if (!pluginFolder) {
  console.error('❌ Usage: node scripts/process-plugin.js <plugin-folder>');
  process.exit(1);
}

const pluginPath = path.join(ROOT, 'plugins', pluginFolder);
const outputPath = path.join(ROOT, 'processed');

console.log(`\n=== Processing plugin: ${pluginFolder} ===`);

// --------------------------------------------------------
// Validate plugin folder and package.json
// --------------------------------------------------------
if (!fs.existsSync(pluginPath) || !fs.existsSync(path.join(pluginPath, 'package.json'))) {
  console.error(`❌ Plugin folder or package.json not found at ${pluginPath}`);
  process.exit(1);
}

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

// --------------------------------------------------------
// Read plugin metadata
// --------------------------------------------------------
const pkg = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf-8'));
const pluginType = pkg.backstage?.role || 'unknown';

console.log(`📦 Plugin Name: ${pkg.name}`);
console.log(`🔹 Plugin Type: ${pluginType}`);

// --------------------------------------------------------
// Copy tsconfig template for the plugin
// --------------------------------------------------------
const templateFile =
  pluginType === 'frontend-plugin'
    ? path.join(ROOT, 'tsconfigs', 'tsconfig.frontend.json')
    : path.join(ROOT, 'tsconfigs', 'tsconfig.backend.json');

const tsconfigPath = path.join(pluginPath, 'tsconfig.json');

let tsconfigContent = fs.readFileSync(templateFile, 'utf-8');
tsconfigContent = tsconfigContent.replace(/__PLUGIN_NAME__/g, pluginFolder);
fs.writeFileSync(tsconfigPath, tsconfigContent);

console.log(`📄 Copied tsconfig template → ${tsconfigPath}`);

// --------------------------------------------------------
// Compile plugin with TypeScript
// --------------------------------------------------------
console.log(`\n🛠️ Compiling ${pluginFolder} with tsc...\n`);
try {
  execSync('npx tsc -p tsconfig.json --listEmittedFiles', {
    cwd: pluginPath,
    stdio: 'inherit',
  });
  console.log(`✅ Compilation completed successfully for ${pluginFolder}`);
} catch (error) {
  console.warn(`\n⚠️ WARNING: TypeScript compilation had errors for ${pluginFolder}, continuing...\n`);
  console.warn('⚠️ Please review the TypeScript errors above.\n');
}

// --------------------------------------------------------
// Export plugin with RHDH CLI
// --------------------------------------------------------
console.log(`\n🚀 Exporting ${pluginType} plugin...\n`);

if (pluginType === 'frontend-plugin') {
  // Frontend plugin export
  execSync('npx @red-hat-developer-hub/cli@latest plugin export', {
    cwd: pluginPath,
    stdio: 'inherit',
  });
} else if (
  pluginType === 'backend-plugin' ||
  pluginType === 'backend-plugin-module' ||
  pluginType === 'scaffolder-backend-module'
  ) {
  // Backend plugin export with shared & embedded handling
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
    ...pkg.peerDependencies,
  };

  const packagesToEmbed = [pkg.name];
  Object.keys(allDeps || {}).forEach(dep => {
    if (!dep.startsWith('@backstage/') && !dep.startsWith('@types/')) {
      packagesToEmbed.push(dep);
    }
  });

  const embedFlags = [...new Set(packagesToEmbed)]
    .map(p => `--embed-package "${p}"`)
    .join(' ');

  execSync(
    `npx @red-hat-developer-hub/cli@latest plugin export --shared-package "!@backstage/*" ${embedFlags}`,
    { cwd: pluginPath, stdio: 'inherit' }
  );
} else {
  console.error('❌ Unknown plugin type. Must be "frontend-plugin" or "backend-plugin".');
  process.exit(1);
}

// --------------------------------------------------------
// Package plugin tarball
// --------------------------------------------------------
console.log(`\n📦 Packaging plugin into .tgz...\n`);
const packResult = execSync(
  `npm pack --pack-destination "${outputPath}" --json`,
  {
    cwd: path.join(pluginPath, 'dist-dynamic'),
    encoding: 'utf-8',
  }
);

const info = JSON.parse(packResult)[0];
const baseName = info.filename.replace(/-\d[\w.-]*\.tgz$/, '.tgz');
const originalFile = path.join(outputPath, info.filename);
const renamedFile = path.join(outputPath, baseName);

if (originalFile !== renamedFile) {
  fs.renameSync(originalFile, renamedFile);
}

// --------------------------------------------------------
// Save metadata for CI/CD pipelines
// --------------------------------------------------------
const metadata = {
  plugin: pkg.name,
  filename: baseName,
  filepath: renamedFile,
  integrity: info.integrity,
  size: info.size,
  processed_at: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || 'local',
};

const ymlFile = path.join(outputPath, baseName.replace('.tgz', '.yml'));
fs.writeFileSync(ymlFile, processed_yaml.dump(metadata));

console.log(`\n✅ Packed plugin: ${renamedFile}`);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `metadata_json<<EOF\n${JSON.stringify(metadata)}\nEOF\n`
  );
}

console.log(`\n🎉 Plugin ${pluginFolder} successfully processed!\n`);












// PREVIOUS WORKING CODE
// #!/usr/bin/env node
// 'use strict';

// const { execSync } = require('node:child_process');
// const fs = require('node:fs');
// const path = require('path');
// const processed_yaml = require('js-yaml');

// const ROOT = path.resolve(__dirname, '..');
// const pluginFolder = process.argv[2];

// if (!pluginFolder) {
//   console.error('❌ Usage: node scripts/process-plugin.js <plugin-folder>');
//   process.exit(1);
// }

// const pluginPath = path.join(ROOT, 'plugins', pluginFolder);
// const outputPath = path.join(ROOT, 'processed');

// console.log(`\n=== Processing plugin: ${pluginFolder} ===`);

// // Validate that plugin folder and package.json exist
// if (!fs.existsSync(pluginPath) || !fs.existsSync(path.join(pluginPath, 'package.json'))) {
//   console.error('❌ Plugin not found or missing package.json');
//   process.exit(1);
// }

// if (!fs.existsSync(outputPath)) {
//   fs.mkdirSync(outputPath, { recursive: true });
// }

// try {
//   // ================================================================
//   // Read plugin metadata
//   // ================================================================
//   const pkg = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf-8'));
//   const pluginType = pkg.backstage?.role || 'unknown';

//   console.log(`📦 Plugin Name: ${pkg.name}`);
//   console.log(`🔹 Plugin Type: ${pluginType}`);

//   // ================================================================
//   // Copy tsconfig template and replace __PLUGIN_NAME__
//   // ================================================================
//   const templateFile = pluginType === 'frontend-plugin'
//     ? path.join(ROOT, 'tsconfigs', 'tsconfig.frontend.json')
//     : path.join(ROOT, 'tsconfigs', 'tsconfig.backend.json');

//   const tsconfigPath = path.join(pluginPath, 'tsconfig.json');
//   let tsconfigContent = fs.readFileSync(templateFile, 'utf-8');
//   tsconfigContent = tsconfigContent.replace(/__PLUGIN_NAME__/g, pluginFolder);
//   fs.writeFileSync(tsconfigPath, tsconfigContent);

//   console.log(`📄 Copied tsconfig template → ${tsconfigPath}`);

//   // ================================================================
//   // Symlink @types for correct type resolution
//   // ================================================================
//   const pluginTypesPath = path.join(pluginPath, 'node_modules', '@types');
//   const rootTypesPath = path.join(ROOT, 'node_modules', '@types');

//   if (!fs.existsSync(pluginTypesPath)) {
//     fs.mkdirSync(path.dirname(pluginTypesPath), { recursive: true });
//     try {
//       fs.symlinkSync(rootTypesPath, pluginTypesPath, 'junction');
//       console.log(`🔗 Symlink created: ${pluginTypesPath} -> ${rootTypesPath}`);
//     } catch {
//       console.log('⚠️ Symlink failed, copying @types instead...');
//       execSync(`cp -r "${rootTypesPath}" "${pluginTypesPath}"`);
//     }
//   }

//   // ================================================================
//   // Compile plugin with detailed output
//   // ================================================================
//   // console.log(`\n🛠️ Compiling ${pluginFolder} with tsc...\n`);
//   // execSync('npx tsc -p tsconfig.json --listEmittedFiles || true', {
//   //   cwd: pluginPath,
//   //   stdio: 'inherit',
//   // });

//   try {
//     execSync('npx tsc -p tsconfig.json --listEmittedFiles', {
//       cwd: pluginPath,
//       stdio: 'inherit',
//     });
//     console.log(`✅ Compilation completed successfully for ${pluginFolder}`);
//   } catch (error) {
//     console.warn(`\n⚠️ WARNING: TypeScript compilation had errors for ${pluginFolder}, but continuing...\n`);
//     console.warn(
//       `⚠️ Some types may be incomplete or incorrect. Please review the TypeScript errors above.\n`
//     );
//   }

//   // ================================================================
//   // Verify generated declaration files
//   // ================================================================
//   const expectedTypesDir = path.join(ROOT, 'dist-types', 'plugins', pluginFolder);
//   console.log(`\n🔍 Listing files generated for ${pluginFolder}...`);

//   if (fs.existsSync(expectedTypesDir)) {
//     const files = execSync(`ls -R ${expectedTypesDir}`, { encoding: 'utf-8' });
//     console.log(`🌍 Files under ${expectedTypesDir}:\n${files}`);
//   } else {
//     console.error(`❌ Expected output directory not found: ${expectedTypesDir}`);
//     console.log(`\n🌍 Full contents of dist-types:`);
//     const fullDistTypes = execSync(`ls -R ${path.join(ROOT, 'dist-types')}`, { encoding: 'utf-8' });
//     console.log(fullDistTypes);
//     throw new Error(`Declaration files were not generated at ${expectedTypesDir}`);
//   }

//   // ================================================================
//   // Export plugin with RHDH CLI
//   // ================================================================
//   console.log(`\n🚀 Exporting ${pluginType} plugin...\n`);
//   if (pluginType === 'frontend-plugin') {
//     execSync('npx @red-hat-developer-hub/cli@latest plugin export', {
//       cwd: pluginPath,
//       stdio: 'inherit',
//     });
//   } else if (pluginType === 'backend-plugin') {
//     const allDeps = {
//       ...pkg.dependencies,
//       ...pkg.devDependencies,
//       ...pkg.peerDependencies,
//     };

//     const packagesToEmbed = [pkg.name];
//     Object.keys(allDeps || {}).forEach(dep => {
//       if (!dep.startsWith('@backstage/') && !dep.startsWith('@types/')) {
//         packagesToEmbed.push(dep);
//       }
//     });

//     const embedFlags = [...new Set(packagesToEmbed)]
//       .map(p => `--embed-package "${p}"`)
//       .join(' ');

//     execSync(
//       `npx @red-hat-developer-hub/cli@latest plugin export --shared-package "!@backstage/*" ${embedFlags}`,
//       { cwd: pluginPath, stdio: 'inherit' }
//     );
//   }

//   // ================================================================
//   // Package plugin tarball
//   // ================================================================
//   const packResult = execSync('npm pack --pack-destination "' + outputPath + '" --json', {
//     cwd: path.join(pluginPath, 'dist-dynamic'),
//     encoding: 'utf-8',
//   });

//   const info = JSON.parse(packResult)[0];
//   const baseName = info.filename.replace(/-\d[\w.-]*\.tgz$/, '.tgz');
//   const originalFile = path.join(outputPath, info.filename);
//   const renamedFile = path.join(outputPath, baseName);

//   if (originalFile !== renamedFile) {
//     fs.renameSync(originalFile, renamedFile);
//   }

//   // ================================================================
//   // Save metadata for deployment pipeline
//   // ================================================================
//   const metadata = {
//     plugin: pkg.name,
//     filename: baseName,
//     filepath: renamedFile,
//     integrity: info.integrity,
//     size: info.size,
//     processed_at: new Date().toISOString(),
//     commit: process.env.GITHUB_SHA || 'local',
//   };

//   const ymlFile = path.join(outputPath, baseName.replace('.tgz', '.yml'));
//   fs.writeFileSync(ymlFile, processed_yaml.dump(metadata));

//   console.log(`\n✅ Packed plugin: ${renamedFile}`);

//   if (process.env.GITHUB_OUTPUT) {
//     fs.appendFileSync(
//       process.env.GITHUB_OUTPUT,
//       `metadata_json<<EOF\n${JSON.stringify(metadata)}\nEOF\n`
//     );
//   }
// } catch (error) {
//   console.error('\n❌ Error processing plugin:', error.message);
//   process.exit(1);
// }
