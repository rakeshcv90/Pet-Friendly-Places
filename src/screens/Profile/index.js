import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StatusBar, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../../store';
import { useUserProfile } from '../../hooks/useUser';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { s, vs, ms } from 'react-native-size-matters';

import {
  ThreeDMetricCard,
  SettingsBottomSheet,
  AddPetModal,
  HelpAiModal,
  ProfileVipCard,
  NavTabs,
  PawsportCard,
  ModernConfirmModal,
} from './components';
import { COMMUNITY_CHANNELS } from './communityData';
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

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    visible: false,
    title: 'Sign Out',
    subtitle: 'Are you sure you want to sign out of PetFriendly?',
    badge: 'SECURITY & SESSION',
    type: 'logout',
    confirmText: 'Sign Out',
    cancelText: 'Cancel',
    singleButton: false,
    onConfirm: null,
  });

  const showInfoModal = useCallback((title, subtitle, badge = 'PETFRIENDLY') => {
    setConfirmModalConfig({
      visible: true,
      title,
      subtitle,
      badge,
      type: 'info',
      confirmText: 'Got It',
      cancelText: 'Close',
      singleButton: true,
      onConfirm: null,
    });
  }, []);

  // Settings preferences
  const [pushNotifications, setPushNotifications] = useState(true);
  const [travelAlerts, setTravelAlerts] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  // Active Navigation Tab (by default 'dashboard' is selected)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [communitySubFilter, setCommunitySubFilter] = useState('all');
  const scrollRef = useRef(null);

  const handleSelectTab = useCallback(tabId => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
    }
  }, []);

  const handleBrowseCommunity = useCallback(() => {
    navigation.navigate('CommunityPostsScreen', { initialTab: communitySubFilter });
  }, [navigation, communitySubFilter]);

  const handleJoinConversation = useCallback(() => {
    navigation.navigate('CommunityPostsScreen', { initialTab: communitySubFilter });
  }, [navigation, communitySubFilter]);

  const displayedChannels = useMemo(() => COMMUNITY_CHANNELS.slice(0, 2), []);

  // Metrics
  const petsCount = pets.length;
  const stampsCount = user?.stamps_count || 0;
  const postsCount = user?.posts_count || 0;
  const topRank = user?.rank ? `#${user.rank}` : '—';

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
    setConfirmModalConfig({
      visible: true,
      title: 'Pawsport Activated! 🎉',
      subtitle: `${newPet.name} is now registered on PetFriendly with Passport ID ${newPassportNo}!`,
      badge: 'PACK PASSPORT',
      type: 'success',
      confirmText: 'Awesome!',
      cancelText: 'Close',
      singleButton: true,
      onConfirm: null,
    });
  };

  const handleLogout = useCallback(() => {
    setConfirmModalConfig({
      visible: true,
      title: 'Sign Out?',
      subtitle:
        'Are you sure you want to sign out of PetFriendly? Your pawsport stamps and saved trips will be kept safe for when you return.',
      badge: 'SECURITY & SESSION',
      type: 'logout',
      confirmText: 'Yes, Sign Out',
      cancelText: 'Stay Logged In',
      singleButton: false,
      onConfirm: () => logout(),
    });
  }, [logout]);

  const handleOpenFollowing = useCallback(() => {
    setConfirmModalConfig({
      visible: true,
      title: 'Pack Following 🐾',
      subtitle:
        'You are following verified pet parents, pack explorers, and trainers across India. Stay tuned for their latest road trips, pet cafe reviews, and trail tips!',
      badge: 'COMMUNITY PACK',
      type: 'info',
      confirmText: 'Explore Pack',
      cancelText: 'Close',
      singleButton: false,
      onConfirm: () => handleSelectTab('community_posts'),
    });
  }, [handleSelectTab]);

  const handleOpenSavedPlaces = useCallback(() => {
    navigation?.navigate?.('Saved');
  }, [navigation]);

  const handleOpenSubmissions = useCallback(() => {
    setConfirmModalConfig({
      visible: true,
      title: 'My Submissions 📍',
      subtitle:
        'Track pet-friendly cafes, hotels, and dog parks you have submitted. Our team verifies all community submissions to ensure safe pet environments.',
      badge: 'VERIFIED PLACES',
      type: 'info',
      confirmText: 'Got It',
      cancelText: 'Close',
      singleButton: true,
      onConfirm: null,
    });
  }, []);

  const handleOpenMyProfile = useCallback(() => {
    navigation.navigate('MyProfileScreen');
  }, [navigation]);

  const handleOpenPrivacy = useCallback(() => {
    setConfirmModalConfig({
      visible: true,
      title: 'Privacy & Security 🛡️',
      subtitle:
        'Your profile, booking data, and pet credentials are protected with salted hashes and encrypted transport. You can manage your public profile visibility anytime.',
      badge: 'DATA PRIVACY',
      type: 'info',
      confirmText: 'Privacy Settings',
      cancelText: 'Close',
      singleButton: false,
      onConfirm: () => setSettingsModalVisible(true),
    });
  }, []);

  const menuSections = useMemo(
    () => [
      {
        sectionTitle: 'OVERVIEW',
        items: [
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
        sectionTitle: 'ACTIVITY',
        items: [
          {
            id: 'community_posts',
            title: 'Community Posts',
            icon: 'chatbubble-ellipses-outline',
            color: '#7C3AED',
            bgColor: isDarkMode ? '#2D1652' : '#F5F3FF',
            badge: postsCount > 0 ? `${postsCount}` : null,
            active: activeTab === 'community_posts',
            onPress: () => handleSelectTab('community_posts'),
          },
          {
            id: 'reviews',
            title: 'Reviews',
            icon: 'star-outline',
            color: '#F59E0B',
            bgColor: isDarkMode ? '#451A03' : '#FEF3C7',
            active: activeTab === 'reviews',
            onPress: () => handleSelectTab('reviews'),
          },
          {
            id: 'create_trip',
            title: 'Create a trip',
            icon: 'map-outline',
            color: '#059669',
            bgColor: isDarkMode ? '#064E3B' : '#ECFDF5',
            onPress: () => navigation.navigate('CreateTripScreen'),
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
          {
            id: 'following',
            title: 'Following',
            icon: 'people-outline',
            color: '#3B82F6',
            bgColor: isDarkMode ? '#1E293B' : '#EFF6FF',
            badge: 'Pack 🐾',
            onPress: handleOpenFollowing,
          },
          {
            id: 'saved_places',
            title: 'Saved Places',
            icon: 'bookmark-outline',
            color: '#EC4899',
            bgColor: isDarkMode ? '#4A0E2E' : '#FDF2F8',
            onPress: handleOpenSavedPlaces,
          },
          {
            id: 'my_submissions',
            title: 'My Submissions',
            icon: 'location-outline',
            color: '#F59E0B',
            bgColor: isDarkMode ? '#451A03' : '#FEF3C7',
            badge: 'Places 📍',
            onPress: handleOpenSubmissions,
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
            onPress: () => navigation.navigate('PfpAssistantScreen'),
          },
          {
            id: 'contact_us',
            title: 'Contact us',
            icon: 'mail-outline',
            color: '#0284C7',
            bgColor: isDarkMode ? '#082F49' : '#F0F9FF',
            onPress: () => navigation.navigate('ContactUsScreen'),
          },
        ],
      },
      {
        sectionTitle: 'ACCOUNT',
        items: [
          {
            id: 'my_profile',
            title: 'My Profile',
            icon: 'person-outline',
            color: '#6366F1',
            bgColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
            onPress: handleOpenMyProfile,
          },
          {
            id: 'privacy',
            title: 'Privacy',
            icon: 'shield-checkmark-outline',
            color: '#10B981',
            bgColor: isDarkMode ? '#064E3B' : '#ECFDF5',
            badge: 'Protected 🔒',
            onPress: handleOpenPrivacy,
          },
          {
            id: 'change_password',
            title: 'Change password',
            icon: 'lock-closed-outline',
            color: '#7C3AED',
            bgColor: isDarkMode ? '#2D1652' : '#F5F3FF',
            onPress: () => navigation.navigate('ChangePasswordScreen'),
          },
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
      isDarkMode,
      activeTab,
      themeMode,
      topRank,
      postsCount,
      handleSelectTab,
      handleLogout,
      handleOpenFollowing,
      handleOpenSavedPlaces,
      handleOpenSubmissions,
      handleOpenMyProfile,
      handleOpenPrivacy,
      navigation,
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
          onPressProfile={handleOpenMyProfile}
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
                  showInfoModal(
                    'Digital Pawsport Stamps',
                    'Collect verified digital stamps each time you and your pet check in at verified cafes, parks, and stays!',
                    'PAWSPORT STAMPS',
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
                  showInfoModal(
                    'Community Posts',
                    'Share pet travel recommendations, cafe experiences, and tips with our growing pack community.',
                    'PACK COMMUNITY',
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
                  showInfoModal(
                    'Pack Leaderboard',
                    'Explore more pet places, write verified reviews, and earn badges to rise through weekly pack rankings!',
                    'TOP EXPLORERS',
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

        {/* ── TAB CONTENT: COMMUNITY POSTS (Web-Matched Design) ── */}
        {activeTab === 'community_posts' && (
          <View style={styles.tabContentContainer}>
            {/* Header: "Community Posts" + "Browse →" */}
            <View style={styles.communityHeaderRow}>
              <Text style={[styles.communityTitle, isDarkMode && styles.communityTitleDark]}>
                Community Posts
              </Text>
              <BouncyPressable
                style={styles.communityBrowseBtn}
                activeScale={0.92}
                onPress={handleBrowseCommunity}>
                <Text
                  style={[
                    styles.communityBrowseText,
                    isDarkMode && styles.communityBrowseTextDark,
                  ]}>
                  Browse
                </Text>
                <Feather
                  name="arrow-right"
                  size={ms(14)}
                  color={isDarkMode ? '#A855F7' : '#7C3AED'}
                />
              </BouncyPressable>
            </View>

            {/* Filter Sub-Tabs: All | Posts | Replies */}
            <View style={styles.communityFilterRow}>
              {[
                { id: 'all', label: 'All' },
                { id: 'posts', label: 'Posts' },
                { id: 'replies', label: 'Replies' },
              ].map(filter => {
                const isActive = communitySubFilter === filter.id;
                return (
                  <BouncyPressable
                    key={filter.id}
                    style={[
                      styles.communityFilterPill,
                      isDarkMode && styles.communityFilterPillDark,
                      isActive && styles.communityFilterPillActive,
                    ]}
                    activeScale={0.94}
                    onPress={() => setCommunitySubFilter(filter.id)}>
                    <Text
                      style={[
                        styles.communityFilterText,
                        isDarkMode && styles.communityFilterTextDark,
                        isActive && styles.communityFilterTextActive,
                      ]}>
                      {filter.label}
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>

            {/* Channel Cards (Top 2 channels matching screenshot) or Empty State */}
            {communitySubFilter === 'replies' ? (
              /* Empty State Card matching Web App */
              <View
                style={[styles.communityEmptyCard, isDarkMode && styles.communityEmptyCardDark]}>
                <Ionicons
                  name="chatbubble-outline"
                  size={ms(44)}
                  color={isDarkMode ? '#64748B' : '#94A3B8'}
                  style={styles.communityEmptyIcon}
                />
                <View style={styles.communityEmptyTextRow}>
                  <Text
                    style={[
                      styles.communityEmptyMessage,
                      isDarkMode && styles.communityEmptyMessageDark,
                    ]}>
                    No replies yet.{' '}
                  </Text>
                  <BouncyPressable activeScale={0.94} onPress={handleJoinConversation}>
                    <Text
                      style={[
                        styles.communityJoinLink,
                        isDarkMode && styles.communityJoinLinkDark,
                      ]}>
                      Join the conversation
                    </Text>
                  </BouncyPressable>
                </View>
              </View>
            ) : (
              <>
                {displayedChannels.map(channel => {
                  const isHealth = channel.id === 'health-vet-advice';
                  return (
                    <BouncyPressable
                      key={channel.id}
                      testID={`community-channel-${channel.id}`}
                      style={[
                        styles.communityChannelCard,
                        isHealth ? styles.channelBorderHealth : styles.channelBorderTravel,
                        isDarkMode && styles.communityChannelCardDark,
                      ]}
                      activeScale={0.97}
                      onPress={() =>
                        navigation.navigate('CommunityPostsScreen', {
                          initialTab: communitySubFilter,
                        })
                      }>
                      {/* Top Accent Strip matching Screenshot */}
                      <View
                        style={[
                          styles.communityChannelTopAccent,
                          isHealth ? styles.channelAccentHealth : styles.channelAccentTravel,
                        ]}
                      />

                    {/* Emoji + Title */}
                    <View style={styles.communityChannelHeaderRow}>
                      <Text style={styles.communityChannelEmoji}>{channel.emoji}</Text>
                      <Text
                        style={[
                          styles.communityChannelTitle,
                          isDarkMode && styles.textWhite,
                        ]}>
                        {channel.title}
                      </Text>
                    </View>

                    {/* Description */}
                    <Text
                      style={[
                        styles.communityChannelDesc,
                        isDarkMode && styles.textMutedDark,
                      ]}
                      numberOfLines={2}>
                      {channel.description}
                    </Text>

                    {/* Badges: Members & Posts */}
                    <View style={styles.communityChannelPillsRow}>
                      <View
                        style={[
                          styles.channelMembersPill,
                          isDarkMode && styles.channelMembersPillDark,
                        ]}>
                        <Text
                          style={[
                            styles.channelMembersText,
                            isDarkMode && styles.channelMembersTextDark,
                          ]}>
                          👥 {channel.membersCount} members
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.channelPostsPill,
                          isDarkMode && styles.channelPostsPillDark,
                        ]}>
                        <Text
                          style={[
                            styles.channelPostsText,
                            isDarkMode && styles.channelPostsTextDark,
                          ]}>
                          📝 {channel.postsCount} posts
                        </Text>
                      </View>
                    </View>
                  </BouncyPressable>
                );
              })}
              </>
            )}
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
        onChangePassword={() => navigation.navigate('ChangePasswordScreen')}
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

      {/* ── 10. Modern 3D Confirm / Alert Modal Component ── */}
      <ModernConfirmModal
        visible={confirmModalConfig.visible}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        subtitle={confirmModalConfig.subtitle}
        badge={confirmModalConfig.badge}
        type={confirmModalConfig.type}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        singleButton={confirmModalConfig.singleButton}
        isDarkMode={isDarkMode}
      />

      {/* ── 11. Ultra-Premium Floating Tails Guide AI Chat Button ── */}
      <BouncyPressable
        testID="floating-tails-guide-btn"
        accessibilityLabel="Ask Tails Guide AI"
        style={[
          styles.floatingAiFabWrap,
          {
            right: Math.max(insets.right, s(18)),
            bottom: Math.max(insets.bottom + vs(16), vs(24)),
          },
        ]}
        activeScale={0.88}
        onPress={() => navigation.navigate('TailsGuideScreen')}>
        <View style={[styles.floatingAiFabBtn, isDarkMode && styles.floatingAiFabBtnDark]}>
          <LinearGradient
            colors={['#9333EA', '#7C3AED', '#581C87']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.floatingAiFab3D}>
            {/* Sculpted 3D White Speech Bubble */}
            <View style={styles.sculptedBubble}>
              <View style={styles.bubbleDotsRow}>
                <View style={styles.bubbleDot} />
                <View style={styles.bubbleDot} />
                <View style={styles.bubbleDot} />
              </View>
              <View style={styles.bubbleTail} />
            </View>
          </LinearGradient>

          {/* Glowing Champagne Gold AI Sparkle Badge */}
          <View style={styles.fabAiSparkleBadge}>
            <Ionicons name="sparkles" size={ms(9)} color="#FDE047" />
          </View>
        </View>
      </BouncyPressable>
    </View>
  );
};

export default ProfileScreen;
