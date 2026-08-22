const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const keystorePath = path.join(__dirname, 'release.keystore');

console.log('--- Bedtime Stories Local AAB Builder ---');

// 1. Ensure prebuild has run
console.log('Ensuring Android project is prebuilt...');
try {
  execSync('npx expo prebuild --platform android', { stdio: 'inherit' });
} catch (e) {
  console.error('Prebuild failed.');
  process.exit(1);
}

// 2. Inject Signing Config into build.gradle
if (fs.existsSync(buildGradlePath)) {
  console.log('Injecting release signing configuration...');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  // Replace default release signing (which uses debug key) with our release key logic
  if (buildGradle.includes('signingConfig signingConfigs.debug') && !buildGradle.includes('signingConfigs.release')) {
    const signingConfigReplacement = `
        release {
            storeFile file("../../release.keystore")
            storePassword "saanjh123"
            keyAlias "saanjh-key"
            keyPassword "saanjh123"
        }
    `;
    
    // Add release block to signingConfigs
    buildGradle = buildGradle.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {${signingConfigReplacement}`
    );

    // Update buildTypes.release to use the new signing config
    buildGradle = buildGradle.replace(
      /release\s*\{\s*signingConfig signingConfigs\.debug/g,
      `release {\n            signingConfig signingConfigs.release`
    );

    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('Injected release configuration into build.gradle.');
  } else {
    console.log('Signing configuration already present or build.gradle format unexpected.');
  }
} else {
  console.error('android/app/build.gradle not found! Prebuild must have failed.');
  process.exit(1);
}

// 3. Build the AAB
console.log('Building Android App Bundle...');
try {
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  execSync(`cd android && ${gradleCmd} bundleRelease`, { stdio: 'inherit' });
  
  console.log('\n======================================================');
  console.log('✅ BUILD SUCCESSFUL!');
  console.log('Your signed AAB is located at:');
  console.log(path.join(__dirname, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'));
  console.log('======================================================\n');
} catch (e) {
  console.error('Failed to build AAB.');
  process.exit(1);
}
