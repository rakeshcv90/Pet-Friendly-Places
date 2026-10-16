import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { s } from 'react-native-size-matters';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/common/Button';
import { theme } from '../../../theme';
import Icon from 'react-native-vector-icons/Feather';
import { Image } from 'react-native';

export const PasswordResetSuccessScreen = ({ navigation }) => {
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [circleScale, checkScale]);

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.outerCircle, { transform: [{ scale: circleScale }] }]}>
              <Animated.View style={[styles.innerCircle, { transform: [{ scale: checkScale }] }]}>
                <Icon name="check" size={40} color={theme.colors.surface} />
              </Animated.View>
            </Animated.View>
          </View>

          <Text style={styles.title}>Password Reset</Text>
          <Text style={styles.subtitle}>Your password has been{'\n'}successfully reset.</Text>

          <Button
            title="Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Splash')}>
            <Text style={styles.backText}>Back to home</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imagePlaceholder}>
          <Image source={theme.images.pet2} style={styles.illustrationImage} resizeMode="contain" />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: s(60),
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  outerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.body1,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  loginButton: {
    width: '100%',
    marginBottom: theme.spacing.l,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.body1,
    fontFamily: theme.typography.fontFamily.medium,
  },
  imagePlaceholder: {
    alignItems: 'center',
    width: '100%',
  },
  illustrationImage: {
    width: '100%',
    height: s(280),
  },
});
