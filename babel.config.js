module.exports = function(api) {
  try {
    api.cache.using(() => require('fs').readFileSync('.env', 'utf8'));
  } catch {
    api.cache.never();
  }
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
