import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { colors } from '../../theme/colors';
import { useStore } from '../../store';
import { COMMUNITY_INFO_TITLE } from './communityInfoContent';
import { CommunityInfoContent, LIGHT, DARK } from './CommunityAbout';

const PURPLE = colors.primary;
const DEEP_PURPLE = colors.primaryDark;
const { fontFamily } = theme.typography;

// Full-height bottom sheet that explains the Community tab
export const CommunityInfoModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const c = isDarkMode ? DARK : LIGHT;
  const slide = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [sizes, setSizes] = useState({ content: 1, view: 1 });

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      scrollY.setValue(0);
      Animated.spring(slide, {
        toValue: 1,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide, scrollY]);

  const range = Math.max(sizes.content - sizes.view, 1);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close information"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: c.sheet,
              paddingBottom: Math.max(insets.bottom, s(12)),
              transform: [
                { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [s(500), 0] }) },
              ],
            },
          ]}>
          <LinearGradient
            colors={[DEEP_PURPLE, PURPLE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.head}>
            <Text pointerEvents="none" style={styles.watermark}>
              🐾
            </Text>
            <View style={styles.handle} />
            <View style={styles.headRow}>
              <View style={styles.headIcon}>
                <Ionicons name="information" size={s(22)} color="#FFFFFF" />
              </View>
              <View style={styles.headText}>
                <Text style={styles.overline}>TAILS COMMUNITY</Text>
                <Text style={styles.title}>{COMMUNITY_INFO_TITLE}</Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                style={styles.closeBtn}>
                <Ionicons name="close" size={s(18)} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: scrollY.interpolate({
                      inputRange: [0, range],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
          </LinearGradient>

          <Animated.ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onLayout={e => setSizes(prev => ({ ...prev, view: e.nativeEvent.layout.height }))}
            onContentSizeChange={(_, height) => setSizes(prev => ({ ...prev, content: height }))}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false,
            })}>
            <CommunityInfoContent isDarkMode={isDarkMode} />
          </Animated.ScrollView>

          <BouncyPressable onPress={onClose} style={styles.cta}>
            <LinearGradient
              colors={[DEEP_PURPLE, PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaFill}>
              <Text style={styles.ctaText}>Got it</Text>
            </LinearGradient>
          </BouncyPressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,8,48,0.6)' },
  sheet: {
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    height: '92%',
    overflow: 'hidden',
  },

  head: { paddingHorizontal: s(16), paddingTop: s(8), overflow: 'hidden' },
  watermark: { position: 'absolute', right: -s(8), top: s(6), fontSize: s(86), opacity: 0.1 },
  handle: {
    alignSelf: 'center',
    width: s(40),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: s(12),
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: s(12), paddingBottom: s(14) },
  headIcon: {
    width: s(44),
    height: s(44),
    borderRadius: s(15),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  overline: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(9.5),
    letterSpacing: 1.4,
    color: '#E9D5FF',
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(18),
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginTop: s(1),
  },
  closeBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: s(3),
    marginHorizontal: -s(16),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: { height: s(3), backgroundColor: '#FFC53D' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: s(16), paddingTop: s(14), paddingBottom: s(20) },

  cta: { marginHorizontal: s(16), marginTop: s(8), borderRadius: s(16), overflow: 'hidden' },
  ctaFill: { paddingVertical: s(14), alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.extraBold, fontSize: s(14), color: '#FFFFFF' },
});
