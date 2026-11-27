import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, RefreshControl, Modal } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useTransportHub } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from './components/AmbientBackground';

// Dark mode swaps the API's pale verdict colours for readable ones.
const VERDICT_DARK = {
  allowed: '#34D399',
  partial: '#FBBF24',
  not_allowed: '#F87171',
};

// Modes that already have a full guide behind them; everything else shows a coming-soon popup.
const AVAILABLE_MODES = ['trains'];

const ModeCard = ({ mode, isDarkMode, onPress }) => {
  const verdictColor = isDarkMode
    ? VERDICT_DARK[mode.verdict] || '#B9A9D6'
    : mode.verdict_color || '#7C6F91';

  return (
    <BouncyPressable
      style={[styles.modeCard, isDarkMode && styles.modeCardDark]}
      activeScale={0.98}
      onPress={onPress}
      testID={`transport-mode-${mode.mode}`}>
      <View style={[styles.modeIconBox, isDarkMode && styles.modeIconBoxDark]}>
        <Text style={styles.modeEmoji}>{mode.emoji}</Text>
      </View>
      <View style={styles.modeText}>
        <Text style={[styles.modeTitle, isDarkMode && styles.textLight]}>{mode.label}</Text>
        <Text style={[styles.modeStatus, { color: verdictColor }]}>{mode.verdict_text}</Text>
        <Text style={[styles.modeDesc, isDarkMode && styles.textMutedDark]} numberOfLines={2}>
          {mode.insight}
        </Text>
      </View>
      <View style={styles.modeArrow}>
        <Feather name="arrow-right" size={ms(14)} color="#FFFFFF" />
      </View>
    </BouncyPressable>
  );
};

export const TransportScreen = ({ navigation }) => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { data: hub, isLoading, isError, refetch, isRefetching } = useTransportHub();

  console.log('TransportScreen hub:', hub);
  const [comingSoonMode, setComingSoonMode] = useState(null);

  const handleModePress = mode => {
    if (AVAILABLE_MODES.includes(mode.mode)) {
      navigation.navigate('TransportModeScreen', { card: mode });
    } else {
      setComingSoonMode(mode);
    }
  };

  const modeCards = hub?.mode_cards ?? [];
  const trust = hub?.trust_banner;
  const testers = hub?.journey_testers ?? [];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FFFFFF'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Transport"
        subtitle="COMMUNITY CARE"
        onBack={() => navigation.goBack()}
        testID="transport-back-btn"
      />

      {isLoading ? (
        <Loader
          fullScreen
          title="Loading transport guides..."
          subtitle="Fetching verified travel rules for dogs..."
        />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDarkMode ? '#A855F7' : '#7C3AED'}
              colors={['#7C3AED', '#EE2A7B']}
            />
          }>
          {isError || !hub ? (
            <View style={styles.stateBox}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>
                Could not load transport guides
              </Text>
              <Text style={[styles.modeDesc, isDarkMode && styles.textMutedDark]}>
                Check your connection and try again.
              </Text>
              <BouncyPressable style={styles.retryBtn} activeScale={0.94} onPress={refetch}>
                <Text style={styles.retryText}>Try again</Text>
              </BouncyPressable>
            </View>
          ) : (
            <>
              {/* Hero */}
              <LinearGradient
                colors={['#DC2626', '#EA580C', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                  style={styles.heroGloss}
                />
                <View style={styles.heroCircle} />
                <View style={styles.heroHeart}>
                  <Feather name="heart" size={ms(24)} color="#FFFFFF" />
                </View>
                <Text style={styles.heroOverline}>{(hub.eyebrow || '').toUpperCase()}</Text>
                <Text style={styles.heroTitle}>
                  {hub.hero_title_prefix}{' '}
                  <Text style={styles.heroTitleAccent}>{hub.hero_title_highlight}</Text>
                </Text>
                <Text style={styles.heroDesc}>{hub.hero_description}</Text>
                {testers.length > 0 ? (
                  <View style={styles.testersRow}>
                    <View style={styles.testersStack}>
                      {testers.map((name, idx) => (
                        <View
                          key={name}
                          style={[
                            styles.testerAvatar,
                            { zIndex: 10 - idx },
                            idx > 0 && styles.testerOverlap,
                          ]}>
                          <Text style={styles.testerLetter}>{name.charAt(0).toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.testersLabel}>{hub.journey_tested_label}</Text>
                  </View>
                ) : null}
              </LinearGradient>

              {/* Modes */}
              <Text style={[styles.sectionOverline, isDarkMode && styles.textMutedDark]}>
                YOUR TRAVELLING OPTIONS
              </Text>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>
                {hub.section_title}
              </Text>
              {hub.section_description ? (
                <Text style={[styles.sectionDesc, isDarkMode && styles.textMutedDark]}>
                  {hub.section_description}
                </Text>
              ) : null}

              {modeCards.map(mode => (
                <ModeCard
                  key={mode.mode}
                  mode={mode}
                  isDarkMode={isDarkMode}
                  onPress={() => handleModePress(mode)}
                />
              ))}

              {/* Verification note */}
              {trust ? (
                <View style={[styles.noteCard, isDarkMode && styles.noteCardDark]}>
                  <View style={styles.noteBadge}>
                    <Feather name="check" size={ms(16)} color="#92400E" />
                  </View>
                  <Text style={styles.noteOverline}>{(trust.heading || '').toUpperCase()}</Text>
                  <Text style={[styles.noteTitle, isDarkMode && styles.noteTitleDark]}>
                    {trust.statement}
                  </Text>
                  <Text style={[styles.noteBody, isDarkMode && styles.noteBodyDark]}>
                    {trust.description}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </Animated.ScrollView>
      )}

      <Modal
        visible={!!comingSoonMode}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonMode(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
            <View style={[styles.modalEmojiBox, isDarkMode && styles.modalEmojiBoxDark]}>
              <Text style={styles.modalEmoji}>{comingSoonMode?.emoji}</Text>
            </View>
            <Text style={[styles.modalTitle, isDarkMode && styles.textLight]}>Coming soon</Text>
            <Text style={[styles.modalBody, isDarkMode && styles.textMutedDark]}>
              The full {comingSoonMode?.label} guide for travelling with your dog is on its way. We
              are verifying it from real journeys before we publish.
            </Text>
            <BouncyPressable
              style={styles.modalBtn}
              activeScale={0.95}
              onPress={() => setComingSoonMode(null)}
              testID="transport-coming-soon-close">
              <Text style={styles.modalBtnText}>Got it</Text>
            </BouncyPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  scrollContent: { paddingHorizontal: s(15), paddingTop: s(8), paddingBottom: s(40) },

  hero: {
    borderRadius: s(24),
    padding: s(20),
    overflow: 'hidden',
    marginBottom: s(22),
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 4,
    borderBottomColor: '#9A3412',
    shadowColor: '#9A3412',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 9,
  },
  heroGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: s(80),
  },
  heroCircle: {
    position: 'absolute',
    right: -s(40),
    bottom: -s(50),
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroHeart: {
    position: 'absolute',
    top: s(16),
    right: s(16),
    width: s(52),
    height: s(52),
    borderRadius: s(18),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: s(10),
    letterSpacing: 0.8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: s(26),
    lineHeight: s(30),
    marginTop: s(8),
    marginRight: s(40),
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroTitleAccent: { color: '#FEF08A' },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: s(12),
    lineHeight: s(18),
    marginTop: s(10),
    fontFamily: theme.typography.fontFamily.regular,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 29, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(28),
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    padding: s(22),
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#D4C8F3',
  },
  modalCardDark: {
    backgroundColor: '#1B0F2E',
    borderTopColor: '#3A2468',
    borderBottomColor: '#0B0316',
  },
  modalEmojiBox: {
    width: s(70),
    height: s(70),
    borderRadius: s(20),
    backgroundColor: '#F1EBFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(14),
  },
  modalEmojiBoxDark: { backgroundColor: '#2A1848' },
  modalEmoji: { fontSize: ms(36) },
  modalTitle: {
    color: '#2A0E55',
    fontSize: s(19),
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalBody: {
    color: '#5E4F78',
    fontSize: s(12.5),
    lineHeight: s(19),
    textAlign: 'center',
    marginTop: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },
  modalBtn: {
    marginTop: s(18),
    backgroundColor: '#7C3AED',
    borderRadius: s(16),
    paddingHorizontal: s(34),
    paddingVertical: s(11),
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  testersRow: { flexDirection: 'row', alignItems: 'center', marginTop: s(14) },
  testersStack: { flexDirection: 'row', alignItems: 'center' },
  testerAvatar: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testerOverlap: { marginLeft: -s(8) },
  testerLetter: {
    color: '#FFFFFF',
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
  },
  testersLabel: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: s(11),
    marginLeft: s(10),
    fontFamily: theme.typography.fontFamily.regular,
  },
  stateBox: { alignItems: 'center', paddingVertical: s(60) },
  retryBtn: {
    marginTop: s(16),
    backgroundColor: '#7C3AED',
    borderRadius: s(14),
    paddingHorizontal: s(22),
    paddingVertical: s(10),
  },
  retryText: { color: '#FFFFFF', fontSize: s(13), fontFamily: theme.typography.fontFamily.bold },
  sectionDesc: {
    color: '#7C6F91',
    fontSize: s(12),
    marginTop: -s(8),
    marginBottom: s(14),
    fontFamily: theme.typography.fontFamily.regular,
  },
  sectionOverline: {
    color: '#7C6F91',
    fontSize: s(10),
    letterSpacing: 0.8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionTitle: {
    color: '#2A0E55',
    fontSize: s(20),
    marginTop: s(2),
    marginBottom: s(14),
    fontFamily: theme.typography.fontFamily.bold,
  },

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(10),
    marginBottom: s(14),
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.14)',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#D4C8F3',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  modeCardDark: {
    backgroundColor: '#1B0F2E',
    borderColor: '#2E1A4F',
    borderTopColor: '#3A2468',
    borderBottomColor: '#0B0316',
    shadowColor: '#000000',
  },
  modeIconBox: {
    width: s(72),
    height: s(72),
    borderRadius: s(18),
    backgroundColor: '#F1EBFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD0F7',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modeIconBoxDark: {
    backgroundColor: '#2A1848',
    borderTopColor: '#3A2468',
    borderBottomColor: '#160A2A',
  },
  modeEmoji: { fontSize: ms(38) },
  modeText: { flex: 1, marginLeft: s(12), marginRight: s(8) },
  modeTitle: {
    color: '#2A0E55',
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
  },
  modeStatus: {
    fontSize: s(10),
    marginTop: s(1),
    fontFamily: theme.typography.fontFamily.bold,
  },
  modeDesc: {
    color: '#7C6F91',
    fontSize: s(11),
    lineHeight: s(15),
    marginTop: s(4),
    fontFamily: theme.typography.fontFamily.regular,
  },
  modeArrow: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  noteCard: {
    marginTop: s(8),
    backgroundColor: '#FEF9E7',
    borderRadius: s(22),
    padding: s(16),
    borderWidth: 1,
    borderColor: '#FDE9A9',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFDF3',
    borderBottomWidth: 4,
    borderBottomColor: '#EBCB6B',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  noteCardDark: {
    backgroundColor: '#2A220F',
    borderColor: '#4A3A14',
    borderBottomColor: '#14100A',
  },
  noteBadge: {
    width: s(34),
    height: s(34),
    borderRadius: s(10),
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(10),
  },
  noteOverline: {
    color: '#B45309',
    fontSize: s(10),
    letterSpacing: 0.6,
    fontFamily: theme.typography.fontFamily.bold,
  },
  noteTitle: {
    color: '#78350F',
    fontSize: s(15),
    lineHeight: s(21),
    marginTop: s(4),
    fontFamily: theme.typography.fontFamily.bold,
  },
  noteTitleDark: { color: '#FDE68A' },
  noteBody: {
    color: '#92400E',
    fontSize: s(12),
    lineHeight: s(19),
    marginTop: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },
  noteBodyDark: { color: '#E8D5A0' },

  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#B9A9D6' },
});
