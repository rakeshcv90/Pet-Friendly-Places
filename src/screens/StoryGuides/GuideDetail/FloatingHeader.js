import React from 'react';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { styles } from './styles/chrome';

/** Back / share buttons floating over the hero. */
export const FloatingHeader = ({ topInset, onBack, onShare }) => (
  <View style={[styles.floatingHeader, { paddingTop: topInset }]} pointerEvents="box-none">
    <BouncyPressable
      testID="guide-back-button"
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={styles.floatingBtn}
      activeScale={0.88}
      onPress={onBack}>
      <Feather name="arrow-left" size={ms(19)} color="#FFFFFF" />
    </BouncyPressable>

    <View style={styles.floatingActions}>
      <BouncyPressable
        testID="guide-share-button"
        accessibilityRole="button"
        accessibilityLabel="Share guide"
        style={styles.floatingBtn}
        activeScale={0.88}
        onPress={onShare}>
        <Ionicons name="share-social-outline" size={ms(17)} color="#FFFFFF" />
      </BouncyPressable>
    </View>
  </View>
);
