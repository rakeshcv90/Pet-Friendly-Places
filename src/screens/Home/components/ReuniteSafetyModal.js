import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms, vs } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

const font = theme.typography.fontFamily;

const GUIDE = [
  {
    icon: 'eye-outline',
    title: 'Tap to reveal',
    body:
      'Phone numbers are not printed on the page. People tap Show number when they want to make contact. This helps stop bots copying numbers for spam and scams.',
  },
  {
    icon: 'checkmark-done-outline',
    title: 'Number consent',
    body:
      'We ask for your clear consent before showing a number on a live post. If you are not comfortable sharing it, do not submit the post.',
  },
  {
    icon: 'cash-outline',
    title: 'Never pay before seeing the pet',
    body:
      'Do not send money, deposits or transport charges to someone who claims to have found your pet. Meet safely and see the animal first. Adoption on Reunite is always free.',
  },
  {
    icon: 'key-outline',
    title: 'The private detail',
    body:
      'Lost and found posters add a detail that is never shown on the site. If someone calls, ask them to describe it so you can check their story.',
  },
];

export const ReuniteSafetyModal = ({ visible, onClose, isDarkMode }) => {
  const insets = useSafeAreaInsets();
  const dark = isDarkMode;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, dark && styles.sheetDark, { paddingBottom: insets.bottom + vs(16) }]}
          onPress={e => e.stopPropagation()}>
          <View style={[styles.grabber, dark && styles.grabberDark]} />

          <BouncyPressable
            accessibilityLabel="Close"
            style={[styles.close, dark && styles.closeDark]}
            activeScale={0.88}
            onPress={onClose}>
            <Feather name="x" size={ms(16)} color={dark ? '#E2E8F0' : '#475569'} />
          </BouncyPressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.taglineRow}>
              <Ionicons name="heart" size={ms(14)} color="#EC4899" />
              <Text style={styles.tagline}>Stay safe, and help others stay safe.</Text>
            </View>

            <Text style={[styles.title, dark && styles.titleDark]}>Staying safe on Reunite</Text>

            {GUIDE.map(item => (
              <View key={item.title} style={[styles.card, dark && styles.cardDark]}>
                <LinearGradient
                  colors={['#3B108F', '#7B2CFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIcon}>
                  <Ionicons name={item.icon} size={ms(18)} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.cardTexts}>
                  <Text style={[styles.cardTitle, dark && styles.cardTitleDark]}>{item.title}</Text>
                  <Text style={[styles.cardBody, dark && styles.cardBodyDark]}>{item.body}</Text>
                </View>
              </View>
            ))}

            <View style={[styles.notice, dark && styles.noticeDark]}>
              <Ionicons name="shield-checkmark" size={ms(16)} color={dark ? '#C4B5FD' : '#5B21B6'} />
              <Text style={[styles.noticeText, dark && styles.noticeTextDark]}>
                Reunite is always free. Nobody should ever ask you for money.
              </Text>
            </View>
          </ScrollView>

          <BouncyPressable style={styles.button} activeScale={0.96} onPress={onClose}>
            <LinearGradient
              colors={['#3B108F', '#7B2CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonFill}>
              <Feather name="check" size={ms(16)} color="#FFFFFF" />
              <Text style={styles.buttonText}>I understand</Text>
            </LinearGradient>
          </BouncyPressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,7,29,0.6)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    paddingTop: vs(10),
    paddingHorizontal: s(18),
  },
  sheetDark: {
    backgroundColor: '#0F071D',
  },
  grabber: {
    alignSelf: 'center',
    width: s(42),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#D9CFEA',
    marginBottom: vs(10),
  },
  grabberDark: {
    backgroundColor: '#3B1D6E',
  },
  close: {
    position: 'absolute',
    top: vs(14),
    right: s(16),
    zIndex: 5,
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE7FB',
  },
  closeDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  content: {
    paddingTop: vs(6),
    paddingBottom: vs(8),
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: s(40),
  },
  tagline: {
    marginLeft: s(7),
    fontSize: ms(14),
    fontFamily: 'Inter-BoldItalic',
    color: '#BE185D',
  },
  title: {
    marginTop: vs(8),
    marginBottom: vs(14),
    fontSize: ms(28),
    lineHeight: ms(34),
    fontFamily: font.extraBold,
    letterSpacing: -0.6,
    color: '#2E0A7A',
  },
  titleDark: {
    color: '#F3E8FF',
  },
  card: {
    flexDirection: 'row',
    padding: s(14),
    marginBottom: vs(10),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE7FB',
  },
  cardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  cardIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  cardTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: ms(14.5),
    fontFamily: font.bold,
    color: '#1A1A2E',
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  cardBody: {
    marginTop: vs(4),
    fontSize: ms(12.5),
    lineHeight: ms(19),
    fontFamily: font.regular,
    color: '#4B5563',
  },
  cardBodyDark: {
    color: '#A8B0C0',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(2),
    padding: s(14),
    borderRadius: s(16),
    backgroundColor: '#F1E9FF',
    borderWidth: 1,
    borderColor: '#DCC9FF',
  },
  noticeDark: {
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderColor: '#4C1D95',
  },
  noticeText: {
    flex: 1,
    marginLeft: s(10),
    fontSize: ms(12.5),
    lineHeight: ms(18),
    fontFamily: font.semiBold,
    color: '#4C1D95',
  },
  noticeTextDark: {
    color: '#DDD6FE',
  },
  button: {
    marginTop: vs(12),
    height: vs(48),
    borderRadius: s(16),
    overflow: 'hidden',
  },
  buttonFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: s(8),
    fontSize: ms(15),
    fontFamily: font.bold,
    color: '#FFFFFF',
  },
});
