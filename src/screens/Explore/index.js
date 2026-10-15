import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

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
    tags: ['Pet friendly', 'Mountain View', 'Tails Verified'],
  },
  {
    id: '2',
    name: 'The Barking Bean',
    location: 'Bengaluru, Karnataka',
    rating: '4.6',
    reviews: '98',
    price: '₹400 for 2',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop',
    verified: true,
    tags: ['Pet friendly', 'Cafe', 'Outdoor Seating'],
  },
];

const FILTERS = ['All', 'Stays', 'Cafes', 'Parks', 'Vets'];

export const ExploreScreen = () => {
  const [activeTab, setActiveTab] = useState('List');
  const [activeFilter, setActiveFilter] = useState('All');

  const renderPlaceCard = ({ item }) => (
    <TouchableOpacity style={styles.placeCard} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.placeImage}
        imageStyle={styles.placeImageInner}>
        
        {/* Top Badges overlay on image */}
        <View style={styles.imageOverlayTop}>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Icon name="paw" size={ms(12)} color={theme.colors.primary} />
              <Text style={styles.verifiedText}>Tails Verified</Text>
            </View>
          )}
          <TouchableOpacity style={styles.heartBtn}>
            <Icon name="heart-outline" size={ms(20)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.placeInfo}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.placeLocation} numberOfLines={1}>
          {item.location}
        </Text>

        <View style={styles.ratingPriceRow}>
          <View style={styles.ratingRow}>
            <Icon name="star" size={ms(14)} color="#ED5D27" />
            <Text style={styles.ratingText}>
              {item.rating} <Text style={styles.ratingCount}>({item.reviews})</Text>
            </Text>
          </View>
          <Text style={styles.placePrice}>{item.price}</Text>
        </View>

        {/* Tags Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsScroll}>
          {item.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              {tag === 'Pet friendly' && (
                <Icon name="paw-outline" size={ms(10)} color={theme.colors.primary} style={styles.tagIcon} />
              )}
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Find the best pet-friendly places</Text>
        </View>
        <TouchableOpacity>
          <Icon name="chevron-forward" size={ms(24)} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* List / Map Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'List' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('List')}>
          <Icon
            name="list-outline"
            size={ms(18)}
            color={activeTab === 'List' ? '#FFFFFF' : '#A0A0A0'}
          />
          <Text style={[styles.toggleText, activeTab === 'List' && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'Map' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('Map')}>
          <Icon
            name="map-outline"
            size={ms(18)}
            color={activeTab === 'Map' ? '#FFFFFF' : '#A0A0A0'}
          />
          <Text style={[styles.toggleText, activeTab === 'Map' && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Horizontal Scroll */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List of Places */}
      <FlatList
        data={PLACES}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderPlaceCard}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Match the Home screen premium cream background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    marginBottom: vs(16),
  },
  headerTitle: {
    fontSize: ms(28),
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: vs(4),
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: ms(13),
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    borderRadius: s(24),
    padding: s(4),
    borderWidth: 1,
    borderColor: '#F0EFEA',
    marginBottom: vs(16),
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
    borderRadius: s(20),
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: ms(14),
    fontWeight: '600',
    color: '#A0A0A0',
    marginLeft: s(6),
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  filtersWrapper: {
    marginBottom: vs(16),
  },
  filtersScroll: {
    paddingHorizontal: s(16),
  },
  filterChip: {
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    marginRight: s(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: ms(13),
    color: '#A0A0A0',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: s(16),
    paddingBottom: vs(40),
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#F0EFEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  placeImage: {
    width: '100%',
    height: vs(125), // Reduced height significantly for a wider aspect ratio
    backgroundColor: '#E8E5DF',
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
  },
  placeImageInner: {
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
  },
  imageOverlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: s(10), // Tighter padding
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  verifiedText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: s(4),
  },
  heartBtn: {
    padding: s(2),
  },
  placeInfo: {
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(12),
  },
  placeName: {
    fontSize: ms(15),
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: vs(2),
  },
  placeLocation: {
    fontSize: ms(11),
    color: '#A0A0A0',
    fontWeight: '500',
    marginBottom: vs(6), // Tighten here
  },
  ratingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(8), // Tighten here
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: ms(12),
    color: '#1C1C1E',
    fontWeight: '700',
    marginLeft: s(4),
  },
  ratingCount: {
    color: '#A0A0A0',
    fontWeight: '500',
  },
  placePrice: {
    fontSize: ms(13),
    fontWeight: '800',
    color: theme.colors.primary,
  },
  tagsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F4',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(8),
    marginRight: s(6), // Tighter margin between tags
  },
  tagIcon: {
    marginRight: s(4),
  },
  tagText: {
    fontSize: ms(9),
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
