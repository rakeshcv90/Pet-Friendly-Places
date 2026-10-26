import React from 'react';
import { StyleSheet, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { useStore } from '../../../store';

export const ScreenContainer = ({ children, style, edges = ['top'] }) => {
  const isDarkMode = useStore(state => state.isDarkMode);

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.container,
        isDarkMode && styles.containerDark,
        style,
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : theme.colors.background}
      />
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  inner: {
    flex: 1,
  },
});
