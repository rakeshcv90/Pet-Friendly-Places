import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../theme';
import { POPULAR_CITIES } from '../../../utils/cities';

export const CityPickerModal = ({
  visible = false,
  selectedCity = '',
  onSelectCity,
  onClose,
  cities = POPULAR_CITIES,
  title = 'Select your city',
}) => {
  const insets = useSafeAreaInsets();
  const [citySearch, setCitySearch] = useState('');
  const searchInputRef = useRef(null);

  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase()),
  );

  const handleClose = () => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    setCitySearch('');
    if (onClose) {
      onClose();
    }
  };

  const handleSelect = item => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    setCitySearch('');
    requestAnimationFrame(() => {
      if (onSelectCity) {
        onSelectCity(item);
      }
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                { paddingBottom: Math.max(insets.bottom, s(16)) },
              ]}>
              {/* Drag Grabber Indicator */}
              <View style={styles.modalGrabber} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleGroup}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} available
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={s(18)} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Real-time City Search Bar */}
              <View style={styles.modalSearchContainer}>
                <FeatherIcon
                  name="search"
                  size={s(16)}
                  color="#94A3B8"
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={styles.modalSearchInput}
                  placeholder="Search city (e.g. Mumbai, Bengaluru)..."
                  placeholderTextColor="#94A3B8"
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {citySearch.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setCitySearch('')}
                    style={styles.clearSearchButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={s(17)} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* City Options List */}
              <FlatList
                data={filteredCities}
                keyExtractor={item => item}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.cityListContent}
                ListEmptyComponent={
                  <View style={styles.emptySearchContainer}>
                    <View style={styles.emptyIconBadge}>
                      <FeatherIcon name="map-pin" size={s(26)} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptySearchTitle}>No cities found</Text>
                    <Text style={styles.emptySearchSubtitle}>
                      No matches found for "{citySearch}".
                    </Text>
                    <TouchableOpacity
                      style={styles.selectOtherButton}
                      onPress={() => handleSelect('Other')}
                      activeOpacity={0.7}>
                      <Text style={styles.selectOtherButtonText}>Select "Other"</Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedCity === item;
                  return (
                    <TouchableOpacity
                      style={[styles.cityOption, isSelected && styles.cityOptionSelected]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}>
                      <View style={styles.cityOptionLeft}>
                        <View
                          style={[
                            styles.cityPinBadge,
                            isSelected && styles.cityPinBadgeSelected,
                          ]}>
                          <FeatherIcon
                            name="map-pin"
                            size={s(14)}
                            color={isSelected ? '#FFFFFF' : theme.colors.primaryDark}
                          />
                        </View>
                        <Text
                          style={[
                            styles.cityOptionText,
                            isSelected && styles.cityOptionTextSelected,
                          ]}>
                          {item}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkedCircle}>
                          <Ionicons name="checkmark" size={s(13)} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.uncheckedCircle} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    paddingTop: s(12),
    paddingHorizontal: s(20),
    maxHeight: '80%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 25,
  },
  modalGrabber: {
    width: s(40),
    height: s(4.5),
    borderRadius: s(3),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: s(14),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: s(12),
  },
  modalHeaderTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
    marginTop: s(2),
  },
  modalCloseButton: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: s(12),
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    height: s(44),
    marginBottom: s(12),
  },
  searchIcon: {
    marginRight: s(8),
  },
  modalSearchInput: {
    flex: 1,
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primaryDark,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: s(4),
  },
  cityListContent: {
    paddingBottom: s(10),
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: s(10),
    paddingHorizontal: s(12),
    borderRadius: s(14),
    marginBottom: s(4),
  },
  cityOptionSelected: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
  },
  cityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityPinBadge: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(12),
  },
  cityPinBadgeSelected: {
    backgroundColor: theme.colors.primary,
  },
  cityOptionText: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primaryDark,
  },
  cityOptionTextSelected: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  checkedCircle: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedCircle: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: s(32),
    paddingHorizontal: s(20),
  },
  emptyIconBadge: {
    width: s(54),
    height: s(54),
    borderRadius: s(27),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s(12),
  },
  emptySearchTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    marginBottom: s(4),
  },
  emptySearchSubtitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: s(16),
  },
  selectOtherButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: s(18),
    paddingVertical: s(10),
    borderRadius: s(12),
  },
  selectOtherButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(13),
  },
});

export default CityPickerModal;
