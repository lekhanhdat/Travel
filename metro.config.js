/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Gradle/CMake caches change during native builds and are not JS sources.
    blockList: [
      ...(Array.isArray(defaultConfig.resolver.blockList)
        ? defaultConfig.resolver.blockList
        : [defaultConfig.resolver.blockList].filter(Boolean)),
      /[/\\](?:\.gradle|\.cxx)[/\\].*/,
      /[/\\]android[/\\](?:app[/\\])?build[/\\].*/,
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
