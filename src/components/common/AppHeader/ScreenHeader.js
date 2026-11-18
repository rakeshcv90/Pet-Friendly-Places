import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { AppHeader } from './index';
import { useStore } from '../../../store';

// AppHeader for inner screens: the badge on the left is a back arrow, and the search bar, location
// row and bell are hidden. Keeps the same look as the Home, Explore and Saved headers.
export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  rightComponent,
  testID = 'screen-header-back-btn',
}) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  return (
    <View style={{ paddingTop: Math.max(insets.top, s(12)) }}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        showSearch={false}
        showLocation={false}
        showNotification={false}
        rightComponent={rightComponent}
        onAvatarPress={onBack}
        avatarComponent={
          <View
            style={[styles.navSquareBtn, isDarkMode && styles.navSquareBtnDark]}
            testID={testID}
            accessibilityLabel="Back">
            <Ionicons
              name="chevron-back"
              size={ms(19)}
              color={isDarkMode ? '#FFFFFF' : '#1D1238'}
            />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backBadge: {
    width: s(52),
    height: s(52),
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EE2A7B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  navSquareBtn: {
    width: s(42),
    height: s(42),
    borderRadius: s(15),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  navSquareBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
});
