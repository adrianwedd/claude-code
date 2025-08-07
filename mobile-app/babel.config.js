module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['module-resolver', {
      root: ['./src'],
      extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
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
    }],
  ],
};