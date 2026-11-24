import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TextInput, Animated, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../BouncyPressable';
import { CityPickerModal } from '../CityPickerModal';
import { useUserProfile } from '../../../hooks/useUser';
import { useStore } from '../../../store';
import { NotificationBell } from '../../notifications/NotificationBell';
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

// Three paw prints that light up one after the other, like a pet walking away
export const PawTrail = () => {
  const steps = useRef([0, 1, 2].map(() => new Animated.Value(0.25))).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        ...steps.map(step =>
          Animated.timing(step, { toValue: 1, duration: 380, useNativeDriver: true }),
        ),
        Animated.delay(250),
        Animated.parallel(
          steps.map(step =>
            Animated.timing(step, { toValue: 0.25, duration: 450, useNativeDriver: true }),
          ),
        ),
        Animated.delay(150),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [steps]);

  const spots = [
    [styles.trailPawOne, ms(9), '#B07FD0'],
    [styles.trailPawTwo, ms(11), '#9B5FCB'],
    [styles.trailPawThree, ms(9), '#8B3FD9'],
  ];

  return (
    <View testID="app-header-paws" style={styles.pawTrail}>
      {spots.map(([place, size, color], index) => (
        <Animated.View
          key={index}
          testID={`app-header-paw-${index}`}
          style={[
            place,
            {
              opacity: steps[index],
              transform: [
                ...place.transform,
                {
                  scale: steps[index].interpolate({
                    inputRange: [0.25, 1],
                    outputRange: [0.8, 1.1],
                  }),
                },
              ],
            },
          ]}>
          <Ionicons name="paw" size={size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
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
          placeholderTextColor={isDarkMode ? '#94A3B8' : '#A49AAF'}
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

      {/* <BouncyPressable style={styles.searchArrowBtn} activeScale={0.88} onPress={handleSubmit}>
        <Feather name="arrow-right" size={ms(18)} color="#FFFFFF" />
      </BouncyPressable> */}
    </Animated.View>
  );
};

export const AppHeader = ({
  subtitle,
  title = 'Pet Friendly Places',
  tagline = 'Explore karo, Sath Travel Karo!',

  // Location
  location,
  showLocation = false,
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
  const apiLocation = activeUser?.location || activeUser?.city;

  // Priority: 1. explicit prop -> 2. global store -> 3. user profile API -> 4. fallback
  const displayLocation = location || globalLocation || apiLocation || 'Delhi NCR';

  // "Explore karo, Sath Travel Karo!" -> the first part in pink, the rest in purple
  const taglineSplit = tagline.indexOf(',') + 1;
  const taglineLead = tagline.slice(0, taglineSplit);
  const taglineEnd = tagline.slice(taglineSplit);

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
          <BouncyPressable activeScale={0.88} onPress={onAvatarPress || (() => {})}>
            <Animated.View
              style={avatarTransform.length > 0 ? { transform: avatarTransform } : null}>
              {avatarComponent || (
                <View style={styles.avatarBadge} testID="app-header-avatar">
                  <View style={styles.avatarClip}>
                    <LinearGradient
                      colors={['#8A2DE2', '#EE2A7B', '#FF7A00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarGradient}>
                      <View style={styles.pawGroup}>
                        <Ionicons
                          name="paw"
                          size={ms(17)}
                          color="#28163D"
                          style={styles.pawTopLeft}
                        />
                        <Ionicons
                          name="paw"
                          size={ms(14)}
                          color="#28163D"
                          style={styles.pawBottomRight}
                        />
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              )}
            </Animated.View>
          </BouncyPressable>

          {/* Title & tagline */}
          <View style={styles.headerTextGroup}>
            {subtitle ? (
              <Text
                style={[styles.greetingSubtitle, isDarkMode && styles.greetingSubtitleDark]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <Text
              testID="app-header-title"
              style={[styles.greetingTitle, isDarkMode && styles.greetingTitleDark]}
              numberOfLines={1}>
              {title}
            </Text>

            {showLocation ? (
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
            ) : (
              <View style={styles.taglineRow}>
                <Text
                  testID="app-header-tagline"
                  style={styles.tagline}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}>
                  <Text style={styles.taglinePink}>{taglineLead}</Text>
                  <Text style={styles.taglinePurple}>{taglineEnd}</Text>
                </Text>
                <PawTrail />
              </View>
            )}
          </View>
        </View>

        {/* Right Component / Notification Bell Button */}
        {rightComponent ? (
          rightComponent
        ) : showNotification ? (
          <NotificationBell isDarkMode={isDarkMode} onPress={onNotificationPress} />
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
