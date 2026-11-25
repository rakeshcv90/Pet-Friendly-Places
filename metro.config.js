const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // 'react-native-size-matters' is replaced by a copy that caps the scale on tablets
    // (see src/utils/sizeMatters.js). Phones get exactly the same sizes as before.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-size-matters') {
        return { type: 'sourceFile', filePath: path.resolve(__dirname, 'src/utils/sizeMatters.js') };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
