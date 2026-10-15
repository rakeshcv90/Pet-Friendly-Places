import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { s } from 'react-native-size-matters';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { theme } from '../../../theme';

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleSendOTP = () => {
    if (email) {
      // In a real app, send OTP logic here
      navigation.navigate('VerifyOTP');
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
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>Enter your email to get a reset link</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button title="Send OTP" onPress={handleSendOTP} style={styles.sendButton} />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with Google"
            variant="outline"
            leftIcon={<Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={styles.googleIconImage} />}
            style={styles.googleButton}
            textStyle={styles.googleButtonText}
          />
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
    marginLeft: -8, // Counteract default icon padding to strictly align with text
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
  sendButton: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.m,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: theme.spacing.m,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body2,
  },
  googleButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    flexDirection: 'row',
  },
  googleButtonText: {
    color: theme.colors.text,
  },
  googleIconImage: {
    width: s(20),
    height: s(20),
    marginRight: theme.spacing.s,
  },
});
