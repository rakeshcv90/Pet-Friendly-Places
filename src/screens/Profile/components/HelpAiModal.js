import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const HelpAiModal = ({
  visible,
  onClose,
  isDarkMode = false,
  accentColor = '#7C3AED',
}) => {
  const [helpQuery, setHelpQuery] = useState('');

  const handleClose = () => {
    setHelpQuery('');
    onClose?.();
  };

  const handleSubmit = () => {
    if (!helpQuery.trim()) {
      return;
    }
    Keyboard.dismiss();
    Alert.alert(
      'Question Received',
      'Our PetFriendly AI is generating verified recommendations for your trip!',
    );
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.modalBox, isDarkMode && styles.modalBoxDark]}>
              <View style={styles.modalHeaderRow}>
                <View style={[styles.modalIconWrapAi, isDarkMode && styles.modalIconWrapDark]}>
                  <Ionicons name="sparkles" size={ms(20)} color={accentColor} />
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name="close"
                    size={ms(20)}
                    color={isDarkMode ? '#94A3B8' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
                Ask PetFriendly AI
              </Text>
              <Text style={[styles.modalSubtitle, isDarkMode && styles.textMutedDark]}>
                Got questions about pet policies, train rules, or verified destinations? Ask our
                pack assistant!
              </Text>

              <TextInput
                style={[styles.helpTextInput, isDarkMode && styles.helpTextInputDark]}
                placeholder="Ask anything... e.g. Can I take my Golden Retriever to Rishikesh?"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                multiline
                value={helpQuery}
                onChangeText={setHelpQuery}
              />

              <BouncyPressable
                style={styles.submitModalBtn}
                activeScale={0.95}
                onPress={handleSubmit}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.submitModalBtnGrad}>
                  <Text style={styles.submitModalBtnText}>Ask AI 🚀</Text>
                </LinearGradient>
              </BouncyPressable>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default HelpAiModal;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 22, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  modalBox: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: s(26),
    padding: s(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  modalBoxDark: {
    backgroundColor: '#160B2C',
    borderColor: '#2E1654',
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },
  modalIconWrapAi: {
    width: s(42),
    height: s(42),
    borderRadius: s(13),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrapDark: {
    backgroundColor: '#2A144E',
  },
  modalTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  modalSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(4),
    lineHeight: s(16),
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  helpTextInput: {
    height: vs(80),
    textAlignVertical: 'top',
    paddingTop: vs(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1A0B2E',
  },
  helpTextInputDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    color: '#FFFFFF',
  },
  submitModalBtn: {
    borderRadius: s(14),
    marginTop: vs(18),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitModalBtnGrad: {
    paddingVertical: vs(12),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#4C1D95',
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
});
