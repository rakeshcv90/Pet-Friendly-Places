import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StatusBar, Animated, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../../store';
import { useUserProfile, useMyPets, useCreatePet } from '../../hooks/useUser';
import { useMyActivity, filterActivity } from '../../hooks/useCommunity';
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
  ActivityCard,
} from './components';
import { PetCarousel } from '../Pets/components/PetCarousel';
import { Loader } from '../../components/common/Loader';
import { signOut } from '../../services/auth/signOut';
import { enableAppLock, disableAppLock, isAppLockSupported } from '../../services/security/appLock';
import styles from './styles';
import { LoaderCard } from '../../components/common/Loader';

const sanitizePet = (pet, index = 0) => {
  if (!pet) {
    return null;
  }
  // Use only values returned by the API; placeholders and blanks become ''
  const clean = (...values) => {
    const found = values.find(
      v =>
        typeof v === 'string' &&
        v.trim() !== '' &&
        v !== 'undefined' &&
        v !== 'null' &&
        !v.includes('REPLACE_ME'),
    );
    return found ? found.trim() : '';
  };

  const name = clean(pet.petName, pet.name, pet.pet_name);
  const breed = clean(pet.breed, pet.pet_breed, pet.breed_name);
  const type = clean(pet.species, pet.type, pet.pet_type);

  const id = pet.id || pet._id || `pet-${index + 1}`;
  const passportNo = clean(pet.passportNo, pet.passport_no);

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
console.log('profileData', user?.stamps_count);
  const userName = user?.name || user?.displayName || user?.display_name || user?.full_name;
  const userEmail = user?.email;
  const userInitial = (userName.trim()[0] || 'R').toUpperCase();

  // Safely resolve & sanitize pets list from API or store
  // /me/pets is the source of truth; the profile's own list and the store are fallbacks
  const { data: myPets } = useMyPets();
  const apiPets = myPets ?? profileData?.pets;
  const rawPets = apiPets && apiPets.length > 0 ? apiPets : storePets;

  const pets = useMemo(() => (rawPets || []).map((p, i) => sanitizePet(p, i)), [rawPets]);

  const [, setSelectedPetIndex] = useState(0);

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
  const myActivity = useMyActivity({
    enabled: activeTab === 'community_posts',
  });

  const handleSelectTab = useCallback(tabId => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
    }
  }, []);

  const handleBrowseCommunity = useCallback(() => {
    navigation.navigate('MyActivityScreen', { initialFilter: communitySubFilter });
  }, [navigation, communitySubFilter]);

  const handleJoinConversation = useCallback(() => {
    navigation.navigate('CommunityPostsScreen', { initialTab: communitySubFilter });
  }, [navigation, communitySubFilter]);

  const activityItems = useMemo(
    () => filterActivity(myActivity.data?.items || [], communitySubFilter),
    [myActivity.data, communitySubFilter],
  );

  // Metrics
  const petsCount = pets.length;
  const stampsCount = user?.stamps_count || 0;
  const postsCount = user?.posts_count || 0;
  const topRank = user?.rank ? `#${user.rank}` : '—';

  const createPet = useCreatePet();
  const [newPetId, setNewPetId] = useState(null);

  // Show the pet that was just added once it is in the reloaded list
  useEffect(() => {
    const index = newPetId ? pets.findIndex(pet => String(pet.id) === String(newPetId)) : -1;
    if (index >= 0) {
      setSelectedPetIndex(index);
      setNewPetId(null);
    }
  }, [pets, newPetId]);

  // Saves the pet through POST /pets. Throws on failure so the form can stay open.
  const handleAddPet = async newPet => {
    const created = await createPet.mutateAsync({
      petName: newPet.name,
      species: newPet.type,
      breed: newPet.breed,
      bio: newPet.bio,
      photo: newPet.photo,
    });
    setNewPetId(created?.id ?? created?.pet?.id ?? null);
    setConfirmModalConfig({
      visible: true,
      title: 'Pawsport Activated! 🎉',
      subtitle: `${newPet.name} is now registered on PetFriendly!`,
      badge: 'PACK PASSPORT',
      type: 'success',
      confirmText: 'Awesome!',
      cancelText: 'Close',
      singleButton: true,
      onConfirm: null,
    });
  };

  // Shared by the Dashboard and My Pets tabs: the pet carousel, or the create-first-pawsport card
  const petsSection =
    pets.length === 0 ? (
      <PawsportCard
        activePet={null}
        pets={[]}
        onAddPet={() => setAddPetModalVisible(true)}
        isDarkMode={isDarkMode}
      />
    ) : (
      <PetCarousel
        pets={pets}
        isDarkMode={isDarkMode}
        onOpen={pet => navigation.navigate('PetDetailsScreen', { pet })}
        onHealth={pet => navigation.navigate('PetHealthRecordsScreen', { pet })}
        onPawsport={pet => navigation.navigate('PawsportScreen', { pet })}
        onEdit={pet => navigation.navigate('PetEditScreen', { pet })}
        onAddPet={() => setAddPetModalVisible(true)}
      />
    );

  // App lock switch in Settings. Turning it on makes the user pass the phone's check once.
  const appLockEnabled = useStore(state => state.appLockEnabled);
  const setAppLockEnabled = useStore(state => state.setAppLockEnabled);
  const handleToggleAppLock = useCallback(
    async value => {
      if (!value) {
        await disableAppLock();
        setAppLockEnabled(false);
        return;
      }
      if (!(await isAppLockSupported())) {
        Alert.alert(
          'Set up a phone lock first',
          'Add a fingerprint, face unlock or screen PIN in your phone settings, then turn on App Lock.',
        );
        return;
      }
      if (await enableAppLock()) {
        setAppLockEnabled(true);
      }
    },
    [setAppLockEnabled],
  );

  // Tells the server (this device, or every device), then clears the device and returns to sign in
  const [signingOut, setSigningOut] = useState(false);
  const runSignOut = useCallback(async allDevices => {
    setSigningOut(true);
    await signOut({ allDevices });
    setSigningOut(false);
  }, []);

  const handleLogoutAll = useCallback(() => {
    setConfirmModalConfig({
      visible: true,
      title: 'Sign out everywhere?',
      subtitle:
        'This signs you out of PetFriendly on every phone and tablet where you are logged in, including this one.',
      badge: 'SECURITY & SESSION',
      type: 'logout',
      confirmText: 'Sign Out Everywhere',
      cancelText: 'Cancel',
      singleButton: false,
      onConfirm: () => runSignOut(true),
    });
  }, [runSignOut]);

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
      onConfirm: () => runSignOut(false),
    });
  }, [runSignOut]);

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
    navigation?.navigate?.('SavedPlacesScreen');
  }, [navigation]);

  const handleOpenSubmissions = useCallback(() => {
    navigation?.navigate?.('MySubmissionsScreen');
  }, [navigation]);

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
            onPress: () => navigation.navigate('LeaderboardScreen'),
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
          {
            id: 'logout_all',
            title: 'Log out of all devices',
            icon: 'phone-portrait-outline',
            color: '#EF4444',
            bgColor: isDarkMode ? '#450A0A' : '#FEF2F2',
            isDestructive: true,
            onPress: handleLogoutAll,
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
      handleLogoutAll,
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

            {petsSection}
          </View>
        )}

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

            {/* My activity: the signed-in user's own posts and replies for the selected filter */}
            {myActivity.isLoading ? (
              <LoaderCard
                style={styles.activityLoader}
                label="Loading your activity…"
                isDarkMode={isDarkMode}
              />
            ) : activityItems.length === 0 ? (
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
                    {myActivity.isError
                      ? 'Could not load your activity. '
                      : `No ${
                          communitySubFilter === 'all' ? 'activity' : communitySubFilter
                        } yet. `}
                  </Text>
                  <BouncyPressable
                    activeScale={0.94}
                    onPress={
                      myActivity.isError ? () => myActivity.refetch() : handleJoinConversation
                    }>
                    <Text
                      style={[
                        styles.communityJoinLink,
                        isDarkMode && styles.communityJoinLinkDark,
                      ]}>
                      {myActivity.isError ? 'Retry' : 'Join the conversation'}
                    </Text>
                  </BouncyPressable>
                </View>
              </View>
            ) : (
              <>
         
                <ActivityCard
                  item={activityItems[0]}
                  isDarkMode={isDarkMode}
                  onPress={() =>
                    navigation.navigate('CommunityPostDetailScreen', {
                      slug: activityItems[0].postSlug || activityItems[0].slug,
                    })
                  }
                />
            
              </>
            )}
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
        appLockEnabled={appLockEnabled}
        onToggleAppLock={handleToggleAppLock}
        onOpenPermissions={() => useStore.getState().setPermissionsSheetOpen(true)}
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
      <Loader visible={signingOut} title="Signing out…" />
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
