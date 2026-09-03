const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to inject -Xskip-metadata-version-check into Kotlin compile tasks.
 * This fixes binary metadata incompatibility where Google Play Services Ads (25.4.0)
 * metadata is compiled with Kotlin 2.3.0 while the project uses Kotlin 2.1/2.3 compiler.
 */
module.exports = function withSkipKotlinMetadataCheck(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const snippet = `
allprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
  }
}
`;
    if (!buildGradle.includes('-Xskip-metadata-version-check')) {
      config.modResults.contents = buildGradle + snippet;
    }
    return config;
  });
};
