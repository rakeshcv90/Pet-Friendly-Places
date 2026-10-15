import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { s } from 'react-native-size-matters';
import { theme } from '../../../theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  contentStyle,
  isLoading,
  disabled,
  leftIcon,
  gradientColors,
  width,
}) => {
  const isPrimary = variant === 'primary';
  const colors =
    gradientColors ||
    theme.colors.primaryGradient ||
    ['rgb(59, 16, 143)', 'rgb(123, 44, 255)'];
  const textColor = isPrimary ? theme.colors.surface : theme.colors.primary;

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator color={textColor} />;
    }
    return (
      <>
        {leftIcon}
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.outlineText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      </>
    );
  };

  const customWidthStyle = width ? { width, alignSelf: 'center' } : null;

  if (isPrimary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.85}
        style={[
          styles.touchable,
          styles.shadow,
          (disabled || isLoading) && styles.disabled,
          customWidthStyle,
          style,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContainer, contentStyle]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        styles.outlineContainer,
        (disabled || isLoading) && styles.disabled,
        customWidthStyle,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: theme.dimensions.borderRadius.round,
  },
  shadow: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientContainer: {
    width: '100%',
    height: s(52),
    borderRadius: theme.dimensions.borderRadius.round,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    flexDirection: 'row',
  },
  container: {
    height: s(52),
    borderRadius: theme.dimensions.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    flexDirection: 'row',
  },
  outlineContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border || theme.colors.primary,
    borderWidth: 1,
  },
  text: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: theme.typography.weights.bold,
  },
  primaryText: {
    color: theme.colors.surface,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
