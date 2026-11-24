import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { Bob } from '../../Community/Motion';
import FastImage from '../../../components/common/FastImage';
import { resolveImageUrl } from '../../../hooks/useDiscovery';
import { HealthPhotoViewer } from './HealthPhotoViewer';
import { documentTypeLabel } from '../../../hooks/usePetHealth';
import { API_BASE_URL, API_ENDPOINTS } from '../../../services/api/apiList';
import { getItem, STORAGE_KEYS } from '../../../services/storage/storage';

// The image request for one stored file. The API sends only IDs, and the bytes need the Bearer
// token, so the picture is requested with an Authorization header (the website's browser session
// does not carry over to the app).
export const healthFileSource = (petId, recordId, fileId, token) => ({
  uri: `${API_BASE_URL}${API_ENDPOINTS.PET_HEALTH_RECORD_FILE(
    petId,
    recordId,
    fileId,
  )}?variant=processed`,
  ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
});

// The source photos attached to each record: a file that carries its own web address uses it,
// otherwise it is loaded from the record and file IDs
export const bookPages = (records = [], petId, token) =>
  records.flatMap(record => {
    const files = record?.files || record?.pages || record?.documents || [];
    const title = record?.recordName || record?.name || documentTypeLabel(record?.documentType);
    return (Array.isArray(files) ? files : [])
      .map((file, index) => {
        const url = resolveImageUrl(
          file?.url || file?.fileUrl || file?.file_url || file?.imageUrl || file?.image_url || '',
        );
        const fileId = file?.id ?? file?.fileId ?? file?.file_id;
        const key = `${record?.id ?? title}-${fileId ?? index}`;
        const fileName = file?.fileName || file?.originalName || file?.filename || file?.name || '';
        if (url) {
          return { key, source: { uri: url }, title, record, fileName, recordId: record?.id, fileId };
        }
        if (petId && record?.id && fileId) {
          return {
            key,
            source: healthFileSource(petId, record.id, fileId, token),
            title,
            record,
            fileName,
            recordId: record.id,
            fileId,
          };
        }
        return null;
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

const notAdded = value => (value ? String(value) : 'Not added');
const day = value => (value ? String(value).slice(0, 10) : '');

// What the website shows beside the page: the record the photo belongs to
const RecordDetails = ({ record, isDarkMode }) => {
  const rows = [
    ['Vaccine', record?.recordName || record?.name],
    ['Given', day(record?.dateIssued)],
    ['Next due', day(record?.nextDueDate)],
    ['Clinic', record?.clinicName || record?.vetName],
    ['Document type', documentTypeLabel(record?.documentType)],
  ];
  return (
    <View style={[styles.details, isDarkMode && styles.detailsDark]} testID="health-page-details">
      <Text style={[styles.detailsTitle, isDarkMode && styles.textWhite]}>Health record</Text>
      <Text style={[styles.detailsSub, isDarkMode && styles.mutedDark]}>
        Review the photographed page before relying on extracted details.
      </Text>
      {rows.map(([label, value], index) => (
        <View
          key={label}
          style={[
            styles.detailRow,
            index === rows.length - 1 && styles.detailRowLast,
            isDarkMode && styles.detailRowDark,
          ]}>
          <Text style={[styles.detailLabel, isDarkMode && styles.mutedDark]}>{label}</Text>
          <Text style={[styles.detailValue, isDarkMode && styles.textWhite]}>
            {notAdded(value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

// One page at a time, like the website: Previous / Next, the big photo, its record and a strip of
// thumbnails to jump between pages
const PageViewer = ({ pages, isDarkMode, onRemovePage }) => {
  const [index, setIndex] = useState(0);
  const [turns, setTurns] = useState({}); // quarter turns per page key
  const [fullScreen, setFullScreen] = useState(false);
  const last = pages.length - 1;
  const current = pages[Math.min(index, last)];
  const quarter = turns[current.key] || 0;

  // Pages can disappear (a record is removed): keep the index inside the list
  useEffect(() => {
    if (index > last) {
      setIndex(last);
    }
  }, [index, last]);

  return (
    <View>
      <View style={styles.pager}>
        <Pressable
          testID="health-page-prev"
          accessibilityRole="button"
          accessibilityState={{ disabled: index === 0 }}
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
          style={[styles.navBtn, index === 0 && styles.navBtnOff, isDarkMode && styles.navBtnDark]}>
          <Ionicons name="chevron-back" size={ms(14)} color="#7C3AED" />
          <Text style={styles.navText}>Previous</Text>
        </Pressable>
        <Text style={[styles.pageCount, isDarkMode && styles.textWhite]} testID="health-page-count">
          {`Page ${index + 1} of ${pages.length}`}
        </Text>
        <Pressable
          testID="health-page-next"
          accessibilityRole="button"
          accessibilityState={{ disabled: index === last }}
          disabled={index === last}
          onPress={() => setIndex(index + 1)}
          style={[
            styles.navBtn,
            index === last && styles.navBtnOff,
            isDarkMode && styles.navBtnDark,
          ]}>
          <Text style={styles.navText}>Next</Text>
          <Ionicons name="chevron-forward" size={ms(14)} color="#7C3AED" />
        </Pressable>
      </View>

      <View style={[styles.viewer, isDarkMode && styles.viewerDark]}>
        <View style={[styles.viewerHead, isDarkMode && styles.dividerDark]}>
          <Text style={[styles.fileName, isDarkMode && styles.textWhite]} numberOfLines={1}>
            {current.fileName || `Page ${index + 1}`}
          </Text>
          <Text style={[styles.original, isDarkMode && styles.mutedDark]}>Stored original</Text>
        </View>
        <View style={[styles.stage, isDarkMode && styles.stageDark]}>
          <Pressable
            testID="health-page-open"
            accessibilityRole="button"
            accessibilityLabel="View page full screen"
            onPress={() => setFullScreen(true)}
            style={styles.stageTap}>
            {/* Every page stays mounted and only the current one is visible, so changing page
                never reloads a picture or flashes its placeholder */}
            <View style={styles.stageImage}>
              {pages.map((page, i) => {
                const pageSideways = (turns[page.key] || 0) % 2 === 1;
                return (
                  <View
                    key={page.key}
                    testID={i === index ? 'health-page-image' : undefined}
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { opacity: i === index ? 1 : 0 },
                      {
                        transform: [
                          { rotate: `${(turns[page.key] || 0) * 90}deg` },
                          { scale: pageSideways ? 0.78 : 1 },
                        ],
                      },
                    ]}>
                    <FastImage source={page.source} style={styles.stageFill} resizeMode="contain" />
                  </View>
                );
              })}
            </View>
            <View style={styles.expand} pointerEvents="none">
              <Ionicons name="expand-outline" size={ms(14)} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
        <View style={[styles.viewerFoot, isDarkMode && styles.dividerDark]}>
          <Pressable
            testID="health-page-rotate"
            accessibilityRole="button"
            accessibilityLabel="Rotate page"
            onPress={() => setTurns(old => ({ ...old, [current.key]: (quarter + 1) % 4 }))}
            style={styles.rotate}>
            <Ionicons name="refresh" size={ms(15)} color="#4C1D95" />
            <Text style={styles.rotateText}>Rotate</Text>
          </Pressable>
        </View>
      </View>

      <HealthPhotoViewer
        visible={fullScreen}
        pages={pages}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setFullScreen(false)}
      />

      <RecordDetails record={current.record} isDarkMode={isDarkMode} />

      {onRemovePage && current.fileId && current.recordId ? (
        <Pressable
          testID="health-page-remove"
          accessibilityRole="button"
          accessibilityLabel="Remove page"
          onPress={() => onRemovePage(current)}
          style={[styles.remove, styles.removeSingle, isDarkMode && styles.removeDark]}>
          <Ionicons name="trash-outline" size={ms(15)} color="#B42318" />
          <Text style={styles.removeText}>Remove page</Text>
        </Pressable>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbs}>
        {pages.map((page, i) => (
          <Pressable
            key={page.key}
            testID={`health-thumb-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Page ${i + 1}`}
            onPress={() => setIndex(i)}
            style={[styles.thumb, i === index && styles.thumbOn, isDarkMode && styles.thumbDark]}>
            <FastImage source={page.source} style={styles.thumbImage} resizeMode="cover" />
            <Text style={[styles.thumbLabel, isDarkMode && styles.mutedDark]}>{`Page ${i + 1}`}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

// "Health records book": every source page in one place, or a friendly empty state
export const HealthBook = ({ records, petId, isDarkMode, onAddPhotos, onRemovePage }) => {
  const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
  // Same page objects between renders, so a picture is not treated as a new one
  const pages = useMemo(() => bookPages(records, petId, token), [records, petId, token]);

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
          <PageViewer pages={pages} isDarkMode={isDarkMode} onRemovePage={onRemovePage} />
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
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s(14) },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
    paddingHorizontal: s(10),
    paddingVertical: vs(7),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  navBtnDark: { backgroundColor: '#27104B', borderColor: '#2E1654' },
  navBtnOff: { opacity: 0.45 },
  navText: { fontSize: s(12.5), color: '#7C3AED', fontFamily: theme.typography.fontFamily.bold },
  pageCount: { fontSize: s(12.5), color: '#475569', fontFamily: theme.typography.fontFamily.bold },
  viewer: {
    marginHorizontal: s(14),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  viewerDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  viewerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
    padding: s(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fileName: { flex: 1, fontSize: s(11.5), color: '#0F172A', fontFamily: theme.typography.fontFamily.bold },
  original: { fontSize: s(11), color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
  stage: { backgroundColor: '#F3F0FA', padding: s(14), alignItems: 'center' },
  stageDark: { backgroundColor: '#27104B' },
  stageImage: { width: '100%', aspectRatio: 0.78, borderRadius: s(10), overflow: 'hidden' },
  stageTap: { width: '100%' },
  expand: {
    position: 'absolute',
    right: s(8),
    bottom: s(8),
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,7,29,0.55)',
  },
  stageFill: { width: '100%', height: '100%' },
  viewerFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: s(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rotate: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  rotateText: { fontSize: s(12.5), color: '#4C1D95', fontFamily: theme.typography.fontFamily.bold },
  details: {
    margin: s(14),
    marginBottom: 0,
    padding: s(16),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  detailsDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  detailsTitle: { fontSize: s(17), color: '#0F172A', fontFamily: theme.typography.fontFamily.extraBold },
  detailsSub: {
    marginTop: vs(4),
    marginBottom: vs(6),
    fontSize: s(12),
    lineHeight: s(17),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(10),
    paddingVertical: vs(9),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowDark: { borderBottomColor: '#2E1654' },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: s(12.5), color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: s(12.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  removeSingle: { alignSelf: 'flex-start', marginHorizontal: s(14), marginTop: vs(12) },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(14),
    paddingVertical: vs(9),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#FCCACA',
    backgroundColor: '#FEF3F2',
  },
  removeDark: { backgroundColor: '#3A1220', borderColor: '#7A2531' },
  removeText: { fontSize: s(12.5), color: '#B42318', fontFamily: theme.typography.fontFamily.bold },
  thumbs: { gap: s(10), padding: s(14) },
  thumb: {
    width: s(78),
    borderRadius: s(12),
    borderWidth: 2,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  thumbDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  thumbOn: { borderColor: '#7C3AED' },
  thumbImage: { width: '100%', height: s(72) },
  thumbLabel: {
    paddingVertical: vs(4),
    textAlign: 'center',
    fontSize: s(10.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.bold,
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
