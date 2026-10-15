import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/Ionicons';

export const ProfileScreen = () => {
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
          <Text style={styles.name}>Alex Sharma</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium Member</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {['My Pets', 'My Saved Places', 'My Trips', 'My Reviews', 'My Contributions'].map((item, index) => (
            <TouchableOpacity key={item} style={[styles.menuItem, index === 4 && { borderBottomWidth: 0 }]}>
              <View style={styles.menuItemLeft}>
                <Icon name="paw-outline" size={20} color={theme.colors.text} style={styles.menuIcon} />
                <Text style={styles.menuText}>{item}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { alignItems: 'center', padding: theme.spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: theme.spacing.m },
  name: { fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.bold, color: theme.colors.text, marginBottom: 8 },
  premiumBadge: { backgroundColor: 'rgba(253, 203, 110, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  premiumText: { color: '#F39C12', fontSize: theme.typography.sizes.caption, fontWeight: theme.typography.weights.bold },
  statsContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.m, borderRadius: 16, padding: theme.spacing.m, marginBottom: theme.spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: theme.typography.sizes.h4, fontWeight: theme.typography.weights.bold, color: theme.colors.text, marginBottom: 4 },
  statLabel: { fontSize: theme.typography.sizes.caption, color: theme.colors.textSecondary },
  statDivider: { width: 1, backgroundColor: theme.colors.border },
  menuContainer: { backgroundColor: theme.colors.surface, marginHorizontal: theme.spacing.m, borderRadius: 16, padding: theme.spacing.s, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: theme.spacing.m },
  menuText: { fontSize: theme.typography.sizes.body1, color: theme.colors.text, fontWeight: theme.typography.weights.medium },
});
