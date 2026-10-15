import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

export const Input = ({
  label,
  labelStyle,
  inputWrapperStyle,
  inputStyle,
  error,
  style,
  leftIcon,
  rightIcon,
  onRightIconPress,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          inputWrapperStyle,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={placeholderTextColor || theme.colors.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} activeOpacity={0.7}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  label: {
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.sizes.body2,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  inputWrapper: {
    height: 48,
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: theme.dimensions.borderRadius.medium,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: theme.colors.primaryDark,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: theme.spacing.m,
    fontSize: theme.typography.sizes.body1,
    color: theme.colors.text,
  },
  leftIcon: {
    paddingLeft: theme.spacing.m,
  },
  rightIcon: {
    paddingRight: theme.spacing.m,
  },
  error: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.error,
  },
});
