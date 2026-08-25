const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  // Fallback if git is unavailable
}

const packageJsonPath = path.join(__dirname, '../package.json');
let version = '1.0.0';

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.version && packageJson.version !== '0.0.0') {
    version = packageJson.version;
  }
}

const versionInfo = {
  version: version,
  commitHash: commitHash,
  buildTime: new Date().toISOString()
};

const targetPath = path.join(__dirname, '../public/version.json');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, JSON.stringify(versionInfo, null, 2));

console.log(`[generate-version] Wrote version ${versionInfo.version} (${versionInfo.commitHash}) to public/version.json`);
