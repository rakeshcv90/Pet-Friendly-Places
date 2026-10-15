import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { theme } from '../../../theme';
import FastImage from 'react-native-fast-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;

const POPULAR_CITIES = [
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Pune',
  'Goa',
  'Hyderabad',
  'Jaipur',
  'Kolkata',
  'Chennai',
  'Chandigarh',
  'Ahmedabad',
  'Kochi',
  'Lucknow',
  'Dehradun',
  'Shimla',
  'Other',
];

export const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [city, setCity] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);

  // Checkbox states (from Image 1)
  const [isAdult, setIsAdult] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [subscribeTips, setSubscribeTips] = useState(false);

  const isFormValid = isAdult && agreed;

  const handleRegister = () => {
    if (isFormValid) {
      navigation.navigate('Login');
    }
  };

  const handleSelectCity = selectedCity => {
    setCity(selectedCity);
    setIsCityModalVisible(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FastImage
        source={theme.images.backgroundimg1}
        style={[styles.backgroundImage, { bottom: insets.bottom }]}
        objectFit={Platform.OS === 'ios' && isSmallDevice ? 'fill' : 'cover'}
      />
      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: isSmallDevice
              ? Math.max(insets.top, s(20)) + s(24)
              : Math.max(insets.top, s(24)) + s(34),
            paddingBottom: s(24),
          },
        ]}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header with generous top margin */}
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join our pet-friendly community</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Row 1: Your name (optional) & Email address */}
          <View style={styles.row}>
            <View style={styles.leftCol}>
              <Input
                label="Your name (optional)"
                labelStyle={styles.inputLabel}
                placeholder="e.g. Priya"
                placeholderTextColor="#8EAAA2"
                value={name}
                onChangeText={setName}
                style={styles.inputWrapperContainer}
                inputWrapperStyle={styles.inputBox}
                inputStyle={styles.inputText}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.rightCol}>
              <Input
                label="Email address"
                labelStyle={styles.inputLabel}
                placeholder="you@example.com"
                placeholderTextColor="#8EAAA2"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.inputWrapperContainer}
                inputWrapperStyle={styles.inputBox}
                inputStyle={styles.inputText}
              />
            </View>
          </View>

          {/* Row 2: Password & Confirm password */}
          <View style={styles.row}>
            <View style={styles.leftCol}>
              <Input
                label="Password"
                labelStyle={styles.inputLabel}
                placeholder="At least 8 chars"
                placeholderTextColor="#8EAAA2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.inputWrapperContainer}
                inputWrapperStyle={styles.inputBox}
                inputStyle={styles.inputText}
                rightIcon={
                  <FeatherIcon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={s(15)}
                    color="#6E8B83"
                  />
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            </View>
            <View style={styles.rightCol}>
              <Input
                label="Confirm password"
                labelStyle={styles.inputLabel}
                placeholder="Re-enter password"
                placeholderTextColor="#8EAAA2"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.inputWrapperContainer}
                inputWrapperStyle={styles.inputBox}
                inputStyle={styles.inputText}
                rightIcon={
                  <FeatherIcon
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={s(15)}
                    color="#6E8B83"
                  />
                }
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </View>
          </View>

          {/* Row 3: Your city dropdown */}
          <View style={styles.citySection}>
            <Text style={styles.inputLabel}>Your city</Text>
            <TouchableOpacity
              style={styles.cityDropdown}
              onPress={() => setIsCityModalVisible(true)}
              activeOpacity={0.8}>
              <Text style={[styles.cityText, !city && styles.cityPlaceholder]} numberOfLines={1}>
                {city || 'Select your city'}
              </Text>
              <FeatherIcon name="chevron-down" size={s(18)} color="#6E8B83" />
            </TouchableOpacity>
            <Text style={styles.citySubtext}>
              Used for nearby recommendations. You can change it later.
            </Text>
          </View>

          {/* Checkbox Divider Line from Image 1 */}
          <View style={styles.checkboxDivider} />

          {/* Checkbox 1: I'm 18 or older */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsAdult(!isAdult)}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}>
              {isAdult && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabelBold}>I'm 18 or older.</Text>
          </TouchableOpacity>

          {/* Checkbox 2: Terms of Service & Privacy Policy */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          {/* Checkbox 3: Optional travel tips */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSubscribeTips(!subscribeTips)}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, subscribeTips && styles.checkboxChecked]}>
              {subscribeTips && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabelMuted}>
              Send me occasional pet-travel tips and updates. (optional)
            </Text>
          </TouchableOpacity>

          {/* Primary Action Button */}
          <Button
            title="Create account"
            onPress={handleRegister}
            gradientColors={['rgb(5 16, 143)', 'rgb(123, 44, 255)']}
            width="80%"
            style={styles.registerButton}
            contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
            textStyle={styles.registerButtonText}
            // disabled={!isFormValid}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.loginLinkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* City Picker Modal */}
      <Modal
        visible={isCityModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCityModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsCityModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select your city</Text>
                  <TouchableOpacity
                    onPress={() => setIsCityModalVisible(false)}
                    style={styles.modalCloseButton}>
                    <Ionicons name="close" size={s(20)} color="#064332" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={POPULAR_CITIES}
                  keyExtractor={item => item}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = city === item;
                    return (
                      <TouchableOpacity
                        style={[styles.cityOption, isSelected && styles.cityOptionSelected]}
                        onPress={() => handleSelectCity(item)}
                        activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.cityOptionText,
                            isSelected && styles.cityOptionTextSelected,
                          ]}>
                          {item}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={s(18)} color="#014A37" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(22),
  },
  header: {
    marginBottom: isSmallDevice ? s(12) : s(18),
  },
  title: {
    fontSize: isSmallDevice ? s(25) : s(28),
    lineHeight: isSmallDevice ? s(30) : s(34),
    fontWeight: 'bold',
    color: '#064332',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
    }),
    textAlign: 'center',
    marginBottom: s(4),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(13.5) : s(15),
    color: '#3E6157',
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    marginTop: s(2),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: s(2),
  },
  leftCol: {
    flex: 1,
    marginRight: s(5),
  },
  rightCol: {
    flex: 1,
    marginLeft: s(5),
  },
  inputWrapperContainer: {
    marginBottom: s(10),
  },
  inputLabel: {
    color: '#064332',
    fontWeight: '700',
    fontSize: isSmallDevice ? s(12) : s(13),
    marginBottom: s(4),
  },
  inputBox: {
    height: isSmallDevice ? s(44) : s(48),
    borderWidth: 1.2,
    borderColor: '#D4E1DD',
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
    paddingHorizontal: s(8),
  },
  inputText: {
    fontSize: isSmallDevice ? s(12.5) : s(13.5),
    color: '#064332',
    paddingHorizontal: s(2),
  },
  citySection: {
    marginBottom: s(10),
  },
  cityDropdown: {
    height: isSmallDevice ? s(44) : s(48),
    borderWidth: 1.2,
    borderColor: '#D4E1DD',
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
  },
  cityText: {
    fontSize: isSmallDevice ? s(13) : s(14),
    color: '#064332',
    fontWeight: '500',
  },
  cityPlaceholder: {
    color: '#8EAAA2',
    fontWeight: '400',
  },
  citySubtext: {
    fontSize: s(11),
    color: '#6E8B83',
    marginTop: s(4),
    paddingHorizontal: s(2),
  },
  checkboxDivider: {
    height: 1,
    backgroundColor: '#E4ECE9',
    marginTop: s(4),
    marginBottom: s(12),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: isSmallDevice ? s(10) : s(12),
  },
  checkbox: {
    width: s(20),
    height: s(20),
    borderWidth: 1.6,
    borderColor: '#064332',
    borderRadius: s(5),
    marginRight: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: s(1),
  },
  checkboxChecked: {
    backgroundColor: '#014A37',
    borderColor: '#014A37',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: s(12),
    fontWeight: 'bold',
  },
  checkboxLabelBold: {
    fontSize: isSmallDevice ? s(12) : s(13),
    color: '#064332',
    fontWeight: '700',
    flex: 1,
    lineHeight: s(18),
  },
  checkboxLabel: {
    fontSize: isSmallDevice ? s(12) : s(13),
    color: '#064332',
    fontWeight: '500',
    flex: 1,
    lineHeight: s(18),
  },
  checkboxLabelMuted: {
    fontSize: isSmallDevice ? s(11.5) : s(12.5),
    color: '#6E8B83',
    fontWeight: '400',
    flex: 1,
    lineHeight: s(18),
  },
  linkText: {
    color: '#014A37',
    fontWeight: '700',
  },
  registerButton: {
    marginTop: isSmallDevice ? s(2) : s(4),
    color: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCompactContent: {
    height: s(46),
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallDevice ? s(15) : s(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallDevice ? s(14) : s(18),
    paddingBottom: s(16),
  },
  footerText: {
    color: '#3E6157',
    fontSize: isSmallDevice ? s(13) : s(14),
    fontWeight: '500',
  },
  loginLinkText: {
    color: '#014A37',
    fontSize: isSmallDevice ? s(13) : s(14),
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(20),
    borderTopRightRadius: s(20),
    paddingTop: s(16),
    paddingHorizontal: s(20),
    paddingBottom: s(34),
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: s(14),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F1',
    marginBottom: s(6),
  },
  modalTitle: {
    fontSize: s(18),
    fontWeight: '700',
    color: '#064332',
  },
  modalCloseButton: {
    padding: s(4),
  },
  cityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: s(13),
    borderBottomWidth: 1,
    borderBottomColor: '#F2F6F4',
  },
  cityOptionSelected: {
    backgroundColor: '#F0F6F3',
    paddingHorizontal: s(8),
    borderRadius: s(8),
  },
  cityOptionText: {
    fontSize: s(15),
    color: '#064332',
  },
  cityOptionTextSelected: {
    fontWeight: '700',
    color: '#014A37',
  },
});
