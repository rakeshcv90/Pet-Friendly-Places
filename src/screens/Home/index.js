import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

const CATEGORIES = [
  { id: '1', name: 'Stays', icon: 'home', color: '#014A37', bgColor: '#F4F7F4' },
  { id: '2', name: 'Cafes &\nRestaurants', icon: 'cafe', color: '#ED5D27', bgColor: '#FFF2EA' },
  { id: '3', name: 'Parks &\nNature', icon: 'leaf', color: '#00B894', bgColor: '#F0F8F1' },
  { id: '4', name: 'Pet Care', icon: 'medkit', color: '#ED5D27', bgColor: '#FFF2EA' },
  { id: '5', name: 'Road Trips', icon: 'paw', color: '#ED5D27', bgColor: '#FFF2EA' },
  { id: '6', name: 'Transport', icon: 'bus', color: '#0984E3', bgColor: '#EBF4FA' },
  { id: '7', name: 'Caravans', icon: 'car', color: '#014A37', bgColor: '#F4F7F4' },
  { id: '8', name: 'More', icon: 'swap-vertical', color: '#ED5D27', bgColor: '#FFF2EA' },
];

const PLACES = [
  {
    id: '1',
    name: 'The Himalayan View Resort',
    location: 'Nainital, Uttarakhand',
    rating: '4.8',
    reviews: '124',
    price: '₹6,500/night',
    image:
      'https://images.unsplash.com/photo-1542314831-c53cd3816002?q=80&w=600&auto=format&fit=crop',
    verified: true,
  },
];

export const HomeScreen = () => {
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
            <View style={styles.userText}>
              <Text style={styles.greeting}>Good Morning, Alex</Text>
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={ms(12)} color="#A0A0A0" />
                <Text style={styles.location}>Delhi NCR</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.headerIconBtn}>
            {/* Using a paw icon to mimic the custom dog bone icon in the mockup */}
            <Icon name="paw-outline" size={ms(22)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={ms(18)} color={'#A0A0A0'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places, cities, categories..."
            placeholderTextColor="#A0A0A0"
          />
        </View>

        {/* Hero Banner */}
        <ImageBackground
          source={theme.images.home}
          style={styles.heroBanner}
          resizeMode="stretchex"
          imageStyle={{ borderRadius: s(15) }}>
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.heroBtn} activeOpacity={0.9}>
              <Text style={styles.heroBtnText}>Explore Now</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem}>
              <View style={[styles.categoryIconContainer, { backgroundColor: cat.bgColor }]}>
                <Icon name={cat.icon} size={ms(26)} color={cat.color} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tails Verified Featured Card */}
        <View style={styles.sectionHeaderInner}>
          <Text style={styles.sectionTitleInner}>Tails Verified</Text>
          <TouchableOpacity>
            <Icon name="chevron-forward" size={ms(16)} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.verifiedFeaturedCard}>
          <View style={styles.verifiedRowContent}>
            <Image source={{ uri: PLACES[0].image }} style={styles.verifiedRowImage} />
            <View style={styles.verifiedRowInfo}>
              <View>
                <Text style={styles.verifiedRowName} numberOfLines={1}>
                  {PLACES[0].name}
                </Text>
                <Text style={styles.verifiedRowLocation} numberOfLines={1}>
                  {PLACES[0].location}
                </Text>
              </View>
              <View style={styles.verifiedRowBottom}>
                <View style={styles.ratingRow}>
                  <Icon name="star" size={ms(12)} color="#ED5D27" />
                  <Text style={styles.ratingText}>
                    {PLACES[0].rating} <Text style={styles.ratingCount}>({PLACES[0].reviews})</Text>
                  </Text>
                </View>
                <Text style={styles.verifiedRowPrice}>{PLACES[0].price}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Perfectly matches the creamy warm background in the target image
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(40),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#E8E5DF',
  },
  userText: {
    marginLeft: s(10),
    justifyContent: 'center',
  },
  greeting: {
    fontSize: ms(13),
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: vs(2),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: ms(11),
    color: '#A0A0A0',
    marginLeft: s(4),
    fontWeight: '500',
  },
  headerIconBtn: {
    padding: s(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    paddingHorizontal: s(16),
    height: vs(44),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#F0EFEA',
  },
  searchIcon: {
    marginRight: s(10),
  },
  searchInput: {
    flex: 1,
    fontSize: ms(13),
    color: '#1C1C1E',
  },
  heroBanner: {
    height: vs(170), // Adjusted height to match the compact ratio
    width: '100%',
    marginBottom: vs(20),
    backgroundColor: '#E8E5DF',
    borderRadius: s(16),
  },
  heroOverlay: {
    flex: 1,
    borderRadius: s(16),
    padding: s(16),
    // Using absolute positioning to precisely place the button below the baked text
  },
  heroBtn: {
    position: 'absolute',
    bottom: vs(10), // Move it closer to the bottom edge to clear the "your pet" text
    left: s(16), // Align it with the left padding
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(15),
    paddingVertical: vs(5),
    borderRadius: s(16),
  },
  heroBtnText: {
    color: theme.colors.primary,
    fontSize: ms(12),
    fontWeight: '700',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  categoryItem: {
    width: '24%', // 4 items per row
    alignItems: 'center',
    marginBottom: vs(16), // Reduced margin to pull rows closer together
  },
  categoryIconContainer: {
    width: s(54),
    height: s(54),
    borderRadius: s(16), // SQUIRCLE shape, exactly like the mockup!
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  categoryName: {
    fontSize: ms(10),
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: ms(12),
  },
  sectionHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  sectionTitleInner: {
    fontSize: ms(16),
    fontWeight: '800',
    color: theme.colors.primary,
  },
  verifiedFeaturedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#F0EFEA',
    marginBottom: vs(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  verifiedRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedRowImage: {
    width: s(72),
    height: s(72),
    borderRadius: s(12),
    backgroundColor: '#E8E5DF',
  },
  verifiedRowInfo: {
    flex: 1,
    marginLeft: s(12),
    height: vs(72),
    justifyContent: 'space-between',
    paddingVertical: vs(2),
  },
  verifiedRowName: {
    fontSize: ms(13),
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: vs(2),
  },
  verifiedRowLocation: {
    fontSize: ms(11),
    color: '#A0A0A0',
  },
  verifiedRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: ms(11),
    color: '#1C1C1E',
    fontWeight: '600',
    marginLeft: s(4),
  },
  ratingCount: {
    color: '#A0A0A0',
    fontWeight: '400',
  },
  verifiedRowPrice: {
    fontSize: ms(13),
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
