const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
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
    alias: {
      '@': './src',
      '@/components': './src/components',
      '@/screens': './src/screens',
      '@/navigation': './src/navigation',
      '@/services': './src/services',
      '@/hooks': './src/hooks',
      '@/types': './src/types',
      '@/utils': './src/utils',
      '@/constants': './src/constants',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);