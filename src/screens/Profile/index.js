import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StatusBar, Alert, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../../store';
import { useUserProfile } from '../../hooks/useUser';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { vs, ms } from 'react-native-size-matters';

import {
  ThreeDMetricCard,
  SettingsBottomSheet,
  AddPetModal,
  HelpAiModal,
  ProfileVipCard,
  NavTabs,
  PawsportCard,
} from './components';
import styles from './styles';

const sanitizePet = (pet, index = 0) => {
  if (!pet) {
    return null;
  }
  let name = pet.name || pet.pet_name;
  if (
    !name ||
    name === 'undefined' ||
    name === 'null' ||
    name === 'REPLACE_ME' ||
    (typeof name === 'string' && name.includes('REPLACE_ME')) ||
    name.trim() === ''
  ) {
    name = index === 0 ? 'Simba' : `Pet ${index + 1}`;
  }

  let breed = pet.breed || pet.pet_breed || pet.breed_name;
  if (
    !breed ||
    breed === 'undefined' ||
    breed === 'null' ||
    breed === 'REPLACE_ME' ||
    breed.trim() === ''
  ) {
    const isCat = pet.type === 'Cat' || pet.pet_type === 'Cat';
    breed = isCat ? 'Indie Cat' : 'Golden Retriever';
  }

  let type = pet.type || pet.pet_type || pet.species || 'Dog';
  if (type !== 'Dog' && type !== 'Cat') {
    type = 'Dog';
  }

  const id = pet.id || pet._id || `pet-${index + 1}`;
  const suffix = id.toString().replace(/\D/g, '').slice(-4) || `${8400 + index}`;
  const passportNo = pet.passport_no || `PAW-${suffix}-IN`;

  return {
    ...pet,
    id,
    name,
    breed,
    type,
    passportNo,
  };
};

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const logout = useStore(state => state.logout);
  const storeUser = useStore(state => state.user);
  const storePets = useStore(state => state.pets) || [];

  // Theme & Appearance store
  const themeMode = useStore(state => state.themeMode) || 'light';
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const setThemeMode = useStore(state => state.setThemeMode);
  const toggleDarkMode = useStore(state => state.toggleDarkMode);
  const accentColor = useStore(state => state.accentColor) || '#7C3AED';
  const setAccentColor = useStore(state => state.setAccentColor);

  const { data: profileData } = useUserProfile();
  const user =
    profileData?.account ||
    profileData?.user ||
    (profileData?.id ? profileData : null) ||
    storeUser;

  const userName =
    user?.name || user?.displayName || user?.display_name || user?.full_name || 'Rishab';
  const userEmail = user?.email || 'rishabsharma@cvinfotech.com';
  const userInitial = (userName.trim()[0] || 'R').toUpperCase();

  // Safely resolve & sanitize pets list from API or store
  const apiPets = profileData?.pets || profileData?.account?.pets;
  const rawPets = apiPets && apiPets.length > 0 ? apiPets : storePets;

  const [localPets, setLocalPets] = useState(null);
  const pets = useMemo(() => {
    const list = localPets !== null ? localPets : rawPets || [];
    return list.map((p, i) => sanitizePet(p, i));
  }, [localPets, rawPets]);

  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const activePet = pets[selectedPetIndex] || pets[0] || null;

  // Modals state
  const [addPetModalVisible, setAddPetModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Settings preferences
  const [pushNotifications, setPushNotifications] = useState(true);
  const [travelAlerts, setTravelAlerts] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // Active Navigation Tab (by default 'dashboard' is selected)
  const [activeTab, setActiveTab] = useState('dashboard');
  const scrollRef = useRef(null);

  const handleSelectTab = useCallback(tabId => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
    }
  }, []);

  // Metrics
  const petsCount = pets.length;
  const stampsCount = user?.stamps_count || 0;
  const postsCount = user?.posts_count || 0;
  const topRank = user?.rank ? `#${user.rank}` : '—';

  // Ambient FAB glow pulse
  const fabPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [fabPulse]);

  const fabPulseStyle = {
    opacity: fabPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.45],
    }),
    transform: [
      {
        scale: fabPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.28],
        }),
      },
    ],
  };

  const handleAddPet = newPet => {
    const newId = `pet-${Date.now()}`;
    const newPassportNo = `PAW-${Math.floor(1000 + Math.random() * 9000)}-IN`;
    const createdPet = {
      id: newId,
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed,
      bio: newPet.bio || '',
      passportNo: newPassportNo,
      stamps: 0,
      badge: 'Pack Explorer',
    };

    const updated = [...pets, createdPet];
    setLocalPets(updated);
    setSelectedPetIndex(updated.length - 1);
    Alert.alert(
      '🎉 Pawsport Activated!',
      `${newPet.name} is now registered on PetFriendly with Passport ID ${newPassportNo}!`,
    );
  };

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PetFriendly?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
      { cancelable: true },
    );
  }, [logout]);

  const menuSections = useMemo(
    () => [
      {
        sectionTitle: 'OVERVIEW',
        items: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'grid-outline',
            color: accentColor,
            bgColor: isDarkMode ? '#2D1652' : '#EDE9FE',
            active: activeTab === 'dashboard',
            onPress: () => handleSelectTab('dashboard'),
          },
          {
            id: 'settings_theme',
            title: 'Settings & Dark Theme',
            icon: isDarkMode ? 'moon' : 'sunny-outline',
            color: isDarkMode ? '#C084FC' : '#D97706',
            bgColor: isDarkMode ? '#2D1652' : '#FEF3C7',
            badge: themeMode === 'system' ? 'Auto 📱' : isDarkMode ? 'Dark 🌙' : 'Light ☀️',
            onPress: () => setSettingsModalVisible(true),
          },
        ],
      },
      {
        sectionTitle: 'MY PETS',
        items: [
          {
            id: 'pet_profiles',
            title: 'Pet Profiles',
            icon: 'paw-outline',
            color: accentColor,
            bgColor: isDarkMode ? '#2D1652' : '#EDE9FE',
            badge: `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'}`,
            active: activeTab === 'pet_profiles',
            onPress: () => handleSelectTab('pet_profiles'),
          },
        ],
      },
      {
        sectionTitle: 'ACTIVITY',
        items: [
          {
            id: 'community_posts',
            title: 'Community Posts',
            icon: 'chatbubble-ellipses-outline',
            color: '#2563EB',
            bgColor: isDarkMode ? '#1E293B' : '#EFF6FF',
            active: activeTab === 'community_posts',
            onPress: () => handleSelectTab('community_posts'),
          },
          {
            id: 'reviews',
            title: 'Reviews',
            icon: 'star-outline',
            color: '#D97706',
            bgColor: isDarkMode ? '#332205' : '#FEF3C7',
            active: activeTab === 'reviews',
            onPress: () => handleSelectTab('reviews'),
          },
          {
            id: 'create_trip',
            title: 'Create a trip',
            icon: 'map-outline',
            color: '#059669',
            bgColor: isDarkMode ? '#064E3B' : '#ECFDF5',
            onPress: () =>
              Alert.alert(
                'Road Trip Planner',
                'Plan your next pet-friendly road trip with verified stops.',
              ),
          },
          {
            id: 'leaderboard',
            title: 'Leaderboard',
            icon: 'trophy-outline',
            color: '#9333EA',
            bgColor: isDarkMode ? '#2A0845' : '#FAF5FF',
            badge: topRank !== '—' ? topRank : 'Explore',
            active: activeTab === 'leaderboard',
            onPress: () => handleSelectTab('leaderboard'),
          },
        ],
      },
      {
        sectionTitle: 'SUPPORT & PACK',
        items: [
          {
            id: 'ask_ai',
            title: 'Ask PetFriendly AI',
            icon: 'sparkles-outline',
            color: '#7C3AED',
            bgColor: isDarkMode ? '#2D1652' : '#F5F3FF',
            aiBadge: 'Pack AI',
            onPress: () => setHelpModalVisible(true),
          },
          {
            id: 'contact_us',
            title: 'Contact us',
            icon: 'mail-outline',
            color: '#0284C7',
            bgColor: isDarkMode ? '#082F49' : '#F0F9FF',
            onPress: () =>
              Alert.alert(
                'Contact PetFriendly Support',
                'Email: support@petfriendly.in\nPhone: +91 800 PET HELP\nAvailable 24x7',
              ),
          },
        ],
      },
      {
        sectionTitle: 'ACCOUNT',
        items: [
          {
            id: 'logout',
            title: 'Logout',
            icon: 'log-out-outline',
            color: '#EF4444',
            bgColor: isDarkMode ? '#450A0A' : '#FEF2F2',
            isDestructive: true,
            onPress: handleLogout,
          },
        ],
      },
    ],
    [
      accentColor,
      isDarkMode,
      activeTab,
      themeMode,
      pets.length,
      topRank,
      handleSelectTab,
      handleLogout,
    ],
  );

  const navTabs = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
      { id: 'pet_profiles', label: 'My Pets', icon: 'paw-outline', count: pets.length },
      {
        id: 'community_posts',
        label: 'Community',
        icon: 'chatbubble-ellipses-outline',
        count: postsCount,
      },
      {
        id: 'leaderboard',
        label: 'Rankings',
        icon: 'trophy-outline',
        count: topRank !== '—' ? topRank : null,
      },
      { id: 'reviews', label: 'Reviews', icon: 'star-outline' },
    ],
    [pets.length, postsCount, topRank],
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#F8F9FA'}
      />

      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + vs(6) }]}
        showsVerticalScrollIndicator={false}>
        {/* ── 1. Top Navigation Bar ── */}
        <View style={styles.topNavBar}>
          <View>
            <View style={styles.screenTitleRow}>
              <Text style={[styles.screenTitle, isDarkMode && styles.screenTitleDark]}>
                Profile
              </Text>
              <View style={[styles.topNavVipPill, isDarkMode && styles.topNavVipPillDark]}>
                <Ionicons
                  name="sparkles"
                  size={ms(9)}
                  color={isDarkMode ? '#FDE68A' : '#D97706'}
                  style={styles.topNavSparkle}
                />
                <Text
                  style={[styles.topNavVipPillText, isDarkMode && styles.topNavVipPillTextDark]}>
                  PAWS PORTAL
                </Text>
              </View>
            </View>
            <Text style={[styles.screenSubtitle, isDarkMode && styles.screenSubtitleDark]}>
              Pet parent credentials & dashboard
            </Text>
          </View>

          <BouncyPressable
            style={[styles.navSettingsBtn, isDarkMode && styles.navSettingsBtnDark]}
            activeScale={0.88}
            onPress={() => setSettingsModalVisible(true)}>
            <Feather name="settings" size={ms(18)} color={isDarkMode ? '#E2E8F0' : '#1E1B4B'} />
          </BouncyPressable>
        </View>

        {/* ── 2. Obsidian & Champagne Gold "VIP Black Card" ── */}
        <ProfileVipCard
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
          isDarkMode={isDarkMode}
        />

        {/* ── 2b. Executive Section Tabs (Dashboard active by default) ── */}
        <NavTabs
          tabs={navTabs}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          accentColor={accentColor}
          isDarkMode={isDarkMode}
        />

        {/* ── TAB CONTENT: DASHBOARD (SELECTED BY DEFAULT) ── */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Dashboard Title Section */}
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.dashboardTitleRow}>
                <Text style={[styles.dashboardTitle, isDarkMode && styles.dashboardTitleDark]}>
                  Dashboard
                </Text>
                <Text style={styles.waveEmoji}> 👋</Text>
              </View>
              <Text style={[styles.dashboardSubtitle, isDarkMode && styles.dashboardSubtitleDark]}>
                Your pet parenting activity & stats at a glance
              </Text>
            </View>

            {/* The 4 3D Metric Cards */}
            <View style={styles.metricsGrid}>
              <ThreeDMetricCard
                emoji="🐶"
                number={petsCount}
                label="PETS"
                subtext="in your pack"
                gradientColors={['#2E1065', '#3B0764', '#4C1D95']}
                shadowColor="#581C87"
                bevelColor="#1E0747"
                onPress={() => setAddPetModalVisible(true)}
                delay={40}
              />

              <ThreeDMetricCard
                emoji="🎖️"
                number={stampsCount}
                label="STAMPS"
                subtext="places visited"
                gradientColors={['#B45309', '#D97706', '#F59E0B']}
                shadowColor="#B45309"
                bevelColor="#78350F"
                onPress={() =>
                  Alert.alert(
                    'Stamps',
                    'Collect digital stamps each time you visit verified pet-friendly places!',
                  )
                }
                delay={100}
              />

              <ThreeDMetricCard
                emoji="💬"
                number={postsCount}
                label="POSTS"
                subtext="in community"
                gradientColors={['#065F46', '#047857', '#059669']}
                shadowColor="#047857"
                bevelColor="#064E3B"
                onPress={() =>
                  Alert.alert(
                    'Community Posts',
                    'Share tips, meetups, and pet stories with the local community.',
                  )
                }
                delay={160}
              />

              <ThreeDMetricCard
                emoji="🏆"
                number={topRank}
                label="TOP RANK"
                subtext="this week"
                gradientColors={['#7F1D1D', '#991B1B', '#B91C1C']}
                shadowColor="#991B1B"
                bevelColor="#450A0A"
                onPress={() =>
                  Alert.alert(
                    'Leaderboard',
                    'Explore more pet places to rise through community rankings!',
                  )
                }
                delay={220}
              />
            </View>

            {/* Luxury Digital VIP Pawsport Card */}
            <PawsportCard
              activePet={activePet}
              pets={pets}
              selectedPetIndex={selectedPetIndex}
              onSelectPetIndex={setSelectedPetIndex}
              onAddPet={() => setAddPetModalVisible(true)}
              isDarkMode={isDarkMode}
            />
          </View>
        )}

        {/* ── TAB CONTENT: MY PETS ── */}
        {activeTab === 'pet_profiles' && (
          <View>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.dashboardTitleRow}>
                <Text style={[styles.dashboardTitle, isDarkMode && styles.dashboardTitleDark]}>
                  My Pets
                </Text>
                <Text style={styles.waveEmoji}> 🐾</Text>
              </View>
              <Text style={[styles.dashboardSubtitle, isDarkMode && styles.dashboardSubtitleDark]}>
                Manage your pack's official digital pawsports
              </Text>
            </View>

            <PawsportCard
              activePet={activePet}
              pets={pets}
              selectedPetIndex={selectedPetIndex}
              onSelectPetIndex={setSelectedPetIndex}
              onAddPet={() => setAddPetModalVisible(true)}
              isDarkMode={isDarkMode}
            />
          </View>
        )}

        {/* ── TAB CONTENT: COMMUNITY POSTS ── */}
        {activeTab === 'community_posts' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.dashboardTitleRow}>
                <Text style={[styles.dashboardTitle, isDarkMode && styles.dashboardTitleDark]}>
                  Community Posts
                </Text>
                <Text style={styles.waveEmoji}> 💬</Text>
              </View>
              <Text style={[styles.dashboardSubtitle, isDarkMode && styles.dashboardSubtitleDark]}>
                Stories and moments shared with the pack
              </Text>
            </View>

            <View style={[styles.tabContentCard, isDarkMode && styles.tabContentCardDark]}>
              <View style={styles.tabContentEmptyIconWrap}>
                <Ionicons name="chatbubbles" size={ms(28)} color={accentColor} />
              </View>
              <Text style={[styles.tabContentEmptyTitle, isDarkMode && styles.textWhite]}>
                Share Your First Pet Story
              </Text>
              <Text style={[styles.tabContentEmptySub, isDarkMode && styles.textMutedDark]}>
                Inspire pet parents across India with your favorite pet-friendly trails, stays, and
                cafe memories.
              </Text>
              <BouncyPressable
                style={styles.tabActionBtn}
                activeScale={0.92}
                onPress={() =>
                  Alert.alert('Share Story', 'Travel story publishing form coming soon!')
                }>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.tabActionBtnGrad}>
                  <Feather
                    name="plus"
                    size={ms(14)}
                    color="#FFFFFF"
                    style={styles.tabActionBtnIcon}
                  />
                  <Text style={styles.tabActionBtnText}>Create a Story</Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          </View>
        )}

        {/* ── TAB CONTENT: LEADERBOARD ── */}
        {activeTab === 'leaderboard' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.dashboardTitleRow}>
                <Text style={[styles.dashboardTitle, isDarkMode && styles.dashboardTitleDark]}>
                  Leaderboard
                </Text>
                <Text style={styles.waveEmoji}> 🏆</Text>
              </View>
              <Text style={[styles.dashboardSubtitle, isDarkMode && styles.dashboardSubtitleDark]}>
                Top pet explorers and active pack leaders this week
              </Text>
            </View>

            <View style={[styles.tabContentCard, isDarkMode && styles.tabContentCardDark]}>
              <View style={styles.leaderboardPodiumRow}>
                <View style={[styles.podiumItem, styles.podiumSilver]}>
                  <Text style={styles.podiumMedal}>🥈</Text>
                  <Text style={[styles.podiumName, isDarkMode && styles.textWhite]}>Milo</Text>
                  <Text style={styles.podiumScore}>2,410 pts</Text>
                </View>
                <View style={[styles.podiumItem, styles.podiumGold]}>
                  <Text style={styles.podiumMedal}>🥇</Text>
                  <Text style={[styles.podiumName, isDarkMode && styles.textWhite]}>
                    Simba & Rishab
                  </Text>
                  <Text style={styles.podiumScore}>3,150 pts</Text>
                </View>
                <View style={[styles.podiumItem, styles.podiumBronze]}>
                  <Text style={styles.podiumMedal}>🥉</Text>
                  <Text style={[styles.podiumName, isDarkMode && styles.textWhite]}>Rocky</Text>
                  <Text style={styles.podiumScore}>1,980 pts</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB CONTENT: REVIEWS ── */}
        {activeTab === 'reviews' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.dashboardSectionHeader}>
              <View style={styles.dashboardTitleRow}>
                <Text style={[styles.dashboardTitle, isDarkMode && styles.dashboardTitleDark]}>
                  My Reviews
                </Text>
                <Text style={styles.waveEmoji}> ⭐</Text>
              </View>
              <Text style={[styles.dashboardSubtitle, isDarkMode && styles.dashboardSubtitleDark]}>
                Verified places and cafes you have reviewed
              </Text>
            </View>

            <View style={[styles.tabContentCard, isDarkMode && styles.tabContentCardDark]}>
              <View style={styles.tabContentEmptyIconWrap}>
                <Ionicons name="star" size={ms(28)} color="#F59E0B" />
              </View>
              <Text style={[styles.tabContentEmptyTitle, isDarkMode && styles.textWhite]}>
                No Reviews Yet
              </Text>
              <Text style={[styles.tabContentEmptySub, isDarkMode && styles.textMutedDark]}>
                Visit verified cafes, hotels, and dog parks to leave reviews and earn explorer
                badges!
              </Text>
              <BouncyPressable
                style={styles.tabActionBtn}
                activeScale={0.92}
                onPress={() => navigation?.navigate?.('Explore')}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706', '#B45309']}
                  style={styles.tabActionBtnGrad}>
                  <Feather
                    name="compass"
                    size={ms(14)}
                    color="#FFFFFF"
                    style={styles.tabActionBtnIcon}
                  />
                  <Text style={styles.tabActionBtnText}>Explore Places Near You</Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          </View>
        )}

        {/* ── 5. Menu Sections ── */}
        {menuSections.map(section => (
          <View key={section.sectionTitle} style={styles.menuSection}>
            <Text style={[styles.menuSectionHeader, isDarkMode && styles.menuSectionHeaderDark]}>
              {section.sectionTitle}
            </Text>

            <View style={[styles.menuCard3D, isDarkMode && styles.menuCard3DDark]}>
              {section.items.map((item, idx) => {
                const isLast = idx === section.items.length - 1;
                return (
                  <BouncyPressable
                    key={item.id}
                    style={[
                      styles.menuItemRow,
                      item.active &&
                        (isDarkMode ? styles.menuItemRowActiveDark : styles.menuItemRowActive),
                      !isLast && (isDarkMode ? styles.menuItemDividerDark : styles.menuItemDivider),
                    ]}
                    activeScale={0.97}
                    onPress={item.onPress}>
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIconBox3D, { backgroundColor: item.bgColor }]}>
                        <Ionicons name={item.icon} size={ms(18)} color={item.color} />
                      </View>
                      <Text
                        style={[
                          styles.menuItemTitle,
                          isDarkMode && styles.menuItemTitleDark,
                          item.isDestructive && styles.menuItemDestructive,
                          item.active && { color: accentColor },
                        ]}>
                        {item.title}
                      </Text>
                    </View>

                    <View style={styles.menuItemRight}>
                      {item.badge && (
                        <View style={[styles.menuBadge3D, isDarkMode && styles.menuBadge3DDark]}>
                          <Text style={[styles.menuBadgeText, { color: accentColor }]}>
                            {item.badge}
                          </Text>
                        </View>
                      )}
                      {item.aiBadge && (
                        <View style={[styles.aiBadge3D, isDarkMode && styles.aiBadge3DDark]}>
                          <Ionicons
                            name="sparkles"
                            size={ms(10)}
                            color={accentColor}
                            style={styles.sparkleIcon}
                          />
                          <Text style={[styles.aiBadgeText, { color: accentColor }]}>
                            {item.aiBadge}
                          </Text>
                        </View>
                      )}
                      <Feather
                        name="chevron-right"
                        size={ms(16)}
                        color={item.isDestructive ? '#FCA5A5' : isDarkMode ? '#64748B' : '#9CA3AF'}
                      />
                    </View>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* ── 6. 3D Floating Help Widget ── */}
      <View style={[styles.floatingHelpWrap, { bottom: Math.max(insets.bottom, vs(16)) + vs(12) }]}>
        <Animated.View style={[styles.floatingHelpPulse, fabPulseStyle]} />

        <BouncyPressable
          style={styles.floatingHelpBtn3D}
          activeScale={0.88}
          onPress={() => setHelpModalVisible(true)}>
          <LinearGradient
            colors={['#A855F7', '#7C3AED', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingHelpGradient}>
            <Ionicons name="chatbubble-ellipses" size={ms(22)} color="#FFFFFF" />
          </LinearGradient>
        </BouncyPressable>
      </View>

      {/* ── 7. Settings & Dark Theme Bottom Sheet Component ── */}
      <SettingsBottomSheet
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        pushNotifications={pushNotifications}
        setPushNotifications={setPushNotifications}
        travelAlerts={travelAlerts}
        setTravelAlerts={setTravelAlerts}
        publicProfile={publicProfile}
        setPublicProfile={setPublicProfile}
      />

      {/* ── 8. Add Pet Modal Component ── */}
      <AddPetModal
        visible={addPetModalVisible}
        onClose={() => setAddPetModalVisible(false)}
        onAddPet={handleAddPet}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
      />

      {/* ── 9. Ask AI / Help Modal Component ── */}
      <HelpAiModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
      />
    </View>
  );
};

export default ProfileScreen;
