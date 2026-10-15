import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { s } from 'react-native-size-matters';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { theme } from '../../../theme';

export const SetNewPasswordScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    if (password && confirmPassword && password === confirmPassword) {
      navigation.navigate('PasswordResetSuccess');
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>
            Your new password must be different from previous one.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="New Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={
              <Icon
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={theme.colors.textSecondary}
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <Icon
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={20}
                color={theme.colors.textSecondary}
              />
            }
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            style={styles.resetButton}
            disabled={!password || !confirmPassword || password !== confirmPassword}
          />
        </View>

        <View style={styles.imagePlaceholder}>
          <Image source={theme.images.pet} style={styles.illustrationImage} resizeMode="contain" />
        </View>
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: s(30),
  },
  backButton: {
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
    marginLeft: -8, // Counteract default icon padding
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body1,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  form: {
    flex: 1,
  },
  resetButton: {
    marginTop: theme.spacing.l,
  },
  imagePlaceholder: {
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  illustrationImage: {
    width: s(350),
    height: s(250),
    marginBottom: theme.spacing.m,
  },
  imageSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body2,
    fontWeight: theme.typography.weights.medium,
  },
});
