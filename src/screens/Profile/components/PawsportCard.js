import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { Enter, Shine } from '../../Community/Motion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// One page of the carousel: leaves a sliver of the next card visible as a swipe cue
const PAGE_WIDTH = SCREEN_WIDTH - s(44);

// One pet's pawsport card (or the "create your first pawsport" card when there is no pet)
const PawsportCardView = ({ activePet, onAddPet, onPressPet, isDarkMode = false, outerStyle }) => {
  // Floating bob animation for 3D emblem
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim]);

  // Soft ring pulsing out from the pet emblem
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  const floatingPawStyle = {
    transform: [{ translateY: floatAnim }],
  };
  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  };

  return (
    <Enter style={[styles.pawsportSectionOuter, outerStyle]}>
      <LinearGradient
        colors={isDarkMode ? ['#2A0B6B', '#4C1D95', '#6D28D9'] : ['#3B108F', '#5B21B6', '#7B2CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pawsportCardGradient}>
        {/* Hologram Light Reflection Strip */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.6 }}
          style={styles.pwSheen}
        />

        {/* Background Paw Security Watermark */}
        <Ionicons
          name="paw"
          size={ms(120)}
          color="rgba(255, 255, 255, 0.04)"
          style={styles.pawsportWatermark}
        />

        {/* Gold Foil Header Banner */}
        <View style={styles.pawsportHeaderRow}>
          <View style={styles.pawsportTitleWrap}>
            <Ionicons
              name="shield-checkmark"
              size={ms(15)}
              color="#FBCFE8"
              style={styles.pawsportShieldIcon}
            />
            <Text style={styles.pawsportGoldTag}>OFFICIAL PET PAWSPORT</Text>
          </View>

          {activePet ? (
            <BouncyPressable style={styles.pwAddPill} activeScale={0.94} onPress={onAddPet}>
              <Feather name="plus" size={ms(12)} color="#5B21B6" />
              <Text style={styles.pwAddPillText}>Add pet</Text>
            </BouncyPressable>
          ) : (
            <View style={styles.pawsportVerifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={ms(11)}
                color="#10B981"
                style={styles.badgeCheckIcon}
              />
              <Text style={styles.pawsportVerifiedText}>VERIFIED</Text>
            </View>
          )}
        </View>

        {/* Active Pet Card Body */}
        {activePet ? (
          <View style={styles.pawsportBody}>
            <BouncyPressable
              testID="pawsport-open-details"
              accessibilityLabel="View pet details"
              style={styles.pwMain}
              activeScale={0.98}
              onPress={() => onPressPet?.(activePet)}>
              {/* Floating 3D Pet Emblem */}
              <Animated.View style={[styles.pwEmblem, floatingPawStyle]}>
                <Animated.View style={[styles.pwPulse, pulseStyle]} pointerEvents="none" />
                <LinearGradient
                  colors={['#FFFFFF', '#F5D0FE', '#C4B5FD']}
                  style={styles.pwEmblemRing}>
                  <View style={styles.pwEmblemInner}>
                    <Text style={styles.petEmblemEmoji}>
                      {/cat/i.test(activePet.type) ? '🐱' : '🐶'}
                    </Text>
                  </View>
                </LinearGradient>
                <View style={styles.pwEmblemBadge}>
                  <Ionicons name="checkmark" size={ms(9)} color="#FFFFFF" />
                </View>
              </Animated.View>

              <View style={styles.pwText}>
                <Text style={styles.pwName} numberOfLines={1}>
                  {activePet.name || 'Your pet'}
                </Text>
                <Text style={styles.pwBreed} numberOfLines={1}>
                  {[activePet.breed, activePet.type].filter(Boolean).join(' · ') ||
                    'Ready for adventures'}
                </Text>
              </View>

              <View style={styles.pwChevron}>
                <Feather name="chevron-right" size={ms(16)} color="#FFFFFF" />
              </View>
            </BouncyPressable>

            {/* Passport facts */}
            <View style={styles.pwStats}>
              <View style={styles.pwStat}>
                <Text style={styles.pwStatLabel}>PASSPORT ID</Text>
                <Text style={styles.pwStatValue} numberOfLines={1}>
                  {activePet.passportNo || 'Pending'}
                </Text>
              </View>
              <View style={styles.pwStatDivider} />
              <View style={styles.pwStatSmall}>
                <Text style={styles.pwStatLabel}>STAMPS</Text>
                <Text style={styles.pwStatValue}>{activePet.stamps ?? 0}</Text>
              </View>
              <View style={styles.pwStatDivider} />
              <View style={styles.pwStatSmall}>
                <Text style={styles.pwStatLabel}>STATUS</Text>
                <Text style={[styles.pwStatValue, styles.pwStatActive]}>Active</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Empty State: Create First Pawsport */
          <View style={styles.pawsportEmptyBody}>
            <Animated.View style={[styles.pawsportEmblemCircle, floatingPawStyle]}>
              <LinearGradient
                colors={['#EDE9FE', '#C4B5FD', '#A78BFA']}
                style={styles.pawsportEmblemInner}>
                <Ionicons name="paw" size={ms(26)} color="#6D28D9" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.pawsportEmptyTitle}>Create Your Pet’s Pawsport</Text>
            <Text style={styles.pawsportEmptySubtitle}>
              Unlock verified pet-friendly places, exclusive stays, and road trip perks!
            </Text>

            <BouncyPressable style={styles.addFirstPetBtn3D} activeScale={0.93} onPress={onAddPet}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addPetBtnGradient}>
                <Feather name="plus" size={ms(16)} color="#FFFFFF" style={styles.btnPlusIcon} />
                <Text style={styles.addPetBtnText}>Add a Pet</Text>
              </LinearGradient>
            </BouncyPressable>
          </View>
        )}
        <Shine travel={SCREEN_WIDTH} />
      </LinearGradient>
    </Enter>
  );
};

// All pets, swiped sideways one card at a time. A single pet (or none) shows one plain card.
export const PawsportCard = ({
  activePet,
  pets = [],
  selectedPetIndex = 0,
  onSelectPetIndex,
  onAddPet,
  onPressPet,
  isDarkMode = false,
}) => {
  const scrollRef = useRef(null);
  const shownIndex = useRef(selectedPetIndex);

  // Move to a pet chosen elsewhere (for example the one just added)
  useEffect(() => {
    if (pets.length > 1 && shownIndex.current !== selectedPetIndex) {
      shownIndex.current = selectedPetIndex;
      scrollRef.current?.scrollTo({ x: selectedPetIndex * PAGE_WIDTH, animated: true });
    }
  }, [selectedPetIndex, pets.length]);

  if (pets.length <= 1) {
    return (
      <PawsportCardView
        activePet={activePet}
        onAddPet={onAddPet}
        onPressPet={onPressPet}
        isDarkMode={isDarkMode}
      />
    );
  }

  const handleScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    const clamped = Math.max(0, Math.min(pets.length - 1, index));
    shownIndex.current = clamped;
    if (clamped !== selectedPetIndex) {
      onSelectPetIndex?.(clamped);
    }
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        testID="pawsport-carousel"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        contentOffset={{ x: selectedPetIndex * PAGE_WIDTH, y: 0 }}
        onMomentumScrollEnd={handleScrollEnd}>
        {pets.map((pet, index) => (
          <View key={pet.id || index} style={styles.page}>
            <PawsportCardView
              activePet={pet}
              onAddPet={onAddPet}
              onPressPet={onPressPet}
              isDarkMode={isDarkMode}
              outerStyle={styles.pageCard}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {pets.map((pet, index) => (
          <View
            key={pet.id || index}
            style={[
              styles.dot,
              isDarkMode && styles.dotDark,
              index === selectedPetIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default PawsportCard;

const styles = StyleSheet.create({
  pwEmblemBadge: {
    position: 'absolute',
    right: -s(1),
    bottom: -s(1),
    width: s(17),
    height: s(17),
    borderRadius: s(9),
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#5B21B6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
  },
  pwAddPillText: {
    marginLeft: s(3),
    fontSize: ms(11),
    color: '#5B21B6',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  pwPulse: {
    position: 'absolute',
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    backgroundColor: '#F5D0FE',
  },
  pwSheen: { ...StyleSheet.absoluteFillObject },
  pwMain: { flexDirection: 'row', alignItems: 'center' },
  pwEmblem: {
    shadowColor: '#EE2A7B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  pwEmblemRing: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    padding: s(2.5),
  },
  pwEmblemInner: {
    flex: 1,
    borderRadius: s(23),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwText: { flex: 1, marginLeft: s(12) },
  pwEyebrow: {
    fontSize: ms(9.5),
    letterSpacing: 1.6,
    color: 'rgba(252,211,77,0.9)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  pwName: {
    fontSize: ms(19),
    letterSpacing: -0.5,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  pwBreed: {
    marginTop: vs(1),
    fontSize: ms(12.5),
    color: 'rgba(255,255,255,0.72)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  pwChevron: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(10),
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pwStat: { flex: 1.5 },
  pwStatSmall: { flex: 1, alignItems: 'center' },
  pwStatLabel: {
    fontSize: ms(8.5),
    letterSpacing: 1.3,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  pwStatValue: {
    marginTop: vs(1),
    fontSize: ms(12),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  pwStatActive: { color: '#6EE7B7' },
  pwStatDivider: {
    width: 1,
    height: vs(20),
    marginHorizontal: s(8),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pwAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
    paddingVertical: vs(9),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: 'rgba(252,211,77,0.5)',
  },
  pwAddText: {
    marginLeft: s(6),
    fontSize: ms(12.5),
    color: '#FCD34D',
    fontFamily: theme.typography.fontFamily.bold,
  },
  page: { width: PAGE_WIDTH, paddingLeft: s(16) },
  pageCard: { marginHorizontal: 0, marginBottom: vs(10) },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    marginHorizontal: s(3),
    backgroundColor: '#DDD6FE',
  },
  dotDark: { backgroundColor: '#3B1F66' },
  dotActive: { width: s(20), backgroundColor: '#7C3AED' },
  pawsportSectionOuter: {
    marginHorizontal: s(16),
    marginTop: vs(4),
    marginBottom: vs(12),
    borderRadius: s(22),
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  pawsportCardGradient: {
    borderRadius: s(22),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 4,
    borderBottomColor: '#2A0B6B',
    padding: s(14),
    position: 'relative',
    overflow: 'hidden',
  },
  pawsportSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: s(75),
    borderRadius: s(24),
  },
  pawsportWatermark: {
    position: 'absolute',
    right: -s(15),
    bottom: -s(20),
  },
  pawsportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: vs(10),
  },
  pawsportTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawsportShieldIcon: {
    marginRight: s(6),
  },
  pawsportGoldTag: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.1,
  },
  pawsportVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: vs(2.5),
    borderWidth: 0.8,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeCheckIcon: {
    marginRight: s(3),
  },
  pawsportVerifiedText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#34D399',
    letterSpacing: 0.5,
  },
  pawsportBody: {
    position: 'relative',
    zIndex: 2,
  },
  pawsportMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pawsportEmblemCircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    padding: 2.5,
    backgroundColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginRight: s(14),
  },
  pawsportEmblemInner: {
    flex: 1,
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmblemEmoji: {
    fontSize: s(28),
  },
  pawsportDetailsCol: {
    flex: 1,
  },
  pawsportPetNameText: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pawsportPetBreedText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#DDD6FE',
    marginTop: vs(2),
  },
  pawsportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(6),
  },
  pawsportIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: s(8),
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    marginRight: s(8),
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pawsportIdLabel: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FCD34D',
  },
  pawsportIdValue: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pawsportStatusPill: {
    backgroundColor: 'rgba(167, 139, 250, 0.22)',
    borderRadius: s(8),
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    borderWidth: 0.8,
    borderColor: 'rgba(167, 139, 250, 0.45)',
  },
  pawsportStatusText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#E9D5FF',
  },
  petsChipsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: vs(12),
    marginBottom: vs(4),
  },
  petTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    marginRight: s(6),
    marginBottom: vs(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  petTabChipSelected: {
    backgroundColor: 'rgba(253, 230, 138, 0.25)',
    borderColor: '#FDE68A',
  },
  petTabChipEmoji: {
    fontSize: s(13),
    marginRight: s(4),
  },
  petTabChipName: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  petTabChipNameSelected: {
    color: '#FDE68A',
  },
  addAnotherPetBtnLuxury: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: s(14),
    paddingVertical: vs(10),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  btnPlusIcon: {
    marginRight: s(6),
  },
  addAnotherPetBtnLuxuryText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pawsportEmptyBody: {
    alignItems: 'center',
    paddingVertical: vs(14),
  },
  pawsportEmptyTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    marginTop: vs(10),
  },
  pawsportEmptySubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#DDD6FE',
    textAlign: 'center',
    marginTop: vs(4),
    paddingHorizontal: s(16),
  },
  addFirstPetBtn3D: {
    marginTop: vs(14),
    borderRadius: s(14),
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addPetBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    borderRadius: s(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: '#4C1D95',
  },
  addPetBtnText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
