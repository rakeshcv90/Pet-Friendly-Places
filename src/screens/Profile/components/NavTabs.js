import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const NavTabs = ({
  tabs = [],
  activeTab,
  onSelectTab,
  accentColor = '#7C3AED',
  isDarkMode = false,
}) => {
  return (
    <View style={styles.navTabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navTabsScrollContent}>
        {tabs.map(tab => {
          const isSelected = activeTab === tab.id;
          return (
            <BouncyPressable
              key={tab.id}
              style={[
                styles.navTabPill,
                isSelected && [styles.navTabPillActive, { borderColor: accentColor }],
                isDarkMode && styles.navTabPillDark,
                isSelected && isDarkMode && styles.navTabPillActiveDark,
              ]}
              activeScale={0.92}
              onPress={() => onSelectTab(tab.id)}>
              <Ionicons
                name={tab.icon}
                size={ms(12)}
                color={isSelected ? accentColor : isDarkMode ? '#94A3B8' : '#64748B'}
                style={styles.navTabIcon}
              />
              <Text
                style={[
                  styles.navTabText,
                  isDarkMode && styles.navTabTextDark,
                  isSelected && [styles.navTabTextActive, { color: accentColor }],
                ]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count !== null && (
                <View
                  style={[
                    styles.navTabCountBadge,
                    isSelected && { backgroundColor: accentColor },
                    isDarkMode && !isSelected && styles.navTabCountBadgeDark,
                  ]}>
                  <Text
                    style={[
                      styles.navTabCountText,
                      isSelected && styles.navTabCountTextActive,
                    ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </BouncyPressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default NavTabs;

const styles = StyleSheet.create({
  navTabsContainer: {
    marginTop: vs(10),
    marginBottom: vs(4),
  },
  navTabsScrollContent: {
    paddingHorizontal: s(16),
  },
  navTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    marginRight: s(8),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navTabPillDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  navTabPillActive: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  navTabPillActiveDark: {
    backgroundColor: '#2A104E',
  },
  navTabIcon: {
    marginRight: s(5),
  },
  navTabText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
  },
  navTabTextDark: {
    color: '#94A3B8',
  },
  navTabTextActive: {
    color: '#7C3AED',
  },
  navTabCountBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: s(10),
    paddingHorizontal: s(5.5),
    paddingVertical: vs(1.5),
    marginLeft: s(5),
  },
  navTabCountBadgeDark: {
    backgroundColor: '#331B58',
  },
  navTabCountText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#475569',
  },
  navTabCountTextActive: {
    color: '#FFFFFF',
  },
});
