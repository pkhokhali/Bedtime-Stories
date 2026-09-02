const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const keystorePath = path.join(__dirname, 'release.keystore');

console.log('--- Bedtime Stories Local AAB Builder ---');

// 1. Ensure prebuild has run
console.log('Ensuring Android project is prebuilt...');
try {
  execSync('npx expo prebuild --platform android --clean', { stdio: 'inherit' });
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

    // Update buildTypes.release to use the new signing config safely
    const buildTypesIndex = buildGradle.indexOf('buildTypes {');
    if (buildTypesIndex !== -1) {
      const releaseIndex = buildGradle.indexOf('release {', buildTypesIndex);
      if (releaseIndex !== -1) {
        const debugSignIndex = buildGradle.indexOf('signingConfig signingConfigs.debug', releaseIndex);
        if (debugSignIndex !== -1) {
          buildGradle = buildGradle.substring(0, debugSignIndex) + 'signingConfig signingConfigs.release' + buildGradle.substring(debugSignIndex + 'signingConfig signingConfigs.debug'.length);
        }
      }
    }

    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('Injected release configuration into build.gradle.');
  } else {
    console.log('Signing configuration already present or build.gradle format unexpected.');
  }
} else {
  console.error('android/app/build.gradle not found! Prebuild must have failed.');
  process.exit(1);
}

// 2.5 Ensure local.properties exists with Android SDK path (Windows fix)
const localPropertiesPath = path.join(__dirname, 'android', 'local.properties');
if (!fs.existsSync(localPropertiesPath) && process.platform === 'win32') {
  console.log('Generating local.properties for Windows...');
  const sdkPath = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk').replace(/\\/g, '\\\\');
  fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkPath}\n`);
  console.log(`Set sdk.dir to ${sdkPath}`);
}




// 3. Build the APK
console.log('Building Android APK...');
try {
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  execSync(`cd android && ${gradleCmd} assembleRelease`, { stdio: 'inherit' });
  
  console.log('\n======================================================');
  console.log('✅ APK BUILD SUCCESSFUL!');
  console.log('Your signed APK is located at:');
  console.log(path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'));
  console.log('======================================================\n');
} catch (e) {
  console.error('Failed to build APK.');
  process.exit(1);
}
