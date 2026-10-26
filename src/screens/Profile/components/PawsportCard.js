import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const PawsportCard = ({
  activePet,
  pets = [],
  selectedPetIndex = 0,
  onSelectPetIndex,
  onAddPet,
  isDarkMode = false,
}) => {
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

  const floatingPawStyle = {
    transform: [{ translateY: floatAnim }],
  };

  return (
    <View style={styles.pawsportSectionOuter}>
      <LinearGradient
        colors={isDarkMode ? ['#150A2A', '#260D55', '#380B5C'] : ['#1E103A', '#2E1065', '#3B0764']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pawsportCardGradient}>
        {/* Hologram Light Reflection Strip */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.pawsportSheen}
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
              color="#FCD34D"
              style={styles.pawsportShieldIcon}
            />
            <Text style={styles.pawsportGoldTag}>OFFICIAL PET PAWSPORT</Text>
          </View>

          <View style={styles.pawsportVerifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={ms(11)}
              color="#10B981"
              style={styles.badgeCheckIcon}
            />
            <Text style={styles.pawsportVerifiedText}>VERIFIED</Text>
          </View>
        </View>

        {/* Active Pet Card Body */}
        {activePet ? (
          <View style={styles.pawsportBody}>
            <View style={styles.pawsportMainRow}>
              {/* Floating 3D Pet Emblem */}
              <Animated.View style={[styles.pawsportEmblemCircle, floatingPawStyle]}>
                <LinearGradient
                  colors={['#EDE9FE', '#C4B5FD', '#A78BFA']}
                  style={styles.pawsportEmblemInner}>
                  <Text style={styles.petEmblemEmoji}>
                    {activePet.type === 'Cat' ? '🐱' : '🐶'}
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Pet Core Passport Details */}
              <View style={styles.pawsportDetailsCol}>
                <Text style={styles.pawsportPetNameText}>{`${activePet.name}'s Pawsport`}</Text>
                <Text
                  style={
                    styles.pawsportPetBreedText
                  }>{`${activePet.breed} · Ready for adventures`}</Text>

                <View style={styles.pawsportMetaRow}>
                  <View style={styles.pawsportIdPill}>
                    <Text style={styles.pawsportIdLabel}>ID: </Text>
                    <Text style={styles.pawsportIdValue}>{activePet.passportNo}</Text>
                  </View>
                  <View style={styles.pawsportStatusPill}>
                    <Text style={styles.pawsportStatusText}>Active Pack 🐾</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pet Switcher Chips (when user has multiple pets) */}
            {pets.length > 1 && (
              <View style={styles.petsChipsScroll}>
                {pets.map((p, idx) => {
                  const isSelected = idx === selectedPetIndex;
                  return (
                    <TouchableOpacity
                      key={p.id || idx}
                      onPress={() => onSelectPetIndex?.(idx)}
                      style={[styles.petTabChip, isSelected && styles.petTabChipSelected]}>
                      <Text style={styles.petTabChipEmoji}>
                        {p.type === 'Cat' ? '🐱' : '🐶'}
                      </Text>
                      <Text
                        style={[
                          styles.petTabChipName,
                          isSelected && styles.petTabChipNameSelected,
                        ]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Add Another Pet Button */}
            <BouncyPressable
              style={styles.addAnotherPetBtnLuxury}
              activeScale={0.94}
              onPress={onAddPet}>
              <Feather name="plus" size={ms(14)} color="#FFFFFF" style={styles.btnPlusIcon} />
              <Text style={styles.addAnotherPetBtnLuxuryText}>Add another pet</Text>
            </BouncyPressable>
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

            <BouncyPressable
              style={styles.addFirstPetBtn3D}
              activeScale={0.93}
              onPress={onAddPet}>
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
      </LinearGradient>
    </View>
  );
};

export default PawsportCard;

const styles = StyleSheet.create({
  pawsportSectionOuter: {
    marginHorizontal: s(16),
    marginTop: vs(4),
    marginBottom: vs(18),
    borderRadius: s(24),
    shadowColor: '#2E1065',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  pawsportCardGradient: {
    borderRadius: s(24),
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderTopColor: '#A78BFA',
    borderBottomWidth: 3.5,
    borderBottomColor: '#1E0747',
    padding: s(18),
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
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: vs(12),
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
    color: '#FDE68A',
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
