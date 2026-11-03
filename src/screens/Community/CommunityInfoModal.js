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
import { COMMUNITY_INFO_BLOCKS, COMMUNITY_INFO_TITLE } from './communityInfoContent';

const PURPLE = colors.primary;
const DEEP_PURPLE = colors.primaryDark;
const { fontFamily } = theme.typography;

// Same text colours the Community tab uses: deep purple headings, grey body copy
const LIGHT = {
  sheet: '#FAF7F2',
  heading: DEEP_PURPLE,
  body: '#5B5F6B',
  strong: '#1C1C1C',
  card: '#FFFFFF',
  cardBorder: colors.card3D.borderSides,
  cardBottom: colors.card3D.borderBottom,
  line: '#E4DDF3',
  kicker: PURPLE,
  chip: '#F3EBFF',
  calloutText: '#4B5563',
  purple: { bg: '#EFEAFF', bar: PURPLE, title: DEEP_PURPLE, icon: 'bulb' },
  amber: { bg: '#FBF0DD', bar: '#C77A1F', title: '#7A4A0F', icon: 'paw' },
};
const DARK = {
  sheet: colors.dark.background,
  heading: '#FFFFFF',
  body: colors.dark.textSecondary,
  strong: '#FFFFFF',
  card: colors.dark.surface,
  cardBorder: colors.dark.border,
  cardBottom: colors.dark.borderBottom,
  line: colors.dark.border,
  kicker: colors.dark.accentLight,
  chip: '#2A1450',
  calloutText: colors.dark.textSecondary,
  purple: { bg: '#241247', bar: colors.dark.accentLight, title: '#E9D5FF', icon: 'bulb' },
  amber: { bg: '#2E2013', bar: '#F59E0B', title: '#FCD9A0', icon: 'paw' },
};

const Paragraph = ({ parts, c }) => (
  <Text style={[styles.p, { color: c.body }]}>
    {parts.map((part, index) =>
      typeof part === 'string' ? (
        part
      ) : (
        <Text key={index} style={[styles.bold, { color: c.strong }]}>
          {part.b}
        </Text>
      ),
    )}
  </Text>
);

const Faq = ({ block, index, c, open, onToggle }) => (
  <View
    style={[
      styles.faq,
      { backgroundColor: c.card, borderColor: c.cardBorder, borderBottomColor: c.cardBottom },
    ]}>
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={block.q}
      style={styles.faqHead}>
      <View style={[styles.faqNum, { backgroundColor: c.chip }]}>
        <Text style={[styles.faqNumText, { color: c.kicker }]}>{index + 1}</Text>
      </View>
      <Text style={[styles.faqQ, { color: c.heading }]}>{block.q}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={s(16)} color={c.kicker} />
    </Pressable>
    {open ? <Text style={[styles.faqA, { color: c.body }]}>{block.a}</Text> : null}
  </View>
);

const Block = ({ block, c, faqIndex, openFaq, onToggleFaq }) => {
  switch (block.type) {
    case 'h2':
      return (
        <View style={styles.h2Wrap}>
          <Text style={[styles.kicker, { color: c.kicker }]}>{block.kicker}</Text>
          <Text style={[styles.h2, { color: c.heading }]}>{block.text}</Text>
        </View>
      );
    case 'h3':
      return (
        <View style={styles.h3Row}>
          <View style={[styles.h3Bar, { backgroundColor: c.kicker }]} />
          <Text style={[styles.h3, { color: c.heading }]}>{block.text}</Text>
        </View>
      );
    case 'p':
      return <Paragraph parts={block.parts} c={c} />;
    case 'callout': {
      const tone = c[block.tone] || c.purple;
      return (
        <View style={[styles.callout, { backgroundColor: tone.bg, borderLeftColor: tone.bar }]}>
          <View style={styles.calloutHead}>
            <Ionicons name={tone.icon} size={s(14)} color={tone.bar} />
            <Text style={[styles.calloutTitle, { color: tone.title }]}>{block.title}</Text>
          </View>
          <Text style={[styles.calloutText, { color: c.calloutText }]}>{block.text}</Text>
        </View>
      );
    }
    case 'divider':
      return (
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: c.line }]} />
          <Text style={styles.dividerPaw}>🐾</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.line }]} />
        </View>
      );
    case 'faq':
      return (
        <Faq
          block={block}
          index={faqIndex}
          c={c}
          open={openFaq === faqIndex}
          onToggle={() => onToggleFaq(faqIndex)}
        />
      );
    default:
      return null;
  }
};

// Full-height bottom sheet that explains the Community tab
export const CommunityInfoModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const c = isDarkMode ? DARK : LIGHT;
  const slide = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [sizes, setSizes] = useState({ content: 1, view: 1 });
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      scrollY.setValue(0);
      setOpenFaq(0);
      Animated.spring(slide, {
        toValue: 1,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide, scrollY]);

  const range = Math.max(sizes.content - sizes.view, 1);
  let faqCounter = -1;

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
            {COMMUNITY_INFO_BLOCKS.map((block, index) => {
              if (block.type === 'faq') {
                faqCounter += 1;
              }
              return (
                <Block
                  key={index}
                  block={block}
                  c={c}
                  faqIndex={faqCounter}
                  openFaq={openFaq}
                  onToggleFaq={i => setOpenFaq(prev => (prev === i ? -1 : i))}
                />
              );
            })}
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

  h2Wrap: { marginTop: s(4), marginBottom: s(12) },
  kicker: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(10),
    letterSpacing: 1.4,
    marginBottom: s(4),
  },
  h2: { fontFamily: fontFamily.extraBold, fontSize: s(21), lineHeight: s(26), letterSpacing: -0.8 },
  h3Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: s(8),
    marginBottom: s(8),
  },
  h3Bar: { width: s(4), alignSelf: 'stretch', borderRadius: s(2) },
  h3: {
    flex: 1,
    fontFamily: fontFamily.extraBold,
    fontSize: s(14.5),
    lineHeight: s(20),
    letterSpacing: -0.3,
  },
  p: { fontFamily: fontFamily.regular, fontSize: s(12.5), lineHeight: s(21), marginBottom: s(12) },
  bold: { fontFamily: fontFamily.extraBold },

  callout: {
    borderLeftWidth: s(4),
    borderRadius: s(16),
    paddingVertical: s(13),
    paddingHorizontal: s(14),
    marginBottom: s(14),
  },
  calloutHead: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: s(5) },
  calloutTitle: { fontFamily: fontFamily.extraBold, fontSize: s(12.5) },
  calloutText: { fontFamily: fontFamily.regular, fontSize: s(11.5), lineHeight: s(18) },

  divider: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginVertical: s(18) },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerPaw: { fontSize: s(14), opacity: 0.6 },

  faq: {
    borderRadius: s(16),
    borderWidth: 1,
    borderBottomWidth: 3,
    marginBottom: s(10),
    paddingHorizontal: s(12),
    shadowColor: colors.card3D.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: s(10), paddingVertical: s(12) },
  faqNum: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqNumText: { fontFamily: fontFamily.extraBold, fontSize: s(11) },
  faqQ: {
    flex: 1,
    fontFamily: fontFamily.extraBold,
    fontSize: s(12.5),
    lineHeight: s(18),
    letterSpacing: -0.2,
  },
  faqA: {
    fontFamily: fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(20),
    paddingBottom: s(14),
    paddingLeft: s(34),
  },

  cta: { marginHorizontal: s(16), marginTop: s(8), borderRadius: s(16), overflow: 'hidden' },
  ctaFill: { paddingVertical: s(14), alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.extraBold, fontSize: s(14), color: '#FFFFFF' },
});
