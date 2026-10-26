import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Animated, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../BouncyPressable';
import { CityPickerModal } from '../CityPickerModal';
import { useUserProfile } from '../../../hooks/useUser';
import { useStore } from '../../../store';
import { styles } from './styles';

export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return 'GOOD MORNING';
  }
  if (hour >= 12 && hour < 17) {
    return 'GOOD AFTERNOON';
  }
  if (hour >= 17 && hour < 22) {
    return 'GOOD EVENING';
  }
  return 'GOOD NIGHT';
};

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search places, cities, categories',
  onSearchSubmit,
  onSearchPress,
  searchEditable = true,
  searchBarScale,
  searchIconRotate,
  containerStyle,
  inputStyle,
}) => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const [internalQuery, setInternalQuery] = useState('');
  const query = searchQuery !== undefined ? searchQuery : internalQuery;
  const setQuery = onSearchChange || setInternalQuery;

  const handleSubmit = () => {
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  const barTransform = useMemo(() => {
    return searchBarScale ? [{ scale: searchBarScale }] : [];
  }, [searchBarScale]);

  const iconTransform = useMemo(() => {
    return searchIconRotate ? [{ rotate: searchIconRotate }] : [];
  }, [searchIconRotate]);

  return (
    <Animated.View
      style={[
        styles.searchBar,
        isDarkMode && styles.searchBarDark,
        barTransform.length > 0 && { transform: barTransform },
        containerStyle,
      ]}>
      <Animated.View style={iconTransform.length > 0 ? { transform: iconTransform } : null}>
        <Feather
          name="search"
          size={ms(19)}
          color={isDarkMode ? '#A855F7' : '#7B2CFF'}
          style={styles.searchIcon}
        />
      </Animated.View>

      {searchEditable ? (
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.searchInputDark, inputStyle]}
          placeholder={searchPlaceholder}
          placeholderTextColor={isDarkMode ? '#94A3B8' : '#A09AA8'}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />
      ) : (
        <Pressable style={styles.searchFakeInput} onPress={onSearchPress || handleSubmit}>
          <Text
            style={[
              styles.searchPlaceholder,
              isDarkMode && styles.searchPlaceholderDark,
              query ? (isDarkMode ? styles.searchFilledTextDark : styles.searchFilledText) : null,
            ]}
            numberOfLines={1}>
            {query || searchPlaceholder}
          </Text>
        </Pressable>
      )}

      <BouncyPressable style={styles.searchArrowBtn} activeScale={0.88} onPress={handleSubmit}>
        <Feather name="arrow-right" size={ms(18)} color="#FFFFFF" />
      </BouncyPressable>
    </Animated.View>
  );
};

export const AppHeader = ({
  userName,

  subtitle,
  title = 'Where to with your bestie?',

  // Location
  location,
  showLocation = true,
  locationActionText = 'Change',
  onLocationPress,
  onSelectCity,
  enableCityPicker = true,

  // Avatar
  onAvatarPress,
  avatarComponent,
  avatarScale,
  avatarRotate,

  // Notification
  showNotification = true,
  hasNotification = true,
  onNotificationPress,
  rightComponent,

  // Search Bar
  showSearch = true,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search places, cities, categories',
  onSearchSubmit,
  onSearchPress,
  searchEditable = true,
  searchBarScale,
  searchIconRotate,

  // Styles
  style,
  headerStyle,
  searchBarStyle,
  searchInputStyle,
}) => {
  const [isCityPickerVisible, setCityPickerVisible] = useState(false);

  // Global location & Dark mode from Zustand
  const isDarkMode = useStore(state => state.isDarkMode);
  const globalLocation = useStore(state => state.currentLocation);
  const setCurrentLocation = useStore(state => state.setCurrentLocation);

  // Fallback user resolution & location from API
  const { data: userProfile } = useUserProfile();
  const storeUser = useStore(state => state.user);
  const activeUser =
    userProfile?.account ||
    userProfile?.user ||
    (userProfile?.id ? userProfile : null) ||
    storeUser;
  const resolvedUserName =
    userName ||
    activeUser?.name ||
    activeUser?.displayName ||
    activeUser?.display_name ||
    activeUser?.full_name ||
    'Pet Parent';

  const apiLocation = activeUser?.location || activeUser?.city;

  // Priority: 1. explicit prop -> 2. global store -> 3. user profile API -> 4. fallback
  const displayLocation = location || globalLocation || apiLocation || 'Delhi NCR';

  const resolvedGreeting = getTimeGreeting();
  const resolvedSubtitle = subtitle || `${resolvedGreeting}, ${resolvedUserName.toUpperCase()}`;

  const handleLocationPress = () => {
    if (onLocationPress) {
      onLocationPress();
    } else if (enableCityPicker) {
      setCityPickerVisible(true);
    }
  };

  const handleCitySelect = selected => {
    // Globally update location across the whole app
    if (setCurrentLocation) {
      setCurrentLocation(selected);
    }
    setCityPickerVisible(false);
    if (onSelectCity) {
      onSelectCity(selected);
    }
  };

  const avatarTransform = useMemo(() => {
    const list = [];
    if (avatarScale) {
      list.push({ scale: avatarScale });
    }
    if (avatarRotate) {
      list.push({ rotate: avatarRotate });
    }
    return list;
  }, [avatarScale, avatarRotate]);

  return (
    <View style={[styles.container, style]}>
      {/* ── 1. Top Header Row ── */}
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerLeft}>
          {/* Avatar Badge */}
          <BouncyPressable activeScale={0.88} onPress={onAvatarPress || (() => {})}>
            <Animated.View
              style={avatarTransform.length > 0 ? { transform: avatarTransform } : null}>
              {avatarComponent || (
                <LinearGradient
                  colors={['#8A2DE2', '#EE2A7B', '#FF7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarBadge}>
                  <View style={styles.pawGroup}>
                    <Ionicons name="paw" size={ms(17)} color="#28163D" style={styles.pawTopLeft} />
                    <Ionicons
                      name="paw"
                      size={ms(14)}
                      color="#28163D"
                      style={styles.pawBottomRight}
                    />
                  </View>
                </LinearGradient>
              )}
            </Animated.View>
          </BouncyPressable>

          {/* Greeting & Location */}
          <View style={styles.headerTextGroup}>
            <Text
              style={[styles.greetingSubtitle, isDarkMode && styles.greetingSubtitleDark]}
              numberOfLines={1}>
              {resolvedSubtitle}
            </Text>
            <Text
              style={[styles.greetingTitle, isDarkMode && styles.greetingTitleDark]}
              numberOfLines={1}>
              {title}
            </Text>

            {showLocation && (
              <BouncyPressable
                activeScale={0.93}
                style={styles.locationRow}
                onPress={handleLocationPress}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons
                  name="location-sharp"
                  size={ms(12)}
                  color={isDarkMode ? '#A855F7' : '#7B2CFF'}
                />
                <Text style={[styles.locationCity, isDarkMode && styles.locationCityDark]}>
                  {displayLocation}{' '}
                </Text>
                <Text style={[styles.locationChange, isDarkMode && styles.locationChangeDark]}>
                  {locationActionText}
                </Text>
              </BouncyPressable>
            )}
          </View>
        </View>

        {/* Right Component / Notification Bell Button */}
        {rightComponent ? (
          rightComponent
        ) : showNotification ? (
          <BouncyPressable
            style={[styles.notificationBtn, isDarkMode && styles.notificationBtnDark]}
            activeScale={0.85}
            onPress={onNotificationPress || (() => {})}>
            <Feather name="bell" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
            {hasNotification && <View style={styles.notificationDot} />}
          </BouncyPressable>
        ) : null}
      </View>

      {/* ── 2. Search Bar ── */}
      {showSearch && (
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onSearchSubmit={onSearchSubmit}
          onSearchPress={onSearchPress}
          searchEditable={searchEditable}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
          containerStyle={searchBarStyle}
          inputStyle={searchInputStyle}
        />
      )}

      {/* City Picker Modal */}
      {enableCityPicker && (
        <CityPickerModal
          visible={isCityPickerVisible}
          selectedCity={displayLocation}
          onSelectCity={handleCitySelect}
          onClose={() => setCityPickerVisible(false)}
        />
      )}
    </View>
  );
};

export const MainHeader = AppHeader;
export const HomeHeader = AppHeader;
export default AppHeader;
