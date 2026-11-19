import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s } from 'react-native-size-matters';
import { Shine } from './Motion';

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const SIZE = s(50);
const EDGE = s(10);
const TAP_SLOP = 6;

// Small round floating button that can be dragged anywhere on the screen. A short touch is a tap,
// and on release it settles against the nearest side edge so it never covers the content.
// `minY` / `maxY` keep it clear of the header and the tab bar.
export const DraggableFab = ({
  label,
  icon = 'chatbubble-ellipses',
  badge = '?',
  onPress,
  minY = 0,
  bottomGap = 0,
}) => {
  const { width, height } = useWindowDimensions();
  const maxX = width - SIZE - EDGE;
  const maxY = height - SIZE - bottomGap;

  const pos = useRef(new Animated.ValueXY({ x: maxX, y: maxY - s(10) })).current;
  const rest = useRef({ x: maxX, y: maxY - s(10) });
  const enter = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const bounds = useRef({ maxX, maxY, minY });
  bounds.current = { maxX, maxY, minY };

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 6,
      tension: 90,
      delay: 500,
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, ring]);

  // Every animation here uses the native driver, so a value is never switched between drivers.
  // The resting position is tracked in a ref because a natively-animated value cannot be read back.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pos.stopAnimation();
          pos.setOffset(rest.current);
          pos.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          pos.flattenOffset();
          if (Math.abs(g.dx) < TAP_SLOP && Math.abs(g.dy) < TAP_SLOP) {
            rest.current = { x: rest.current.x, y: rest.current.y };
            pos.setValue(rest.current);
            onPressRef.current?.();
            return;
          }
          const b = bounds.current;
          const x = Math.min(Math.max(rest.current.x + g.dx, EDGE), b.maxX);
          const y = Math.min(Math.max(rest.current.y + g.dy, b.minY), b.maxY);
          const target = { x: x + SIZE / 2 > (b.maxX + EDGE + SIZE) / 2 ? b.maxX : EDGE, y };
          rest.current = target;
          Animated.spring(pos, {
            toValue: target,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }).start();
        },
      }),
    [pos],
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onAccessibilityTap={onPress}
      style={[styles.wrap, { transform: pos.getTranslateTransform() }]}>
      {/* Native-driven entrance lives on its own node: one node cannot mix JS and native drivers */}
      <Animated.View
        style={{
          opacity: enter,
          transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [
                { scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) },
              ],
            },
          ]}
        />
        <View style={styles.rim}>
          <LinearGradient
            colors={[PINK, PURPLE, '#4A12B0']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.fab}>
            <View pointerEvents="none" style={styles.gloss} />
            <Ionicons name={icon} size={s(23)} color="#FFFFFF" />
            <Shine travel={SIZE} />
          </LinearGradient>
        </View>
        <View pointerEvents="none" style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE },
  ring: { ...StyleSheet.absoluteFillObject, borderRadius: SIZE / 2, backgroundColor: PINK },
  rim: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    padding: s(3),
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: PURPLE,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fab: {
    flex: 1,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: s(5),
    right: s(5),
    height: '48%',
    borderBottomLeftRadius: SIZE,
    borderBottomRightRadius: SIZE,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badge: {
    position: 'absolute',
    top: -s(2),
    right: -s(2),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#FFC53D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: s(11), fontWeight: '900', color: '#4A12B0', marginTop: -1 },
});
