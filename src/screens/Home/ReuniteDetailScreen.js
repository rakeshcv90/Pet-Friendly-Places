import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  StatusBar,
  Share,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms, vs } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { styles as shared } from '../StoryGuides/GuideDetail/styles/shared';
import { ListingGallery } from '../StoryGuides/ListingDetail/ListingGallery';
import { PhotoViewer } from '../StoryGuides/ListingDetail/PhotoViewer';
import { SectionCard } from '../StoryGuides/ListingDetail/SectionCard';
import { BAR_HEIGHT } from '../StoryGuides/ListingDetail/ContactBar';
import { listingPalette } from '../StoryGuides/ListingDetail/listingPalette';
import { styles } from '../StoryGuides/ListingDetail/styles';
import { getErrorMessage } from '../../services/api/apiClient';
import { useRevealPhone } from '../../hooks/useReunite';
import { formatDay } from './components/ReunitePostCard';

const font = theme.typography.fontFamily;
const BRAND = ['#3B108F', '#7B2CFF'];

const TYPE_INFO = {
  lost: {
    title: 'Lost',
    gradient: ['#B91C1C', '#EF4444'],
    color: '#D32F2F',
    soft: '#FDECEC',
    softDark: 'rgba(239,68,68,0.16)',
    dateLabel: 'Missing since',
  },
  found: {
    title: 'Found',
    gradient: ['#047857', '#10B981'],
    color: '#059669',
    soft: '#DCFCE7',
    softDark: 'rgba(34,197,94,0.16)',
    dateLabel: 'Found on',
  },
  adopt: {
    title: 'Adoption',
    gradient: ['#5B21B6', '#8B5CF6'],
    color: '#7C3AED',
    soft: '#F3EEFF',
    softDark: 'rgba(168,85,247,0.16)',
    dateLabel: 'Available from',
  },
};

const DETAILS = [
  ['Breed', 'breed', 'ribbon-outline'],
  ['Colour and markings', 'colour', 'color-palette-outline'],
  ['Sex', 'sex', 'male-female-outline'],
  ['Age', 'age', 'time-outline'],
  ['Size', 'size', 'resize-outline'],
  ['Collar', 'collar', 'ellipse-outline'],
  ['Microchip', 'microchip', 'hardware-chip-outline'],
  ['Sterilised', 'sterilised', 'medkit-outline'],
  ['Vaccinated', 'vaccinated', 'shield-checkmark-outline'],
];

const digits = value => String(value || '').replace(/[^\d]/g, '');

// Each section fades and rises into place, one after another
const Rise = ({ index, children }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: 120 + index * 90,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [vs(18), 0] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
};

const GradientFill = ({ colors }) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={local.fill}
    pointerEvents="none"
  />
);

export const ReuniteDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const palette = useMemo(() => listingPalette(isDarkMode), [isDarkMode]);
  const post = useMemo(() => route?.params?.post || {}, [route?.params?.post]);
  const [viewerIndex, setViewerIndex] = useState(null);

  // Posts made on this device already know the number; the rest ask the server for it
  const [phone, setPhone] = useState(post.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const revealPhone = useRevealPhone();
  const caseId = post.caseCode;

  const type = TYPE_INFO[post.type] || TYPE_INFO.lost;
  const species = post.species
    ? post.species.charAt(0).toUpperCase() + post.species.slice(1).replace('_', ' ')
    : 'Pet';
  const day = formatDay(post.eventDate);
  const photos = post.images?.length ? post.images : post.image ? [post.image] : [];
  const canContact = !!phone || !!caseId;
  const topInset = Math.max(insets.top, s(12));

  const facts = [
    ['Species', species, 'paw-outline'],
    ...DETAILS.filter(([, key]) => post[key] && post[key] !== 'Unknown').map(
      ([label, key, icon]) => [label, post[key], icon],
    ),
  ].filter(Boolean);

  const handleShare = useCallback(async () => {
    const lines = [
      `${type.title} ${species.toLowerCase()}${post.name ? `: ${post.name}` : ''}`,
      post.location,
      day && `${type.dateLabel} ${day}`,
      post.caseCode && `Case ${post.caseCode}`,
    ].filter(Boolean);
    try {
      await Share.share({ message: `🐾 ${lines.join('\n')}\nPosted on PetFriendly` });
    } catch (e) {
      // dismissed
    }
  }, [type, species, post, day]);

  const handleShowNumber = () => {
    if (phone || revealPhone.isPending || !caseId) {
      return;
    }
    setPhoneError('');
    revealPhone.mutate(caseId, {
      onSuccess: setPhone,
      onError: err =>
        setPhoneError(err?.isAxiosError ? getErrorMessage(err) : err?.message || getErrorMessage(err)),
    });
  };
  const handleCall = () => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {});
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi, I am contacting you about the ${type.title.toLowerCase()} ${species.toLowerCase()}${
        post.name ? ` ${post.name}` : ''
      } on PetFriendly.`,
    );
    Linking.openURL(`https://wa.me/${digits(phone)}?text=${text}`).catch(() => {});
  };

  const showNumberContent = revealPhone.isPending ? (
    <ActivityIndicator color={phone ? '#FFFFFF' : '#3B108F'} />
  ) : null;

  return (
    <View style={[styles.fill, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Add a Place style header, floating over the photo */}
      <View style={[local.navBar, { paddingTop: topInset }]} pointerEvents="box-none">
        <BouncyPressable
          testID="reunite-detail-back-btn"
          accessibilityRole="button"
          accessibilityLabel="Back"
          activeScale={0.9}
          onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={['#8A2DE2', '#EE2A7B', '#FF7A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={local.backBadge}>
            <Ionicons name="chevron-back" size={ms(24)} color="#FFFFFF" />
          </LinearGradient>
        </BouncyPressable>
        <View style={local.navTitles} pointerEvents="none">
          <Text style={local.navOverline}>REUNITE</Text>
          <Text style={local.navTitle}>Pet details</Text>
        </View>
        <BouncyPressable
          accessibilityRole="button"
          accessibilityLabel="Share this post"
          style={local.shareBtn}
          activeScale={0.9}
          onPress={handleShare}>
          <Ionicons name="share-social-outline" size={ms(18)} color="#FFFFFF" />
        </BouncyPressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BAR_HEIGHT + insets.bottom + vs(28) }}>
        {/* ── Hero: photos with the title on a fade ── */}
        <View>
          <ListingGallery photos={photos} height={vs(300)} onOpen={setViewerIndex} />
          <LinearGradient
            colors={['rgba(15,7,29,0.7)', 'rgba(15,7,29,0)', 'rgba(15,7,29,0.92)']}
            locations={[0, 0.4, 1]}
            style={local.fill}
            pointerEvents="none"
          />
          <View style={local.heroText} pointerEvents="none">
            <View style={local.heroChips}>
              <LinearGradient colors={type.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={local.typePill}>
                <Ionicons name="paw" size={ms(12)} color="#FFFFFF" />
                <Text style={local.typePillText}>{type.title.toUpperCase()}</Text>
              </LinearGradient>
              {!!post.caseCode && (
                <View style={local.glassChip}>
                  <Text style={local.glassChipText}>Case {post.caseCode}</Text>
                </View>
              )}
            </View>
            <Text style={local.heroTitle}>
              {type.title} {species}
            </Text>
            <Text style={local.heroSubtitle} numberOfLines={1}>
              {post.name ? post.name : 'Name unknown'}
              {post.breed ? `  ·  ${post.breed}` : ''}
            </Text>
          </View>
        </View>

        {/* ── Key details in one row ── */}
        <Rise index={0}>
          <View
            style={[
              local.strip,
              shared.card3D,
              styles.headerShadow,
              isDarkMode && shared.card3DDark,
              { backgroundColor: palette.card },
            ]}>
            {!!post.location && (
              <View style={[local.cell, local.cellWide]}>
                <View style={[local.cellIcon, { backgroundColor: palette.soft }]}>
                  <Ionicons name="location-sharp" size={ms(14)} color={palette.accent} />
                </View>
                <Text style={[local.cellLabel, { color: palette.muted }]}>Last seen</Text>
                <Text style={[local.cellValue, { color: palette.text }]} numberOfLines={2}>
                  {post.location}
                </Text>
              </View>
            )}
            {!!day && (
              <>
                <View style={[local.cellDivider, { backgroundColor: palette.border }]} />
                <View style={local.cell}>
                  <View style={[local.cellIcon, { backgroundColor: isDarkMode ? type.softDark : type.soft }]}>
                    <Ionicons name="calendar" size={ms(14)} color={type.color} />
                  </View>
                  <Text style={[local.cellLabel, { color: palette.muted }]}>{type.dateLabel}</Text>
                  <Text style={[local.cellValue, { color: type.color }]}>{day}</Text>
                </View>
              </>
            )}
            {!!post.timeAgo && (
              <>
                <View style={[local.cellDivider, { backgroundColor: palette.border }]} />
                <View style={local.cell}>
                  <View style={[local.cellIcon, { backgroundColor: palette.soft }]}>
                    <Ionicons name="time" size={ms(14)} color={palette.accent} />
                  </View>
                  <Text style={[local.cellLabel, { color: palette.muted }]}>Posted</Text>
                  <Text style={[local.cellValue, { color: palette.text }]}>{post.timeAgo}</Text>
                </View>
              </>
            )}
          </View>
        </Rise>

        {/* ── Contact ── */}
        <Rise index={1}>
          <View style={local.contactCard}>
            <LinearGradient
              colors={['#1B0A45', '#3B108F', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={local.fill}
              pointerEvents="none"
            />
            <View style={local.orbLarge} pointerEvents="none" />
            <View style={local.orbSmall} pointerEvents="none" />

            <View style={local.contactTop}>
              <View style={local.avatarRing}>
                <View style={local.avatar}>
                  <Text style={local.avatarText}>
                    {(post.contactName || '?').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={local.contactTexts}>
                <Text style={local.contactLabel}>POSTED BY</Text>
                <Text style={local.contactName}>{post.contactName || 'Pet parent'}</Text>
              </View>
              <View style={local.protectedBadge}>
                <Ionicons name="shield-checkmark" size={ms(12)} color="#A7F3D0" />
                <Text style={local.protectedText}>Protected</Text>
              </View>
            </View>

            <View style={local.numberPanel}>
              <Ionicons name={phone ? 'call' : 'lock-closed'} size={ms(16)} color="#DDD6FE" />
              <Text style={local.numberText} selectable={!!phone}>
                {phone || '••••• ••••• •••'}
              </Text>
            </View>
            <Text style={local.contactHint}>
              {phone
                ? 'Call or message to arrange a safe meeting.'
                : 'Tap to see the number. We hide numbers from bots that copy them for spam.'}
            </Text>
            {!!phoneError && <Text style={local.contactError}>{phoneError}</Text>}

            <View style={local.buttonRow}>
              <BouncyPressable
                style={local.whiteBtn}
                activeScale={0.96}
                disabled={!canContact}
                onPress={phone ? handleCall : handleShowNumber}>
                {showNumberContent || (
                  <>
                    <Ionicons name={phone ? 'call' : 'eye-outline'} size={ms(16)} color="#3B108F" />
                    <Text style={local.whiteBtnText}>
                      {phone ? 'Call now' : phoneError ? 'Try again' : 'Show number'}
                    </Text>
                  </>
                )}
              </BouncyPressable>
              <BouncyPressable
                style={local.ghostBtn}
                activeScale={0.96}
                onPress={phone ? handleWhatsApp : handleShare}>
                <Ionicons
                  name={phone ? 'logo-whatsapp' : 'share-social-outline'}
                  size={ms(16)}
                  color="#FFFFFF"
                />
                <Text style={local.ghostBtnText}>{phone ? 'WhatsApp' : 'Share'}</Text>
              </BouncyPressable>
            </View>
          </View>
        </Rise>

        {/* ── Quick facts ── */}
        <Rise index={2}>
          <SectionCard title="Quick facts" icon="flash-outline" palette={palette} isDarkMode={isDarkMode}>
            <View style={styles.factGrid}>
              {facts.map(([label, value, icon]) => (
                <View
                  key={label}
                  style={[styles.factTile, local.factTile, { backgroundColor: palette.soft, borderColor: palette.border }]}>
                  <LinearGradient colors={BRAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={local.factIcon}>
                    <Ionicons name={icon} size={ms(14)} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.factTileLabel, { color: palette.muted }]}>{label}</Text>
                  <Text style={[styles.factTileValue, { color: palette.text }]}>{value}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </Rise>

        {!!post.story && (
          <Rise index={3}>
            <SectionCard title="About" icon="document-text-outline" palette={palette} isDarkMode={isDarkMode}>
              <Text style={[styles.bodyText, { color: palette.body }]}>{post.story}</Text>
            </SectionCard>
          </Rise>
        )}

        {/* ── Safety ── */}
        <Rise index={4}>
          <View style={[local.safety, { backgroundColor: palette.warnSoft }]}>
            <View style={[local.safetyIcon, { backgroundColor: palette.card }]}>
              <Ionicons name="shield-checkmark" size={ms(18)} color={palette.warn} />
            </View>
            <View style={local.safetyTexts}>
              <Text style={[local.safetyTitle, { color: palette.warn }]}>Stay safe</Text>
              <Text style={[local.safetyBody, { color: palette.warn }]}>
                Never send money before you see the pet in person. If someone says they found your
                pet, ask them to describe a detail that isn&apos;t in the photos. If anyone asks for
                payment, report this post.
              </Text>
            </View>
          </View>
        </Rise>
      </ScrollView>

      <View
        style={[
          styles.bar,
          { backgroundColor: palette.bar, borderTopColor: palette.border, paddingBottom: insets.bottom + vs(10) },
        ]}>
        <BouncyPressable
          style={styles.primaryBtn}
          activeScale={0.96}
          disabled={!canContact}
          onPress={phone ? handleCall : handleShowNumber}>
          <GradientFill colors={BRAND} />
          {revealPhone.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={phone ? 'call' : 'eye-outline'} size={ms(17)} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{phone ? `Call ${phone}` : 'Show number'}</Text>
            </>
          )}
        </BouncyPressable>
        <BouncyPressable
          accessibilityLabel="Share this post"
          style={[styles.iconBtn, { backgroundColor: palette.soft, borderColor: palette.border }]}
          activeScale={0.9}
          onPress={handleShare}>
          <Ionicons name="share-social-outline" size={ms(19)} color={palette.accent} />
        </BouncyPressable>
      </View>

      <PhotoViewer
        visible={viewerIndex !== null}
        photos={photos}
        startIndex={viewerIndex || 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
};

const local = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
  },
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
  navTitles: { flex: 1, marginLeft: s(14) },
  navOverline: {
    fontSize: ms(10.5),
    fontFamily: font.bold,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.8)',
  },
  navTitle: { marginTop: vs(1), fontSize: ms(18), fontFamily: font.extraBold, color: '#FFFFFF' },
  shareBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,7,29,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  heroText: {
    position: 'absolute',
    left: s(18),
    right: s(18),
    bottom: vs(34),
  },
  heroChips: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8) },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: s(5),
    borderRadius: s(14),
  },
  typePillText: {
    marginLeft: s(5),
    fontSize: ms(11),
    fontFamily: font.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  glassChip: {
    marginLeft: s(8),
    paddingHorizontal: s(11),
    paddingVertical: s(5),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  glassChipText: { fontSize: ms(11), fontFamily: font.semiBold, color: '#FFFFFF' },
  heroTitle: {
    fontSize: ms(30),
    lineHeight: ms(36),
    fontFamily: font.extraBold,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    marginTop: vs(2),
    fontSize: ms(14.5),
    fontFamily: font.semiBold,
    color: 'rgba(255,255,255,0.86)',
  },

  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: s(16),
    marginTop: vs(14),
    paddingVertical: vs(14),
    paddingHorizontal: s(8),
    borderRadius: s(20),
  },
  cell: { flex: 1, alignItems: 'center', paddingHorizontal: s(4) },
  cellWide: { flex: 1.5 },
  cellDivider: { width: StyleSheet.hairlineWidth, marginVertical: vs(4) },
  cellIcon: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
  },
  cellLabel: { fontSize: ms(10.5), fontFamily: font.medium },
  cellValue: {
    marginTop: vs(2),
    fontSize: ms(12.5),
    lineHeight: ms(17),
    textAlign: 'center',
    fontFamily: font.bold,
  },

  contactCard: {
    marginHorizontal: s(16),
    marginTop: vs(16),
    borderRadius: s(24),
    padding: s(18),
    overflow: 'hidden',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  orbLarge: {
    position: 'absolute',
    top: -s(60),
    right: -s(40),
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: -s(40),
    left: -s(30),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: 'rgba(196,173,255,0.12)',
  },
  contactTop: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  avatar: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: ms(19), fontFamily: font.extraBold, color: '#3B108F' },
  contactTexts: { flex: 1 },
  contactLabel: { fontSize: ms(10), fontFamily: font.bold, color: '#C4B5FD', letterSpacing: 1.2 },
  contactName: { marginTop: vs(1), fontSize: ms(17), fontFamily: font.bold, color: '#FFFFFF' },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderRadius: s(12),
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  protectedText: { marginLeft: s(4), fontSize: ms(10.5), fontFamily: font.bold, color: '#A7F3D0' },
  numberPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(16),
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  numberText: {
    marginLeft: s(12),
    fontSize: ms(20),
    letterSpacing: 1.2,
    fontFamily: font.bold,
    color: '#FFFFFF',
  },
  contactHint: {
    marginTop: vs(10),
    fontSize: ms(11.5),
    lineHeight: ms(17),
    fontFamily: font.regular,
    color: 'rgba(255,255,255,0.72)',
  },
  contactError: { marginTop: vs(8), fontSize: ms(12), fontFamily: font.semiBold, color: '#FCA5A5' },
  buttonRow: { flexDirection: 'row', marginTop: vs(16) },
  whiteBtn: {
    flex: 1.15,
    height: vs(46),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBtnText: { marginLeft: s(7), fontSize: ms(14), fontFamily: font.bold, color: '#3B108F' },
  ghostBtn: {
    flex: 1,
    height: vs(46),
    marginLeft: s(10),
    borderRadius: s(14),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { marginLeft: s(7), fontSize: ms(14), fontFamily: font.bold, color: '#FFFFFF' },

  factTile: { borderWidth: 1 },
  factIcon: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },

  safety: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(16),
    borderRadius: s(20),
  },
  safetyIcon: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  safetyTexts: { flex: 1 },
  safetyTitle: { fontSize: ms(14.5), fontFamily: font.bold },
  safetyBody: { marginTop: vs(4), fontSize: ms(12.5), lineHeight: ms(19), fontFamily: font.medium },
});

export default ReuniteDetailScreen;
