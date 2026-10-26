import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const ProfileVipCard = ({
  userName = 'Rishab',
  userEmail = 'rishabsharma@cvinfotech.com',
  userInitial = 'R',
  isDarkMode = false,
}) => {
  // Ambient breathing aura animation for avatar ring
  const auraAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(auraAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [auraAnim]);

  const avatarHaloStyle = {
    opacity: auraAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0.85],
    }),
    transform: [
      {
        scale: auraAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.14],
        }),
      },
    ],
  };

  return (
    <View style={styles.vipCardOuter}>
      <LinearGradient
        colors={
          isDarkMode
            ? ['#0A0413', '#140824', '#1C0B32', '#0C0318']
            : ['#0E051C', '#18092E', '#230C3F', '#110424']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.vipCardGradient}>
        {/* Ambient Background Gold Glows & Paw Watermark */}
        <View style={styles.cardDepthGlowGold} />
        <View style={styles.cardDepthGlowPurple} />
        <View style={styles.cardPawWatermark} pointerEvents="none">
          <Ionicons name="paw" size={ms(110)} color="rgba(245, 158, 11, 0.04)" />
        </View>
        <View style={styles.cardSpecularStripGold} />

        {/* Top VIP Card Brand Row (Smart Chip & Club Branding) */}
        <View style={styles.cardTopBrandRow}>
          <View style={styles.cardBrandBadge}>
            <Ionicons
              name="sparkles"
              size={ms(10)}
              color="#FCD34D"
              style={styles.cardBrandSparkle}
            />
            <Text style={styles.cardBrandText}>PET PAWSPORT ELITE</Text>
          </View>

          <View style={styles.cardChipRow}>
            <Ionicons
              name="hardware-chip-outline"
              size={ms(13)}
              color="#FCD34D"
              style={styles.cardChipIcon}
            />
            <Text style={styles.cardChipText}>PAW-VIP #8821</Text>
          </View>
        </View>

        {/* Horizontal Identity Row */}
        <View style={styles.cardContentRow}>
          {/* Left: 3D Elevated Avatar with Champagne Gold Ring & Camera Badge */}
          <View style={styles.avatarMasterContainer}>
            <Animated.View style={[styles.avatarAuraRing, avatarHaloStyle]} />
            <View style={styles.avatarCircle3D}>
              <LinearGradient
                colors={['#1F0D38', '#0F041E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientInner}>
                <Text style={styles.avatarInitialText}>{userInitial}</Text>
              </LinearGradient>
            </View>

            {/* Camera upload badge in Champagne Gold */}
            <BouncyPressable
              style={styles.avatarCameraBadge}
              activeScale={0.82}
              onPress={() =>
                Alert.alert('Update Photo', 'Camera and gallery photo uploads coming soon!')
              }>
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#92400E']}
                style={styles.cameraBadgeGrad}>
                <Ionicons name="camera" size={ms(9.5)} color="#FFFFFF" />
              </LinearGradient>
            </BouncyPressable>
          </View>

          {/* Right: User Details (Name, Email, Badges) */}
          <View style={styles.cardInfoCol}>
            {/* Name + Verified Badge + Founder Badge */}
            <View style={styles.cardNameRow}>
              <Text style={styles.userNameText} numberOfLines={1} ellipsizeMode="tail">
                {userName}
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={ms(15)}
                color="#38BDF8"
                style={styles.verifiedCheckIcon}
              />
              <View style={styles.founderMiniBadge}>
                <Text style={styles.founderMiniText}>FOUNDER</Text>
              </View>
            </View>

            {/* Email with active green dot */}
            <View style={styles.userEmailRow}>
              <View style={styles.verifiedDot} />
              <Text style={styles.userEmailText} numberOfLines={1} ellipsizeMode="middle">
                {userEmail}
              </Text>
            </View>

            {/* Quick Action Luxury Frosted Capsules */}
            <View style={styles.badgesRow}>
              <View style={styles.petParentBadge3D}>
                <Ionicons
                  name="paw"
                  size={ms(9.5)}
                  color="#FCD34D"
                  style={styles.badgePawIcon}
                />
                <Text style={styles.petParentBadgeText}>Pet Parent</Text>
              </View>

              <BouncyPressable
                style={styles.publicProfileLink3D}
                activeScale={0.92}
                onPress={() =>
                  Alert.alert(
                    'Public Profile',
                    'Your PetFriendly public profile is live to the pack!',
                  )
                }>
                <Feather
                  name="external-link"
                  size={ms(9.5)}
                  color="#E2E8F0"
                  style={styles.badgePawIcon}
                />
                <Text style={styles.publicProfileLinkText}>Public Profile</Text>
              </BouncyPressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default ProfileVipCard;

const styles = StyleSheet.create({
  vipCardOuter: {
    marginHorizontal: s(16),
    marginTop: vs(4),
    marginBottom: vs(4),
    borderRadius: s(22),
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  vipCardGradient: {
    paddingHorizontal: s(14),
    paddingTop: vs(10),
    paddingBottom: vs(12),
    position: 'relative',
    borderRadius: s(22),
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.38)',
  },
  cardDepthGlowGold: {
    position: 'absolute',
    top: -s(30),
    right: -s(20),
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  cardDepthGlowPurple: {
    position: 'absolute',
    bottom: -s(40),
    left: -s(20),
    width: s(140),
    height: s(140),
    borderRadius: s(70),
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
  },
  cardPawWatermark: {
    position: 'absolute',
    right: -s(12),
    bottom: -s(18),
    transform: [{ rotate: '-18deg' }],
  },
  cardSpecularStripGold: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(253, 230, 138, 0.35)',
  },
  cardTopBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
    paddingBottom: vs(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(253, 230, 138, 0.12)',
  },
  cardBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandSparkle: {
    marginRight: s(4),
  },
  cardBrandText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
    letterSpacing: 0.9,
  },
  cardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.28)',
  },
  cardChipIcon: {
    marginRight: s(3),
  },
  cardChipText: {
    fontSize: s(8),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMasterContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAuraRing: {
    position: 'absolute',
    width: s(66),
    height: s(66),
    borderRadius: s(33),
    borderWidth: 1.8,
    borderColor: 'rgba(245, 158, 11, 0.55)',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  avatarCircle3D: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    padding: 2.2,
    backgroundColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarGradientInner: {
    flex: 1,
    borderRadius: s(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: s(21),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -s(1),
    right: -s(1),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    borderWidth: 1.8,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  cameraBadgeGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoCol: {
    flex: 1,
    marginLeft: s(12),
    justifyContent: 'center',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  verifiedCheckIcon: {
    marginLeft: s(5),
  },
  founderMiniBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: s(6),
    paddingHorizontal: s(5),
    paddingVertical: vs(1.5),
    marginLeft: s(6),
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
  },
  founderMiniText: {
    fontSize: s(7.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(2),
  },
  verifiedDot: {
    width: s(5),
    height: s(5),
    borderRadius: s(2.5),
    backgroundColor: '#10B981',
    marginRight: s(5),
  },
  userEmailText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#CBD5E1',
    flexShrink: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(7),
  },
  petParentBadge3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3.5),
    marginRight: s(7),
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgePawIcon: {
    marginRight: s(3.5),
  },
  petParentBadgeText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
  },
  publicProfileLink3D: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3.5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  publicProfileLinkText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
