import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { s } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/common/Button';
import { theme } from '../../../theme';

export const VerifyOTPScreen = ({ navigation }) => {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input
    if (text && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 5) {
      navigation.navigate('SetNewPassword');
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

        <View style={styles.illustrationContainer}>
          <Image source={theme.images.pass} style={styles.illustrationImage} resizeMode="contain" />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 5-digit code sent to your email</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputActive]}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Resend OTP <Text style={styles.timerText}>({formatTime(timer)})</Text>
            </Text>
          </View>

          <Button
            title="Verify"
            onPress={handleVerify}
            style={styles.verifyButton}
            disabled={otp.join('').length !== 5}
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
    marginLeft: -8, // Counteract default icon padding
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  illustrationImage: {
    width: s(300),
    height: s(200),
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body1,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  form: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
  },
  otpInput: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.dimensions.borderRadius.large,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
    fontSize: theme.typography.sizes.h2,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  otpInputActive: {
    borderColor: theme.colors.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resendText: {
    fontSize: theme.typography.sizes.body1,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  timerText: {
    color: theme.colors.primary,
  },
  verifyButton: {
    marginBottom: theme.spacing.xl,
  },
});
