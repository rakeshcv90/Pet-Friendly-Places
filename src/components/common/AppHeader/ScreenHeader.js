import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { AppHeader } from './index';

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
          <LinearGradient
            colors={['#8A2DE2', '#EE2A7B', '#FF7A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.backBadge}
            testID={testID}
            accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={ms(24)} color="#FFFFFF" />
          </LinearGradient>
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
});
