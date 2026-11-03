import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
  BackHandler,
  Modal,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { askPfpAssistant, submitSupportTranscript } from '../../services/api/supportChatApi';
import { getItem, STORAGE_KEYS } from '../../services/storage/storage';

const PawAvatarDisc = ({ animatedScale = null }) => {
  const content = (
    <View style={styles.pawPairContainer}>
      <Ionicons
        name="paw"
        size={ms(8)}
        color="#DDD6FE"
        style={styles.pawStepTop}
      />
      <Ionicons
        name="paw"
        size={ms(9.5)}
        color="#DDD6FE"
        style={styles.pawStepBottom}
      />
    </View>
  );

  if (animatedScale) {
    return (
      <Animated.View
        style={[
          styles.assistantAvatarDisc,
          { transform: [{ scale: animatedScale }] },
        ]}>
        {content}
      </Animated.View>
    );
  }

  return <View style={styles.assistantAvatarDisc}>{content}</View>;
};

export const PfpAssistantScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const storeUser = useStore(state => state.user);
  const storeToken = useStore(state => state.token);

  const [messages, setMessages] = useState([
    {
      id: 'initial-greeting',
      sender: 'assistant',
      text: "Hi! I'm the PFP AI assistant. What would you like to know about Pet Friendly Places?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState('rate'); // 'rate' | 'thanks'
  const [headerHeight, setHeaderHeight] = useState(0);
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);

  const scrollViewRef = useRef(null);

  // Typing animation: 3 staggered bouncing dots and avatar pulse
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animLoop1;
    let animLoop2;
    let animLoop3;
    let avatarLoop;

    if (isTyping) {
      const createDotAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.delay(Math.max(0, 560 - delay)),
          ]),
        );
      };

      animLoop1 = createDotAnimation(dot1, 0);
      animLoop2 = createDotAnimation(dot2, 180);
      animLoop3 = createDotAnimation(dot3, 360);

      avatarLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(avatarPulse, {
            toValue: 1.07,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(avatarPulse, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      );

      animLoop1.start();
      animLoop2.start();
      animLoop3.start();
      avatarLoop.start();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
      avatarPulse.setValue(1);
    }

    return () => {
      animLoop1?.stop();
      animLoop2?.stop();
      animLoop3?.stop();
      avatarLoop?.stop();
    };
  }, [isTyping, dot1, dot2, dot3, avatarPulse]);

  const executeEndChatRef = useRef();

  useEffect(() => {
    const onBackPress = () => {
      const userAsked = messages.some(m => m.sender === 'user');
      if (showFeedbackModal) {
        setShowFeedbackModal(false);
        executeEndChatRef.current?.(null);
        return true;
      }
      if (userAsked) {
        setFeedbackStep('rate');
        setShowFeedbackModal(true);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );
    return () => backHandler.remove();
  }, [messages, showFeedbackModal]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onShow = e => {
        const h = e.endCoordinates ? e.endCoordinates.height : 0;
        setAndroidKeyboardOffset(h);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      };

      const onHide = () => {
        setAndroidKeyboardOffset(0);
      };

      const showSub = Keyboard.addListener('keyboardDidShow', onShow);
      const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }

    const onShowIos = () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    };

    const showSubIos = Keyboard.addListener('keyboardWillShow', onShowIos);
    return () => showSubIos.remove();
  }, []);

  const getEffectiveToken = () => {
    return storeToken || getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: currentTime,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    const accessToken = getEffectiveToken();
    let replyText = null;

    try {
      const apiMessages = nextMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      replyText = await askPfpAssistant(apiMessages, accessToken);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg;

      if (
        serverMsg === 'Not authenticated' ||
        err?.response?.status === 401 ||
        err?.message?.includes?.('sign in')
      ) {
        replyText =
          'Please sign in to PetFriendly to chat directly with PFP Assistant AI.';
      } else if (typeof serverMsg === 'string' && serverMsg.trim()) {
        replyText = serverMsg.trim();
      } else if (err?.message === 'Network Error' || !err?.response) {
        replyText =
          'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err?.message) {
        replyText = err.message;
      } else {
        replyText =
          'Unable to get a response from the assistant. Please try again.';
      }
    }

    const aiTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const assistantMessage = {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text:
        replyText ||
        'Unable to get a response from the assistant. Please try again.',
      time: aiTime,
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
    scrollToBottom();
  };

  const executeEndChat = async (resolved = null) => {
    setIsEndingChat(true);
    const accessToken = getEffectiveToken();

    if (accessToken && messages.some(m => m.sender === 'user')) {
      try {
        const formatted = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        await submitSupportTranscript(formatted, accessToken, resolved, {
          name: storeUser?.name || storeUser?.displayName || '',
          email: storeUser?.email || '',
        });
      } catch (e) {
        // Continue navigation even if transcript submission fails
      }
    }

    setIsEndingChat(false);
    navigation.goBack();
  };
  executeEndChatRef.current = executeEndChat;

  const handleExitAttempt = () => {
    const userAsked = messages.some(m => m.sender === 'user');
    if (userAsked) {
      setFeedbackStep('rate');
      setShowFeedbackModal(true);
    } else {
      executeEndChat(null);
    }
  };

  const handleFeedbackSelect = async isResolved => {
    setFeedbackStep('thanks');

    const accessToken = getEffectiveToken();
    if (accessToken) {
      try {
        const formatted = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        await submitSupportTranscript(formatted, accessToken, isResolved, {
          name: storeUser?.name || storeUser?.displayName || '',
          email: storeUser?.email || '',
        });
      } catch (e) {
        // Continue navigation even if transcript submission fails
      }
    }

    setTimeout(() => {
      setShowFeedbackModal(false);
      navigation.goBack();
    }, 1300);
  };

  const handleEndChat = () => {
    handleExitAttempt();
  };

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar barStyle="light-content" backgroundColor="#5B21B6" />

      {/* ── Top Header Bar (Matching Screenshot) ── */}
      <LinearGradient
        onLayout={e => {
          const h = e.nativeEvent?.layout?.height;
          if (h && h > 0) setHeaderHeight(h);
        }}
        colors={['#7C3AED', '#6D28D9', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[
          styles.headerContainer,
          {
            paddingTop:
              Math.max(
                insets.top,
                Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
              ) + vs(8),
          },
        ]}>
        <View style={styles.headerLeftWrap}>
          {/* Paw Icon Avatar Badge */}
          <View style={styles.avatarDisc}>
            <Ionicons name="paw" size={ms(18)} color="#E9D5FF" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              PFP Assistant
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Powered by AI
            </Text>
          </View>
        </View>

        {/* Close Button in Rounded Square */}
        <TouchableOpacity
          testID="pfp-assistant-close-btn"
          accessibilityLabel="Close"
          style={styles.headerCloseBtn}
          onPress={handleExitAttempt}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={ms(18)} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Chat Content ── */}
      <KeyboardAvoidingView
        style={styles.chatFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: vs(16) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
                {!isUser && <PawAvatarDisc />}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? styles.bubbleUser
                      : [styles.bubbleAssistant, isDarkMode && styles.bubbleAssistantDark],
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      isUser
                        ? styles.textWhite
                        : [styles.textAssistant, isDarkMode && styles.textAssistantDark],
                    ]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowAssistant]}>
              <PawAvatarDisc animatedScale={avatarPulse} />
              <View
                testID="pfp-assistant-typing-indicator"
                accessibilityLabel="PFP Assistant is typing"
                style={[
                  styles.typingBubble,
                  isDarkMode && styles.bubbleAssistantDark,
                ]}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    isDarkMode && styles.typingDotDark,
                    {
                      opacity: dot1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 1],
                      }),
                      transform: [
                        {
                          translateY: dot1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3.5],
                          }),
                        },
                        {
                          scale: dot1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 1.15],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    isDarkMode && styles.typingDotDark,
                    {
                      opacity: dot2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 1],
                      }),
                      transform: [
                        {
                          translateY: dot2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3.5],
                          }),
                        },
                        {
                          scale: dot2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 1.15],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    isDarkMode && styles.typingDotDark,
                    {
                      opacity: dot3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 1],
                      }),
                      transform: [
                        {
                          translateY: dot3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3.5],
                          }),
                        },
                        {
                          scale: dot3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 1.15],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Bottom Input & Action Bar (Matching Screenshot) ── */}
        <View
          style={[
            styles.footerContainer,
            isDarkMode && styles.footerContainerDark,
            {
              paddingBottom:
                Platform.OS === 'android' && androidKeyboardOffset > 0
                  ? androidKeyboardOffset + vs(6)
                  : Math.max(insets.bottom, vs(10)),
            },
          ]}>
          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              testID="pfp-assistant-input"
              style={[
                styles.nativeInput,
                isDarkMode && styles.nativeInputDark,
                isDarkMode ? styles.textWhite : styles.textDark,
              ]}
              placeholder="Ask me anything..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
            />

            <BouncyPressable
              testID="pfp-assistant-send-btn"
              disabled={!inputText.trim() || isTyping}
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
                inputText.trim() ? styles.sendBtnActive : null,
              ]}
              activeScale={0.92}
              onPress={handleSendMessage}>
              <Ionicons
                name="paper-plane"
                size={ms(16)}
                color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'}
                style={styles.sendIcon}
              />
            </BouncyPressable>
          </View>

          {/* End Chat Button */}
          <BouncyPressable
            testID="pfp-assistant-end-chat-btn"
            disabled={isEndingChat}
            style={[styles.endChatBtn, isDarkMode && styles.endChatBtnDark]}
            activeScale={0.97}
            onPress={handleEndChat}>
            <Ionicons
              name="close"
              size={ms(15)}
              color={isDarkMode ? '#94A3B8' : '#6B7280'}
              style={styles.endChatIcon}
            />
            <Text style={[styles.endChatText, isDarkMode && styles.endChatTextDark]}>
              {isEndingChat ? 'Ending...' : 'End Chat'}
            </Text>
          </BouncyPressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Exit Feedback Modal (Matching User Reference Images 1 & 3) ── */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setShowFeedbackModal(false);
          executeEndChat(null);
        }}>
        <View style={styles.modalBackdrop}>
          {feedbackStep === 'rate' ? (
            /* ── Image 1: Before You Go / Rate Conversation ── */
            <View
              testID="pfp-feedback-modal-rate"
              style={[styles.feedbackCard, isDarkMode && styles.feedbackCardDark]}>
              {/* Header Gradient */}
              <LinearGradient
                colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalAvatarDisc}>
                    <View style={styles.pawPairContainer}>
                      <Ionicons
                        name="paw"
                        size={ms(8)}
                        color="#DDD6FE"
                        style={styles.pawStepTop}
                      />
                      <Ionicons
                        name="paw"
                        size={ms(9.5)}
                        color="#DDD6FE"
                        style={styles.pawStepBottom}
                      />
                    </View>
                  </View>
                  <View>
                    <Text style={styles.modalHeaderTitle}>Before you go</Text>
                    <Text style={styles.modalHeaderSubtitle}>Rate this conversation</Text>
                  </View>
                </View>

                <TouchableOpacity
                  testID="feedback-modal-close-btn"
                  accessibilityLabel="Close feedback"
                  style={styles.modalCloseBtn}
                  onPress={() => {
                    setShowFeedbackModal(false);
                    executeEndChat(null);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={ms(16)} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>

              {/* Body */}
              <View style={styles.modalBody}>
                <Text
                  style={[
                    styles.modalQueryTitle,
                    isDarkMode && styles.textWhite,
                  ]}>
                  Was your query resolved?
                </Text>
                <Text
                  style={[
                    styles.modalQuerySubtitle,
                    isDarkMode && styles.textMutedDark,
                  ]}>
                  This helps us improve AI help.
                </Text>

                <View style={styles.feedbackButtonsRow}>
                  {/* Yes, resolved */}
                  <BouncyPressable
                    testID="feedback-yes-btn"
                    style={[
                      styles.feedbackBtn,
                      styles.feedbackBtnYes,
                      isDarkMode && styles.feedbackBtnYesDark,
                    ]}
                    activeScale={0.94}
                    onPress={() => handleFeedbackSelect(true)}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={ms(17)}
                      color="#16A34A"
                      style={styles.feedbackBtnIcon}
                    />
                    <Text style={[styles.feedbackBtnText, styles.feedbackBtnTextYes]}>
                      Yes, resolved
                    </Text>
                  </BouncyPressable>

                  {/* Not resolved */}
                  <BouncyPressable
                    testID="feedback-no-btn"
                    style={[
                      styles.feedbackBtn,
                      styles.feedbackBtnNo,
                      isDarkMode && styles.feedbackBtnNoDark,
                    ]}
                    activeScale={0.94}
                    onPress={() => handleFeedbackSelect(false)}>
                    <Ionicons
                      name="close-circle-outline"
                      size={ms(17)}
                      color="#DC2626"
                      style={styles.feedbackBtnIcon}
                    />
                    <Text style={[styles.feedbackBtnText, styles.feedbackBtnTextNo]}>
                      Not resolved
                    </Text>
                  </BouncyPressable>
                </View>
              </View>
            </View>
          ) : (
            /* ── Image 3: Thanks for your feedback! ── */
            <View
              testID="pfp-feedback-modal-thanks"
              style={[
                styles.feedbackCardThanks,
                isDarkMode && styles.feedbackCardDark,
              ]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={ms(52)}
                color="#10B981"
              />
              <Text
                style={[
                  styles.thanksTitle,
                  isDarkMode && styles.textWhite,
                ]}>
                Thanks for your feedback!
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default PfpAssistantScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rootContainerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── Header ── */
  headerContainer: {
    paddingHorizontal: s(16),
    paddingBottom: vs(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(12),
  },
  avatarDisc: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  headerTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: s(15.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: vs(2),
  },
  headerCloseBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Chat Messages ── */
  chatFlex: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(16),
  },
  messageRow: {
    marginBottom: vs(8),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  assistantAvatarDisc: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#5B21B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(8),
    marginTop: vs(2),
  },
  pawPairContainer: {
    width: s(20),
    height: s(18),
    position: 'relative',
  },
  pawStepTop: {
    position: 'absolute',
    top: 0,
    left: s(1),
    transform: [{ rotate: '-18deg' }],
  },
  pawStepBottom: {
    position: 'absolute',
    bottom: 0,
    right: s(1),
    transform: [{ rotate: '15deg' }],
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: s(14),
    paddingHorizontal: s(11),
    paddingVertical: vs(6.5),
  },
  bubbleAssistant: {
    backgroundColor: '#F4F5FB',
    borderTopLeftRadius: s(4),
  },
  bubbleAssistantDark: {
    backgroundColor: '#1E143B',
  },
  bubbleUser: {
    backgroundColor: '#7C3AED',
    borderTopRightRadius: s(4),
  },
  messageText: {
    fontSize: s(12.5),
    lineHeight: s(17.5),
    fontFamily: theme.typography.fontFamily.regular,
  },
  textAssistant: {
    color: '#1E1B4B',
  },
  textAssistantDark: {
    color: '#F8FAFC',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#1E293B',
  },
  typingBubble: {
    backgroundColor: '#F4F5FB',
    borderRadius: s(14),
    borderTopLeftRadius: s(4),
    paddingHorizontal: s(11),
    paddingVertical: vs(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: vs(26),
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#7C3AED',
    marginHorizontal: s(2.5),
  },
  typingDotDark: {
    backgroundColor: '#A78BFA',
  },

  /* ── Exit Feedback Modal Styles ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 29, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  feedbackCard: {
    width: '100%',
    maxWidth: s(330),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2E1065',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  feedbackCardDark: {
    backgroundColor: '#1E143B',
  },
  feedbackCardThanks: {
    width: '100%',
    maxWidth: s(310),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    paddingVertical: vs(34),
    paddingHorizontal: s(24),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2E1065',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAvatarDisc: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  modalHeaderTitle: {
    fontSize: s(15.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  modalHeaderSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.82)',
    marginTop: vs(1.5),
  },
  modalCloseBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: s(18),
    paddingTop: vs(22),
    paddingBottom: vs(20),
    alignItems: 'center',
  },
  modalQueryTitle: {
    fontSize: s(16.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  modalQuerySubtitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginTop: vs(5),
    marginBottom: vs(20),
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    width: '100%',
  },
  feedbackBtn: {
    flex: 1,
    height: vs(42),
    borderRadius: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(8),
  },
  feedbackBtnYes: {
    backgroundColor: '#DCFCE7',
  },
  feedbackBtnYesDark: {
    backgroundColor: '#143E25',
  },
  feedbackBtnNo: {
    backgroundColor: '#FEE2E2',
  },
  feedbackBtnNoDark: {
    backgroundColor: '#45141E',
  },
  feedbackBtnIcon: {
    marginRight: s(5),
  },
  feedbackBtnText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  feedbackBtnTextYes: {
    color: '#15803D',
  },
  feedbackBtnTextNo: {
    color: '#DC2626',
  },
  thanksTitle: {
    fontSize: s(16.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: vs(14),
  },
  textMutedDark: {
    color: '#94A3B8',
  },

  /* ── Footer / Input ── */
  footerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: s(14),
    paddingTop: vs(8),
  },
  footerContainerDark: {
    backgroundColor: '#16082F',
    borderTopColor: '#28114D',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  nativeInput: {
    flex: 1,
    minHeight: vs(38),
    maxHeight: vs(85),
    borderRadius: s(10),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAF9FC',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
  },
  nativeInputDark: {
    backgroundColor: '#200C40',
    borderColor: '#371869',
  },
  sendBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  sendBtnActive: {
    backgroundColor: '#7C3AED',
  },
  sendIcon: {
    marginLeft: s(2),
  },
  endChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vs(36),
    borderRadius: s(20),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
    marginTop: vs(8),
  },
  endChatBtnDark: {
    borderColor: '#371869',
  },
  endChatIcon: {
    marginRight: s(5),
  },
  endChatText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  endChatTextDark: {
    color: '#94A3B8',
  },
});
