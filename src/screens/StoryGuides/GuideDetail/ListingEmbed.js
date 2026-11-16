import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { useListingDetail, resolveImageUrl } from '../../../hooks/useDiscovery';
import { styles } from './styles/body';

const titleCaseSlug = slug =>
  slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const ListingEmbed = React.memo(function ListingEmbed({ slug, isDarkMode, onLinkPress }) {
  const { data } = useListingDetail(slug);
  const listing = data?.listing || data || null;

  const name = listing?.name || titleCaseSlug(slug);
  const location = [listing?.city, listing?.state].filter(Boolean).join(', ');
  const isVerified = Boolean(listing?.tails_verified || listing?.verification_status === 'verified');
  const petCharges = listing?.pet_charges;

  const photos = (Array.isArray(listing?.images) ? listing.images : [])
    .filter(img => img?.image_url && (!img.media_type || img.media_type === 'image'))
    .sort((x, y) => Number(Boolean(y.is_main)) - Number(Boolean(x.is_main)))
    .slice(0, 3)
    .map(img => resolveImageUrl(img.image_url));
  if (!photos.length && listing?.main_image_url) {
    photos.push(resolveImageUrl(listing.main_image_url));
  }

  const open = () => onLinkPress && onLinkPress(`/places/${slug}`);

  return (
    <View style={[styles.listingEmbed, isDarkMode && styles.listingEmbedDark]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={open}
        style={[styles.listingEmbedHeader, isDarkMode && styles.listingEmbedHeaderDark]}>
        <View style={styles.listingEmbedTitleWrap}>
          <Text
            numberOfLines={2}
            style={[styles.listingEmbedName, isDarkMode && styles.listingEmbedNameDark]}>
            {name}
            {isVerified ? '  ' : ''}
          </Text>
          {isVerified ? <Ionicons name="checkmark-circle" size={ms(16)} color="#7C3AED" /> : null}
        </View>
        <Text style={styles.listingEmbedLink}>See full listing →</Text>
      </TouchableOpacity>

      {photos.length > 0 ? (
        <View style={styles.listingEmbedPhotos}>
          {photos.map((uri, i) => (
            <FastImage
              key={i}
              source={{ uri }}
              style={styles.listingEmbedPhoto}
              resizeMode={FastImage.resizeMode.cover}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.listingEmbedBody}>
        {location ? (
          <Text style={[styles.listingEmbedLocation, isDarkMode && styles.listingEmbedMetaDark]}>
            📍 {location}
          </Text>
        ) : null}
        {listing?.excerpt ? (
          <Text
            numberOfLines={2}
            style={[styles.listingEmbedExcerpt, isDarkMode && styles.listingEmbedExcerptDark]}>
            {listing.excerpt}
          </Text>
        ) : null}
        {petCharges ? (
          <Text style={[styles.listingEmbedCharges, isDarkMode && styles.listingEmbedExcerptDark]}>
            <Text style={styles.listingEmbedChargesLabel}>Pet charges: </Text>
            {petCharges}
          </Text>
        ) : null}
      </View>
    </View>
  );
});
