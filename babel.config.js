module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        // Values imported from '@env' are inlined into the bundle: public values only.
        allowlist: ['CATALOG_API_URL', 'API_BASE_URL', 'MAPBOX_ACCESS_TOKEN'],
        safe: false,
        allowUndefined: true,
        verbose: false,
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
};
