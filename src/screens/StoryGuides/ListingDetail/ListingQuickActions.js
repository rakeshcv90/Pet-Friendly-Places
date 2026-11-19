import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { styles } from './styles';

/** Save + Share, like the website's "Get in touch" row (call / website live in the bottom bar). */
export const ListingQuickActions = ({ saved, onToggleSave, onShare, palette }) => {
  const pop = useRef(new Animated.Value(1)).current;

  // the heart pops when a listing gets saved
  useEffect(() => {
    if (saved) {
      pop.setValue(0.55);
      Animated.spring(pop, {
        toValue: 1,
        friction: 3,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [saved, pop]);

  return (
    <View style={styles.actionRow}>
      <BouncyPressable
        testID="listing-save-button"
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove from saved' : 'Save for later'}
        style={[
          styles.actionTile,
          {
            backgroundColor: saved ? palette.soft : palette.card,
            borderColor: saved ? palette.accent : palette.border,
          },
        ]}
        activeScale={0.95}
        onPress={onToggleSave}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={ms(18)}
            color={saved ? '#E11D48' : palette.accent}
          />
        </Animated.View>
        <Text style={[styles.actionText, { color: palette.text }]}>
          {saved ? 'Saved' : 'Save for later'}
        </Text>
      </BouncyPressable>

      <BouncyPressable
        testID="listing-share-button"
        accessibilityRole="button"
        accessibilityLabel="Share listing"
        style={[styles.actionTile, { backgroundColor: palette.card, borderColor: palette.border }]}
        activeScale={0.95}
        onPress={onShare}>
        <Ionicons name="share-social-outline" size={ms(18)} color={palette.accent} />
        <Text style={[styles.actionText, { color: palette.text }]}>Share</Text>
      </BouncyPressable>
    </View>
  );
};
