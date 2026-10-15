import { Dimensions, Platform, StatusBar } from 'react-native';
import { s } from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');
const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

export const dimensions = {
  window: {
    width,
    height,
  },
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  isSmallDevice: width < 375,
  borderRadius: {
    small: s(4),
    medium: s(8),
    large: s(16),
    xlarge: s(24),
    round: 9999,
  },
  icon: {
    small: s(16),
    medium: s(24),
    large: s(32),
    xlarge: s(48),
  },
  headerHeight: Platform.OS === 'ios' ? s(44) : s(56),
  statusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
};
