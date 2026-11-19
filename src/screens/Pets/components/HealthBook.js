import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { Bob } from '../../Community/Motion';
import FastImage from '../../../components/common/FastImage';
import { resolveImageUrl } from '../../../hooks/useDiscovery';
import { documentTypeLabel } from '../../../hooks/usePetHealth';

// The source photos attached to each record, whichever field name the API used
export const bookPages = (records = []) =>
  records.flatMap(record => {
    const files = record?.files || record?.pages || record?.documents || [];
    const title = record?.recordName || record?.name || documentTypeLabel(record?.documentType);
    return (Array.isArray(files) ? files : [])
      .map((file, index) => {
        const url = resolveImageUrl(
          file?.url || file?.fileUrl || file?.file_url || file?.imageUrl || file?.image_url || '',
        );
        return url ? { key: `${record?.id ?? title}-${file?.id ?? index}`, url, title } : null;
      })
      .filter(Boolean);
  });

// Three stacked pages with a soft glow behind them, floating gently
const PageStack = ({ isDarkMode }) => (
  <View style={styles.stackWrap}>
    <View style={[styles.glow, isDarkMode && styles.glowDark]} />
    <Bob distance={s(5)} duration={2400}>
      <View style={styles.stack}>
        <LinearGradient colors={['#C4B5FD', '#A78BFA']} style={[styles.sheet, styles.sheetBack]} />
        <LinearGradient colors={['#DDD6FE', '#C4B5FD']} style={[styles.sheet, styles.sheetMid]} />
        <LinearGradient colors={['#FFFFFF', '#F5F3FF']} style={[styles.sheet, styles.sheetFront]}>
          <Ionicons name="document-text" size={ms(30)} color="#7C3AED" />
          <View style={styles.line} />
          <View style={[styles.line, styles.lineShort]} />
        </LinearGradient>
        <LinearGradient colors={['#F472B6', '#7C3AED']} style={styles.badge}>
          <Ionicons name="add" size={ms(16)} color="#FFFFFF" />
        </LinearGradient>
      </View>
    </Bob>
  </View>
);

const STEPS = [
  { icon: 'camera-outline', title: 'Snap', text: 'One page per photo' },
  { icon: 'sparkles-outline', title: 'We read it', text: 'Details filled in for you' },
  { icon: 'share-social-outline', title: 'Share', text: 'A link for 24 hours' },
];

// "Health records book": every source page in one place, or a friendly empty state
export const HealthBook = ({ records, isDarkMode, onAddPhotos }) => {
  const pages = bookPages(records);

  return (
    <View>
      <View style={[styles.card, isDarkMode && styles.cardDark]} testID="health-book">
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>
            {pages.length > 0
              ? `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`
              : 'No pages yet'}
          </Text>
          <View style={[styles.chip, isDarkMode && styles.chipDark]}>
            <Ionicons name="lock-closed" size={ms(10)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
            <Text style={[styles.chipText, isDarkMode && styles.chipTextDark]}>Private</Text>
          </View>
        </View>
        <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

        {pages.length === 0 ? (
          <View style={styles.empty}>
            <PageStack isDarkMode={isDarkMode} />
            <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
              No source pages yet. Add a clear photo from the health-record editor.
            </Text>
            {onAddPhotos ? (
              <BouncyPressable
                testID="health-book-add"
                activeScale={0.95}
                onPress={onAddPhotos}
                style={styles.cta}>
                <LinearGradient
                  colors={['#7C3AED', '#4C1D95']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaFill}>
                  <Ionicons name="cloud-upload-outline" size={ms(16)} color="#FFFFFF" />
                  <Text style={styles.ctaText}>Add photos</Text>
                </LinearGradient>
              </BouncyPressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.grid}>
            {pages.map(page => (
              <View key={page.key} style={styles.page}>
                <FastImage
                  source={{ uri: page.url }}
                  style={[styles.pageImage, isDarkMode && styles.pageImageDark]}
                  resizeMode="cover"
                />
                <Text style={[styles.pageTitle, isDarkMode && styles.mutedDark]} numberOfLines={1}>
                  {page.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {pages.length === 0 ? (
        <View style={styles.steps} testID="health-steps">
          {STEPS.map(step => (
            <View key={step.title} style={[styles.step, isDarkMode && styles.stepDark]}>
              <View style={[styles.stepIcon, isDarkMode && styles.stepIconDark]}>
                <Ionicons
                  name={step.icon}
                  size={ms(16)}
                  color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                />
              </View>
              <Text style={[styles.stepTitle, isDarkMode && styles.textWhite]}>{step.title}</Text>
              <Text style={[styles.stepText, isDarkMode && styles.mutedDark]}>{step.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
    overflow: 'hidden',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    padding: s(16),
    fontSize: s(17),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginRight: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    backgroundColor: '#F5F3FF',
  },
  chipDark: { backgroundColor: '#27104B' },
  chipText: {
    fontSize: s(10.5),
    color: '#7C3AED',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  chipTextDark: { color: '#C4B5FD' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  dividerDark: { backgroundColor: '#2E1654' },
  empty: {
    alignItems: 'center',
    paddingTop: vs(26),
    paddingBottom: vs(24),
    paddingHorizontal: s(24),
  },
  emptyText: {
    marginTop: vs(12),
    textAlign: 'center',
    fontSize: s(13),
    lineHeight: s(19),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10), padding: s(14) },
  page: { width: '47.5%' },
  pageImage: { width: '100%', aspectRatio: 0.78, borderRadius: s(14), backgroundColor: '#F5F3FF' },
  pageImageDark: { backgroundColor: '#27104B' },
  pageTitle: {
    marginTop: vs(6),
    fontSize: s(11.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  stackWrap: { alignItems: 'center', justifyContent: 'center', width: s(150), height: s(120) },
  glow: {
    position: 'absolute',
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: 'rgba(124,58,237,0.14)',
  },
  glowDark: { backgroundColor: 'rgba(167,139,250,0.2)' },
  stack: { width: s(84), height: s(100), alignItems: 'center', justifyContent: 'center' },
  sheet: {
    position: 'absolute',
    width: s(72),
    height: s(92),
    borderRadius: s(14),
    shadowColor: '#4C1D95',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sheetBack: { transform: [{ rotate: '-10deg' }, { translateX: -s(8) }] },
  sheetMid: { transform: [{ rotate: '7deg' }, { translateX: s(7) }] },
  sheetFront: { alignItems: 'center', justifyContent: 'center', gap: s(5) },
  line: { width: s(36), height: s(4), borderRadius: s(2), backgroundColor: '#DDD6FE' },
  lineShort: { width: s(24) },
  badge: {
    position: 'absolute',
    right: -s(4),
    bottom: s(2),
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cta: { marginTop: vs(16), borderRadius: s(16), overflow: 'hidden' },
  ctaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(22),
    paddingVertical: vs(11),
  },
  ctaText: { fontSize: s(13.5), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  steps: { flexDirection: 'row', gap: s(8), marginHorizontal: s(16), marginTop: vs(14) },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(6),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
  },
  stepDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  stepIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  stepIconDark: { backgroundColor: '#27104B' },
  stepTitle: {
    marginTop: vs(6),
    fontSize: s(12),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  stepText: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: s(10.5),
    lineHeight: s(14),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
