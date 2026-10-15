import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../theme';
import { s } from 'react-native-size-matters';

export const Header = ({ onBack, title }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Icon name="chevron-left" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: s(50),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  backButton: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.m,
  },
  backText: {
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.text,
  },
  title: {
    fontSize: theme.typography.sizes.h3,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semiBold,
  },
});
