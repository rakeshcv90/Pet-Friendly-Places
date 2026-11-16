import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { usePawsport, uploadPetPhoto, usePetMedia, uploadPetMedia } from '../../hooks/useUser';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Enter } from '../Community/Motion';
import { PetHero, DEEP_PURPLE } from './components/PetHero';
import { UploadingOverlay } from './components/UploadingOverlay';
import { ModernConfirmModal } from '../Profile/components/ModernConfirmModal';
import {
  STAMP_GOAL,
  speciesEmoji,
  petName,
  petSpecies,
  petStamps,
  petSubtitle,
  petPhoto,
} from './petUtils';

const GOLD = '#E0B84A';

// A pet's Pawsport: profile summary, tier rank, the passport book and adventures
export const PawsportScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const pet = route?.params?.pet || {};
  const name = petName(pet);
  const queryClient = useQueryClient();
  const { data: pawsport } = usePawsport(pet.slug);

  // Profile photo (POST /pets/{id}/photo). The new photo shows straight away, before the list reloads.
  // Adventures gallery: photos and videos load separately, each with a moderation status
  const photosQuery = usePetMedia(pet.id, 'photo');
  const videosQuery = usePetMedia(pet.id, 'video');
  const [mediaUploading, setMediaUploading] = useState(false);
  // Result message, shown in the app's own modal instead of a system alert
  const [notice, setNotice] = useState({ visible: false });
  const showNotice = (type, title, subtitle, badge) =>
    setNotice({ visible: true, type, title, subtitle, badge });
  const adventures = useMemo(
    () =>
      [
        ...(photosQuery.data || []).map(item => ({ ...item, isVideo: false })),
        ...(videosQuery.data || []).map(item => ({ ...item, isVideo: true })),
      ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [photosQuery.data, videosQuery.data],
  );

  const addAdventure = () => {
    if (mediaUploading || !pet.id) {
      return;
    }
    launchImageLibrary(
      { mediaType: 'mixed', quality: 0.85, selectionLimit: 1, maxWidth: 1600, maxHeight: 1600 },
      async response => {
        const asset = response?.assets?.[0];
        if (response?.errorCode) {
          Alert.alert('Upload', response.errorMessage || 'Unable to open your library.');
          return;
        }
        if (!asset?.uri) {
          return;
        }
        setMediaUploading(true);
        const result = await uploadPetMedia(pet.id, asset);
        setMediaUploading(false);
        if (result.ok) {
          queryClient.invalidateQueries({ queryKey: ['pet', 'media', pet.id] });
          const isVideo = /^video/i.test(asset.type || '');
          showNotice(
            'success',
            isVideo ? 'Video uploaded! 🎬' : 'Photo uploaded! 📸',
            isVideo
              ? `${name}'s video was uploaded and will show once it has been processed.`
              : `${name}'s photo was uploaded and will show once it has been reviewed.`,
            'ADVENTURES',
          );
        } else {
          const reason =
            result.status === 401
              ? 'Your session has expired. Please sign in again.'
              : result.status === 403 || result.status === 404
              ? `This pet could not be found on your account (${result.status}). ${result.message}`
              : result.status === 0
              ? 'Could not reach the server. Please check your connection.'
              : `Server said ${result.status}. ${result.message}`;
          showNotice('danger', 'Could not upload', reason.trim(), 'UPLOAD FAILED');
        }
      },
    );
  };

  const [localPhoto, setLocalPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const photo = localPhoto || petPhoto(pet);

  const changePhoto = () => {
    if (uploading) {
      return;
    }
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.85, selectionLimit: 1, maxWidth: 1600, maxHeight: 1600 },
      async response => {
        const asset = response?.assets?.[0];
        if (response?.errorCode) {
          Alert.alert('Photo', response.errorMessage || 'Unable to open your photos.');
          return;
        }
        if (!asset?.uri || !pet.id) {
          return;
        }
        setUploading(true);
        const ok = await uploadPetPhoto(pet.id, asset);
        setUploading(false);
        if (ok) {
          setLocalPhoto(asset.uri);
          queryClient.invalidateQueries({ queryKey: ['user', 'pets'] });
        } else {
          showNotice(
            'danger',
            'Could not upload photo',
            'Please check your connection and try again.',
            'UPLOAD FAILED',
          );
        }
      },
    );
  };
  const [pageIndex, setPageIndex] = useState(0);

  // The server's own totals win over whatever the pet list carried
  const stampList = useMemo(
    () => (Array.isArray(pawsport?.stamps) ? pawsport.stamps : []),
    [pawsport],
  );
  const stamps =
    Number(pawsport?.stampTotal ?? pawsport?.totalStamps ?? pawsport?.stampCount) ||
    stampList.length ||
    petStamps(pet);
  const placesCount =
    Number(pawsport?.distinctPlaces ?? pawsport?.placeCount ?? pawsport?.distinctPlaceCount) ||
    new Set(stampList.map(stamp => stamp.placeName || stamp.listingName || stamp.name)).size;
  const pageCount = Math.max(1, Math.ceil(stampList.length / 4));
  const pageStamps = stampList.slice(pageIndex * 4, pageIndex * 4 + 4);
  const points = Number(pet.points ?? pet.pawpoints ?? 0) || 0;
  const progress = Math.min(1, points / STAMP_GOAL);
  const card = [styles.card, isDarkMode && styles.cardDark];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(32) }}>
        <PetHero
          title={`${name}'s Pawsport`}
          subtitle="Stamps, rank and adventures from every trip."
          backLabel="🐾 My pets"
          onBack={() => navigation.goBack()}
        />

        {/* Profile */}
        <Enter index={0}>
          <View style={card}>
            <View style={styles.profileTop}>
              <BouncyPressable
                testID="pawsport-change-photo"
                accessibilityLabel="Change profile photo"
                style={styles.avatar}
                activeScale={0.94}
                onPress={changePhoto}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatarPhoto} />
                ) : (
                  <Text style={styles.avatarEmoji}>{speciesEmoji(petSpecies(pet))}</Text>
                )}
                <View style={styles.avatarCamera}>
                  <Ionicons name="camera" size={ms(11)} color="#FFFFFF" />
                </View>
              </BouncyPressable>
              <View style={styles.profileText}>
                <Text style={[styles.name, isDarkMode && styles.textWhite]}>{name}</Text>
                <Text style={[styles.meta, isDarkMode && styles.mutedDark]} numberOfLines={1}>
                  {[petSubtitle(pet), pet.bio].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              {[
                { value: stamps, label: '🥇 stamps' },
                { value: placesCount, label: '📍 places' },
                { value: pet.followers ?? 0, label: '🐾 followers' },
              ].map(stat => (
                <View key={stat.label} style={styles.stat}>
                  <Text style={[styles.statValue, isDarkMode && styles.textWhite]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode && styles.mutedDark]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Enter>

        {/* Tier rank */}
        <Enter index={1}>
          <LinearGradient
            colors={['#5B21B6', '#7B2CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tier}>
            <View style={styles.tierTop}>
              <View style={styles.tierIcon}>
                <Text style={styles.tierEmoji}>🐾</Text>
              </View>
              <View style={styles.tierText}>
                <Text style={styles.tierEyebrow}>TIER RANK</Text>
                <Text style={styles.tierName}>Paw Wanderer</Text>
                <Text style={styles.tierSub}>{points} pawpoints</Text>
              </View>
              <View style={styles.tierNext}>
                <Text style={styles.tierNextText}>{Math.max(STAMP_GOAL - points, 0)} pts</Text>
                <Text style={styles.tierNextSub}>to Tail Hopper</Text>
              </View>
            </View>
            <View style={styles.tierTrack}>
              <View style={[styles.tierFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.tierLabels}>
              <Text style={styles.tierLabel}>{points} pts</Text>
              <Text style={styles.tierLabel}>{Math.round(progress * 100)}% to Tail Hopper</Text>
              <Text style={styles.tierLabel}>{STAMP_GOAL} pts</Text>
            </View>
          </LinearGradient>
        </Enter>

        {/* Passport book */}
        <Enter index={2}>
          <View style={[styles.bookWrap, isDarkMode && styles.bookWrapDark]}>
            <Text style={styles.bookLabel}>PAWSPORT — PLACES VISITED</Text>
            <View style={styles.book}>
              <LinearGradient colors={['#2F55AE', '#14295E']} style={styles.cover}>
                <View style={styles.coverFrame}>
                  <Text style={styles.coverTop}>TRAVELLING TAILS · INDIA</Text>
                  <View style={styles.coverEmblem}>
                    <Text style={styles.coverEmoji}>{speciesEmoji(petSpecies(pet))}</Text>
                  </View>
                  <Text style={styles.coverTitle}>PAWSPORT</Text>
                  <Text style={styles.coverDoc}>PET TRAVEL DOCUMENT</Text>
                  <Text style={styles.coverName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.coverBreed} numberOfLines={1}>
                    {(pet.breed || petSpecies(pet) || '').toUpperCase()}
                  </Text>
                  <Text style={styles.coverQuote}>
                    “Nose to the window, paws on the road, home is wherever we go together.”
                  </Text>
                </View>
              </LinearGradient>
              <View style={styles.page}>
                <Text style={styles.pageLabel}>PLACES VISITED</Text>
                <View style={styles.slots}>
                  {[0, 1, 2, 3].map(slot => {
                    const stamp = pageStamps[slot];
                    return (
                      <View key={slot} style={[styles.slot, stamp && styles.slotFilled]}>
                        {stamp && (
                          <>
                            <Text style={styles.stampMark}>🐾</Text>
                            <Text style={styles.stampPlace} numberOfLines={2}>
                              {stamp.placeName || stamp.listingName || stamp.name || 'Stamp'}
                            </Text>
                            {!!stamp.city && (
                              <Text style={styles.stampCity} numberOfLines={1}>
                                {stamp.city}
                              </Text>
                            )}
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.pageHint}>
                  {stampList.length
                    ? `${stamps} stamps collected`
                    : 'Your first stamp is waiting 🐾'}
                </Text>
                <View style={styles.pageNo}>
                  <Text style={styles.pageNoText}>Page {pageIndex + 1}</Text>
                </View>
              </View>
            </View>
            <View style={styles.bookNav}>
              <BouncyPressable
                testID="pawsport-prev"
                style={[styles.navBtn, pageIndex === 0 && styles.navBtnOff]}
                activeScale={0.94}
                onPress={() => setPageIndex(index => Math.max(0, index - 1))}>
                <Text style={[styles.navText, pageIndex > 0 && styles.navTextOn]}>Previous</Text>
              </BouncyPressable>
              <BouncyPressable
                testID="pawsport-next"
                style={[styles.navBtn, pageIndex >= pageCount - 1 && styles.navBtnOff]}
                activeScale={0.94}
                onPress={() => setPageIndex(index => Math.min(pageCount - 1, index + 1))}>
                <Text style={[styles.navText, pageIndex < pageCount - 1 && styles.navTextOn]}>
                  Next
                </Text>
              </BouncyPressable>
            </View>
          </View>
        </Enter>

        {/* Adventures */}
        <Enter index={3}>
          <View style={card}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>📸 Adventures</Text>
            <Text style={[styles.meta, isDarkMode && styles.mutedDark]}>
              {photosQuery.data?.length || 0} photos · {videosQuery.data?.length || 0} videos
            </Text>

            {adventures.length > 0 ? (
              <View style={styles.grid}>
                {adventures.map(item => {
                  const uri = resolveImageUrl(
                    item.thumbnailUrl || item.thumbnail_url || item.url || item.mediaUrl || '',
                  );
                  const pending =
                    item.status && !/^(approved|published|active|ready)$/i.test(item.status);
                  return (
                    <View key={`${item.isVideo ? 'v' : 'p'}-${item.id}`} style={styles.tile}>
                      {uri ? (
                        <Image source={{ uri }} style={styles.tileImage} />
                      ) : (
                        <View style={[styles.tileImage, styles.tileEmpty]}>
                          <Ionicons name="image-outline" size={ms(22)} color="#A78BFA" />
                        </View>
                      )}
                      {item.isVideo && (
                        <View style={styles.tilePlay}>
                          <Ionicons name="play" size={ms(14)} color="#FFFFFF" />
                        </View>
                      )}
                      {pending && (
                        <View style={styles.tileStatus}>
                          <Text style={styles.tileStatusText} numberOfLines={1}>
                            {String(item.status).replace(/_/g, ' ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.adventureEmpty}>
                <Text style={styles.adventureEmoji}>📷</Text>
                <Text style={[styles.meta, isDarkMode && styles.mutedDark]}>
                  Add your first adventure photo!
                </Text>
              </View>
            )}

            <BouncyPressable
              testID="pawsport-upload"
              style={styles.upload}
              activeScale={0.94}
              onPress={addAdventure}>
              <Ionicons name="cloud-upload-outline" size={ms(15)} color="#FFFFFF" />
              <Text style={styles.uploadText}>
                {mediaUploading ? 'Uploading…' : 'Upload photo or video'}
              </Text>
            </BouncyPressable>
          </View>
        </Enter>
      </ScrollView>

      <UploadingOverlay
        visible={mediaUploading || uploading}
        label={uploading ? 'Updating photo…' : 'Uploading…'}
        isDarkMode={isDarkMode}
      />
      <ModernConfirmModal
        visible={!!notice.visible}
        onClose={() => setNotice(prev => ({ ...prev, visible: false }))}
        onConfirm={null}
        title={notice.title}
        subtitle={notice.subtitle}
        badge={notice.badge}
        type={notice.type}
        confirmText="Got it"
        cancelText="Close"
        singleButton
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#0F071D' },
  card: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    backgroundColor: '#EDE9FE',
    borderWidth: 2.5,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: s(26) },
  avatarPhoto: { width: '100%', height: '100%', borderRadius: s(26) },
  avatarCamera: {
    position: 'absolute',
    right: -s(4),
    bottom: -s(4),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, marginLeft: s(12) },
  name: { fontSize: s(19), color: '#0F172A', fontFamily: theme.typography.fontFamily.extraBold },
  meta: { fontSize: s(12), color: '#64748B', fontFamily: theme.typography.fontFamily.medium },
  statsRow: { flexDirection: 'row', marginTop: vs(14) },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: s(18),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  statLabel: {
    marginTop: vs(1),
    fontSize: s(10.5),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  tier: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(16),
    borderRadius: s(22),
    borderBottomWidth: 4,
    borderBottomColor: '#3B108F',
  },
  tierTop: { flexDirection: 'row', alignItems: 'center' },
  tierIcon: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierEmoji: { fontSize: s(22) },
  tierText: { flex: 1, marginLeft: s(12) },
  tierEyebrow: {
    fontSize: ms(9),
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  tierName: {
    fontSize: s(17),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  tierSub: {
    fontSize: s(11),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  tierNext: {
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tierNextText: { fontSize: s(12), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  tierNextSub: {
    fontSize: s(9.5),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  tierTrack: {
    height: vs(7),
    borderRadius: s(5),
    marginTop: vs(14),
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  tierFill: { height: '100%', borderRadius: s(5), backgroundColor: '#FBCFE8' },
  tierLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: vs(6) },
  tierLabel: {
    fontSize: s(10),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  bookWrap: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(14),
    borderRadius: s(22),
    backgroundColor: '#EEEAE0',
    alignItems: 'center',
  },
  bookWrapDark: { backgroundColor: '#1F1A2E' },
  bookLabel: {
    fontSize: ms(9),
    letterSpacing: 1.6,
    color: '#8A8578',
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: vs(10),
  },
  book: {
    flexDirection: 'row',
    width: '100%',
    height: vs(230),
    borderRadius: s(6),
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cover: { flex: 1, padding: s(6) },
  coverFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(6),
    borderWidth: 1,
    borderColor: 'rgba(224,184,74,0.55)',
  },
  coverTop: {
    fontSize: ms(6.5),
    letterSpacing: 1,
    color: GOLD,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  coverEmblem: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    marginVertical: vs(6),
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: s(18) },
  coverTitle: {
    fontSize: ms(10),
    letterSpacing: 2,
    color: GOLD,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  coverDoc: {
    fontSize: ms(5.5),
    letterSpacing: 0.8,
    color: 'rgba(224,184,74,0.7)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  coverName: {
    marginTop: vs(8),
    fontSize: ms(10),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  coverBreed: {
    fontSize: ms(5.5),
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  coverQuote: {
    marginTop: vs(8),
    fontSize: ms(6.5),
    lineHeight: ms(9),
    textAlign: 'center',
    fontStyle: 'italic',
    color: GOLD,
  },
  page: { flex: 1.05, backgroundColor: '#FBF7EA', padding: s(8) },
  pageLabel: {
    fontSize: ms(6),
    letterSpacing: 1.2,
    color: '#B8B09C',
    fontFamily: theme.typography.fontFamily.bold,
  },
  slots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginTop: vs(6), gap: s(4) },
  slot: {
    width: '48%',
    height: '47%',
    borderRadius: s(4),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9B9F0',
    backgroundColor: '#F7F3FF',
  },
  pageHint: {
    marginTop: vs(6),
    textAlign: 'center',
    fontSize: ms(7.5),
    fontStyle: 'italic',
    color: '#8B8576',
  },
  pageNo: {
    alignSelf: 'flex-end',
    marginTop: vs(4),
    paddingHorizontal: s(5),
    paddingVertical: vs(2),
    borderRadius: s(4),
    borderWidth: 1,
    borderColor: '#E4DDC8',
  },
  pageNoText: { fontSize: ms(6), color: '#B8B09C' },
  bookNav: { flexDirection: 'row', gap: s(10), marginTop: vs(12) },
  navBtn: {
    paddingHorizontal: s(18),
    paddingVertical: vs(7),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  navBtnOff: { opacity: 0.6 },
  navTextOn: { color: '#5B21B6' },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: '#A78BFA',
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(3),
  },
  stampMark: { fontSize: s(14) },
  stampPlace: {
    marginTop: vs(2),
    fontSize: ms(6.5),
    textAlign: 'center',
    color: '#4C1D95',
    fontFamily: theme.typography.fontFamily.bold,
  },
  stampCity: {
    fontSize: ms(5.5),
    color: '#7C3AED',
    fontFamily: theme.typography.fontFamily.medium,
  },
  navText: {
    fontSize: s(11.5),
    color: '#A8A296',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: s(15.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: vs(12) },
  tile: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: s(14),
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
  },
  tileImage: { width: '100%', height: '100%' },
  tileEmpty: { alignItems: 'center', justifyContent: 'center' },
  tilePlay: {
    position: 'absolute',
    top: s(6),
    right: s(6),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: 'rgba(15,7,29,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileStatus: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: vs(2),
    backgroundColor: 'rgba(245,158,11,0.92)',
  },
  tileStatusText: {
    textAlign: 'center',
    fontSize: ms(8.5),
    color: '#FFFFFF',
    textTransform: 'capitalize',
    fontFamily: theme.typography.fontFamily.bold,
  },
  adventureEmpty: { alignItems: 'center', paddingVertical: vs(20) },
  adventureEmoji: { fontSize: s(34), marginBottom: vs(6) },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    alignSelf: 'center',
    marginTop: vs(14),
    paddingHorizontal: s(18),
    paddingVertical: vs(10),
    borderRadius: s(20),
    backgroundColor: '#6D28D9',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  uploadText: { fontSize: s(12.5), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
