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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import {
  getChatStatus,
  createChatSession,
  selectChatPersona,
  postChatMessage,
  getChatMessages,
  createClientMessageId,
} from '../../services/api/chatApi';
import { getItem, setItem, removeItem, STORAGE_KEYS } from '../../services/storage/storage';

const QUICK_EMOJIS = ['🐾', '🐶', '🐱', '❤️', '🦴', '🏕️', '🚗'];

const getAiResponse = (query, persona = 'pet_parent') => {
  const q = query.toLowerCase();

  if (q.includes('road trip') || q.includes('trip') || q.includes('drive')) {
    return {
      text: 'For any pet road trip: 1) Keep water and familiar food easily accessible. 2) Schedule rest stops every 2-3 hours for pee breaks and stretching. 3) Use a crash-tested harness or crate. 4) Never leave pets unattended in cars.',
      pills: ['Find pet-friendly stays', 'Find a vet', 'Packing checklist'],
    };
  }

  if (
    q.includes('stay') ||
    q.includes('hotel') ||
    q.includes('resort') ||
    q.includes('villa') ||
    q.includes('cafe')
  ) {
    return {
      text: 'When booking pet-friendly stays: Always confirm breed/weight allowances, pet cleaning deposits, and whether pets are allowed in dining areas. Make sure your pet’s digital Pawsport vaccination records are up to date!',
      pills: ['Plan a road trip', 'Find a vet', 'Train travel rules'],
    };
  }

  if (
    q.includes('vet') ||
    q.includes('doctor') ||
    q.includes('clinic') ||
    q.includes('emergency')
  ) {
    return {
      text: 'In case of emergencies during travel: Identify 24/7 emergency veterinary hospitals along your travel corridor beforehand. Keep digital copies of anti-rabies certificates and core vaccines saved in your profile.',
      pills: ['Plan a road trip', 'Find pet-friendly stays', 'Packing checklist'],
    };
  }

  if (q.includes('train') || q.includes('irctc') || q.includes('railway')) {
    return {
      text: 'IRCTC Pet Travel Rules: Dogs can travel in First Class AC if you book the entire 2-berth coupe or 4-berth cabin. You need a veterinary fitness certificate issued 24-48 hours before departure. Remember to book tickets at the luggage counter.',
      pills: ['Plan a road trip', 'Find pet-friendly stays', 'Find a vet'],
    };
  }

  if (
    q.includes('claim') ||
    q.includes('business') ||
    q.includes('listing') ||
    q.includes('add a place') ||
    persona === 'place_owner'
  ) {
    return {
      text: 'For place partners and business listings: We help pet-friendly cafes, hotels, and dog parks verify their listings, specify pet amenities (water bowls, off-leash zones, pet menus), and reach thousands of pet parents.',
      pills: ['Claim business listing', 'Pet amenities guidelines', 'Delisting request'],
    };
  }

  return {
    text: 'Thank you for reaching out! For property-specific policies, live availability, and charges, we always advise confirming directly with hosts. For all pack travels, keep plenty of hydration, favorite food, and vaccination documents within reach.',
    pills: ['Plan a road trip', 'Find pet-friendly stays', 'Find a vet'],
  };
};

export const TailsGuideScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const accentColor = useStore(state => state.accentColor) || '#7C3AED';
  const storeUser = useStore(state => state.user);

  // Step state: 'contact_form' (first screen) -> 'chat' (second screen)
  const [currentStep, setCurrentStep] = useState('contact_form');

  // Contact form details (prefilled with user profile data)
  const [contactName, setContactName] = useState(
    storeUser?.name || storeUser?.displayName || storeUser?.full_name || 'Rakesh Rao',
  );
  const [contactEmail, setContactEmail] = useState(storeUser?.email || 'rakeshrao@cvinfotech.com');
  const [contactWhatsapp, setContactWhatsapp] = useState(
    storeUser?.phone || storeUser?.mobile || '',
  );

  // Chat state
  const [sessionToken, setSessionToken] = useState(null);
  const [isAiEnabled, setIsAiEnabled] = useState(null); // null = unknown, true = enabled, false = disabled
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null); // 'pet_parent' | 'place_owner'
  const [messages, setMessages] = useState([
    {
      id: 'welcome-message',
      sender: 'ai',
      senderName: 'Tails Guide · AI',
      text: 'Hello, I am Tails Guide AI. Choose Pet Parent or Place Owner to get started. AI answers can be mistaken; confirm important details with the place.',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isInitial: true,
      pills: [],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollViewRef = useRef(null);

  // Pulse animation for typing indicator
  const typingPulse = useRef(new Animated.Value(0.4)).current;

  // On mount: 1) Check AI Guide server status; 2) Restore any saved session from secure storage
  useEffect(() => {
    let isMounted = true;

    // 1. Check whether Tails Guide AI is enabled on backend
    getChatStatus()
      .then(res => {
        if (isMounted && typeof res?.enabled === 'boolean') {
          setIsAiEnabled(res.enabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAiEnabled(false);
        }
      });

    // 2. Restore saved session_token from phone secure storage (MMKV)
    const savedToken = getItem(STORAGE_KEYS.TAILS_GUIDE_SESSION_TOKEN);
    if (savedToken) {
      setSessionToken(savedToken);
      setIsResumingSession(true);
      getChatMessages(savedToken)
        .then(res => {
          if (!isMounted) return;
          const srvMsgs = res?.messages || (Array.isArray(res) ? res : null);
          if (Array.isArray(srvMsgs) && srvMsgs.length > 0) {
            const parsed = srvMsgs.map((m, idx) => ({
              id: m.id || m.clientMessageId || `srv-${idx}-${Date.now()}`,
              sender: m.role === 'user' || m.sender === 'user' ? 'user' : 'ai',
              senderName: m.role === 'user' || m.sender === 'user' ? null : 'Tails Guide · AI',
              text: m.content || m.text || m.message || '',
              time: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
              pills: m.pills || [],
            }));
            setMessages(parsed);
          }
        })
        .catch(() => {
          // Stored token is invalid or expired; clear it
          removeItem(STORAGE_KEYS.TAILS_GUIDE_SESSION_TOKEN);
          setSessionToken(null);
        })
        .finally(() => {
          if (isMounted) setIsResumingSession(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let loop;
    if (isTyping) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(typingPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingPulse, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      typingPulse.setValue(0.4);
    }
    return () => loop?.stop();
  }, [isTyping, typingPulse]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  // Start chat session (called from first screen)
  const handleStartChat = async () => {
    setCurrentStep('chat');
    if (!sessionToken) {
      try {
        const session = await createChatSession();
        const token = session?.session?.session_token || session?.session_token || session?.token;
        if (token) {
          setSessionToken(token);
          // Store token in phone's secure storage, never log it
          setItem(STORAGE_KEYS.TAILS_GUIDE_SESSION_TOKEN, token);
        }
      } catch (e) {
        // Fallback for offline / disabled in Development
        const fallbackToken = `local-${Date.now()}`;
        setSessionToken(fallbackToken);
      }
    }
  };

  // Choose persona before first message (pet_parent | place_owner)
  const handleSelectPersona = async persona => {
    setSelectedPersona(persona);
    if (sessionToken && !sessionToken.startsWith('local-')) {
      try {
        await selectChatPersona(sessionToken, persona);
      } catch (e) {
        // Graceful fallback
      }
    }

    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Add user selection bubble
    const userMsg = {
      id: `usr-persona-${Date.now()}`,
      sender: 'user',
      text: persona === 'pet_parent' ? 'Pet Parent' : 'Place Owner',
      time: currentTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();

    setTimeout(() => {
      const aiTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const responseText =
        persona === 'pet_parent'
          ? 'Welcome, fellow pet parent! 🐾 I can help you find verified pet-friendly cafes, dog parks, stays, packing checklists, or answer train and road trip rules across India. How can I assist you today?'
          : 'Welcome, place partner! 🏢 I can help you with listing your pet-friendly property, claiming your business profile, understanding pet amenities guidelines, or updating listing details. How can I assist your business today?';

      const responsePills =
        persona === 'pet_parent'
          ? ['Plan a road trip', 'Find pet-friendly stays', 'Find a vet']
          : ['Claim business listing', 'Pet amenities guidelines', 'Add a place'];

      const aiMsg = {
        id: `ai-persona-${Date.now()}`,
        sender: 'ai',
        senderName: 'Tails Guide · AI',
        text: responseText,
        time: aiTime,
        pills: responsePills,
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      scrollToBottom();
    }, 500);
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const clientMessageId = createClientMessageId();
    const userMsg = {
      id: clientMessageId,
      sender: 'user',
      text,
      time: currentTime,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setShowEmojiPicker(false);
    setIsTyping(true);
    scrollToBottom();

    // Call API if real sessionToken exists and AI is enabled
    let apiSuccess = false;
    if (sessionToken && !sessionToken.startsWith('local-')) {
      try {
        const result = await postChatMessage(sessionToken, text, clientMessageId);
        let replyText = null;

        // Support various backend response structures
        if (Array.isArray(result?.aiMessages) && result.aiMessages.length > 0) {
          replyText = result.aiMessages
            .map(m => m.content || m.text || (typeof m === 'string' ? m : ''))
            .filter(Boolean)
            .join('\n\n');
        } else if (result?.aiMessage) {
          replyText =
            result.aiMessage.content ||
            result.aiMessage.text ||
            (typeof result.aiMessage === 'string' ? result.aiMessage : null);
        } else if (result?.reply || result?.message) {
          replyText = result.reply || result.message;
        }

        if (replyText) {
          apiSuccess = true;
          const aiTime = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const aiMsg = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            senderName: 'Tails Guide · AI',
            text: replyText,
            time: aiTime,
            pills: result.pills || ['Plan a road trip', 'Find pet-friendly stays', 'Find a vet'],
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
          scrollToBottom();
        }
      } catch (e) {
        apiSuccess = false;
      }
    }

    if (!apiSuccess) {
      setTimeout(() => {
        const response = getAiResponse(text, selectedPersona);
        const aiTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          senderName: 'Tails Guide · AI',
          text: response.text,
          time: aiTime,
          pills: response.pills,
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
        scrollToBottom();
      }, 500);
    }
  };

  const handlePillPress = pillText => {
    handleSendMessage(pillText);
  };

  const handleInsertEmoji = emoji => {
    setInputText(prev => prev + emoji);
  };

  const handleClearChat = () => {
    // Clear session token from phone's secure storage
    removeItem(STORAGE_KEYS.TAILS_GUIDE_SESSION_TOKEN);
    setSessionToken(null);
    setSelectedPersona(null);
    setMessages([
      {
        id: 'welcome-message',
        sender: 'ai',
        senderName: 'Tails Guide · AI',
        text: 'Hello, I am Tails Guide AI. Choose Pet Parent or Place Owner to get started. AI answers can be mistaken; confirm important details with the place.',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isInitial: true,
        pills: [],
      },
    ]);
  };

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar barStyle="light-content" backgroundColor="#5B21B6" />

      {/* ── Tails Guide AI Common Top Header Bar ── */}
      <LinearGradient
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
          <TouchableOpacity
            testID="tails-guide-back-btn"
            accessibilityLabel="Back"
            style={styles.headerBackBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => {
              if (currentStep === 'chat') {
                setCurrentStep('contact_form');
              } else {
                navigation.goBack();
              }
            }}>
            <Ionicons name="chevron-back" size={ms(22)} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.avatarDisc}>
            <Ionicons name="person-outline" size={ms(19)} color="#6D28D9" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Tails Guide AI
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              AI help with pet-friendly places
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            testID="tails-guide-close-btn"
            style={styles.headerCloseBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={ms(22)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ─────────────────────────────────────────────────────────────
          SCREEN 1: Contact Details & "Start AI chat →" Form
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 'contact_form' && (
        <ScrollView
          style={styles.contactFormScroll}
          contentContainerStyle={[
            styles.contactFormContent,
            { paddingBottom: Math.max(insets.bottom, vs(20)) + vs(20) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.contactCard, isDarkMode && styles.contactCardDark]}>
            <Text style={[styles.contactIntroText, isDarkMode && styles.textMutedDark]}>
              Ask Tails Guide AI about pet-friendly places. This chat is linked to your account.
            </Text>

            {isAiEnabled === false && (
              <View style={[styles.devNoticeBanner, isDarkMode && styles.devNoticeBannerDark]}>
                <Ionicons
                  name="information-circle-outline"
                  size={ms(14)}
                  color={isDarkMode ? '#FDE68A' : '#92400E'}
                />
                <Text style={[styles.devNoticeText, isDarkMode && styles.devNoticeTextDark]}>
                  Tails Guide AI is offline in Development. Simulated chat is active for testing.
                </Text>
              </View>
            )}

            {/* YOUR NAME */}
            <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>YOUR NAME</Text>
            <TextInput
              testID="contact-name-input"
              style={[styles.contactInput, isDarkMode && styles.contactInputDark]}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Your Name"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            />

            {/* EMAIL */}
            <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>EMAIL</Text>
            <TextInput
              testID="contact-email-input"
              style={[styles.contactInput, isDarkMode && styles.contactInputDark]}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            />

            {/* WHATSAPP NUMBER */}
            <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
              WHATSAPP NUMBER
            </Text>
            <TextInput
              testID="contact-whatsapp-input"
              style={[styles.contactInput, isDarkMode && styles.contactInputDark]}
              value={contactWhatsapp}
              onChangeText={setContactWhatsapp}
              keyboardType="phone-pad"
              placeholder="Optional"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            />

            {/* START AI CHAT BUTTON */}
            <BouncyPressable
              testID="start-ai-chat-btn"
              style={styles.startChatBtn}
              activeScale={0.96}
              onPress={handleStartChat}>
              <LinearGradient
                colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startChatBtnGrad}>
                <Text style={styles.startChatBtnText}>Start AI chat →</Text>
              </LinearGradient>
            </BouncyPressable>

            {/* Continue without extra contact details link */}
            <TouchableOpacity
              testID="continue-without-details-btn"
              style={styles.skipContactBtn}
              onPress={handleStartChat}
              activeOpacity={0.7}>
              <Text style={[styles.skipContactText, isDarkMode && styles.skipContactTextDark]}>
                Continue without extra contact details
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SCREEN 2: Interactive Tails Guide AI Chat Screen
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 'chat' && (
        <KeyboardAvoidingView
          style={styles.chatFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
          {/* Top banner: "Update contact details" & "New chat" */}
          <View
            style={[styles.updateContactBanner, isDarkMode && styles.updateContactBannerDark]}>
            <TouchableOpacity
              testID="update-contact-details-btn"
              onPress={() => setCurrentStep('contact_form')}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.updateContactText,
                  isDarkMode && styles.updateContactTextDark,
                ]}>
                Update contact details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="tails-guide-refresh-btn"
              style={styles.newChatBtn}
              onPress={handleClearChat}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name="refresh-outline"
                size={ms(13)}
                color={isDarkMode ? '#C084FC' : '#7C3AED'}
                style={styles.newChatIcon}
              />
              <Text style={[styles.newChatText, isDarkMode && styles.newChatTextDark]}>
                New chat
              </Text>
            </TouchableOpacity>
          </View>

          {isAiEnabled === false && (
            <View
              style={[
                styles.devNoticeBanner,
                styles.devNoticeBannerChat,
                isDarkMode && styles.devNoticeBannerDark,
              ]}>
              <Ionicons
                name="information-circle-outline"
                size={ms(13)}
                color={isDarkMode ? '#FDE68A' : '#92400E'}
              />
              <Text style={[styles.devNoticeText, isDarkMode && styles.devNoticeTextDark]}>
                Tails Guide AI is offline in Development. Simulated responses are active.
              </Text>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: vs(16) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {isResumingSession && (
              <View style={styles.resumingWrap}>
                <Text style={[styles.resumingText, isDarkMode && styles.textMutedDark]}>
                  Restoring previous session...
                </Text>
              </View>
            )}
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
                  {!isUser && msg.senderName && (
                    <Text style={[styles.senderNameText, isDarkMode && styles.senderNameDark]}>
                      {msg.senderName}
                    </Text>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? styles.bubbleUser
                        : [styles.bubbleAi, isDarkMode && styles.bubbleAiDark],
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        isUser
                          ? styles.textWhite
                          : [styles.textAiMessage, isDarkMode && styles.textAiMessageDark],
                      ]}>
                      {msg.text}
                    </Text>
                  </View>

                  {/* Timestamp */}
                  <Text
                    style={[
                      styles.timestampText,
                      isUser ? styles.timestampUser : styles.timestampAi,
                      isDarkMode && styles.textMutedDark,
                    ]}>
                    {msg.time}
                  </Text>

                  {/* Initial Persona Selection Card (Screenshot 2: Pet Parent / Place Owner) */}
                  {msg.isInitial && (
                    <View style={[styles.personaCard, isDarkMode && styles.personaCardDark]}>
                      <Text style={[styles.personaCardTitle, isDarkMode && styles.textWhite]}>
                        Choose how Tails Guide can help
                      </Text>
                      <View style={styles.personaButtonsRow}>
                        <BouncyPressable
                          testID="persona-pet-parent-btn"
                          style={[
                            styles.personaBtn,
                            isDarkMode && styles.personaBtnDark,
                            selectedPersona === 'pet_parent' && styles.personaBtnActive,
                          ]}
                          activeScale={0.95}
                          onPress={() => handleSelectPersona('pet_parent')}>
                          <Text
                            style={[
                              styles.personaBtnText,
                              isDarkMode && styles.personaBtnTextDark,
                              selectedPersona === 'pet_parent' && styles.personaBtnTextActive,
                            ]}>
                            Pet Parent
                          </Text>
                        </BouncyPressable>

                        <BouncyPressable
                          testID="persona-place-owner-btn"
                          style={[
                            styles.personaBtn,
                            isDarkMode && styles.personaBtnDark,
                            selectedPersona === 'place_owner' && styles.personaBtnActive,
                          ]}
                          activeScale={0.95}
                          onPress={() => handleSelectPersona('place_owner')}>
                          <Text
                            style={[
                              styles.personaBtnText,
                              isDarkMode && styles.personaBtnTextDark,
                              selectedPersona === 'place_owner' && styles.personaBtnTextActive,
                            ]}>
                            Place Owner
                          </Text>
                        </BouncyPressable>
                      </View>
                    </View>
                  )}

                  {/* Suggested prompt chips below AI response */}
                  {!isUser && msg.pills && msg.pills.length > 0 && (
                    <View style={styles.pillsContainer}>
                      {msg.pills.map((pill, idx) => (
                        <BouncyPressable
                          key={idx}
                          style={[styles.suggestionPill, isDarkMode && styles.suggestionPillDark]}
                          activeScale={0.94}
                          onPress={() => handlePillPress(pill)}>
                          <Text
                            style={[
                              styles.suggestionPillText,
                              isDarkMode && styles.suggestionPillTextDark,
                            ]}>
                            {pill}
                          </Text>
                        </BouncyPressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageRow, styles.messageRowAi]}>
                <Text style={[styles.senderNameText, isDarkMode && styles.senderNameDark]}>
                  Tails Guide · AI
                </Text>
                <Animated.View
                  style={[
                    styles.messageBubble,
                    styles.bubbleAi,
                    isDarkMode && styles.bubbleAiDark,
                    styles.typingBubble,
                    { opacity: typingPulse },
                  ]}>
                  <Ionicons
                    name="sparkles"
                    size={ms(12)}
                    color={accentColor}
                    style={styles.typingIcon}
                  />
                  <Text style={[styles.typingText, isDarkMode && styles.textMutedDark]}>
                    Tails Guide is thinking...
                  </Text>
                </Animated.View>
              </View>
            )}
          </ScrollView>

          {/* Quick Emoji Selector */}
          {showEmojiPicker && (
            <View style={[styles.emojiPickerBar, isDarkMode && styles.emojiPickerBarDark]}>
              {QUICK_EMOJIS.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emojiTouch}
                  onPress={() => handleInsertEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Formatting & Quick Tools Bar */}
          <View style={[styles.toolsBar, isDarkMode && styles.toolsBarDark]}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setInputText(prev => prev + '**bold** ')}>
              <Text style={[styles.toolBoldText, isDarkMode && styles.textMutedDark]}>B</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setInputText(prev => prev + '*italic* ')}>
              <Text style={[styles.toolItalicText, isDarkMode && styles.textMutedDark]}>I</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setInputText(prev => prev + '• ')}>
              <Ionicons
                name="list-outline"
                size={ms(15)}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setInputText(prev => prev + '<pet> ')}>
              <Ionicons
                name="code-slash-outline"
                size={ms(15)}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setInputText(prev => prev + 'https://')}>
              <Ionicons
                name="link-outline"
                size={ms(15)}
                color={isDarkMode ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setShowEmojiPicker(prev => !prev)}>
              <Ionicons
                name={showEmojiPicker ? 'happy' : 'happy-outline'}
                size={ms(16)}
                color={showEmojiPicker ? accentColor : isDarkMode ? '#94A3B8' : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          {/* Chat Input Bar */}
          <View
            style={[
              styles.inputRowContainer,
              isDarkMode && styles.inputRowContainerDark,
              { paddingBottom: Math.max(insets.bottom, vs(10)) },
            ]}>
            <View style={[styles.inputFieldWrap, isDarkMode && styles.inputFieldWrapDark]}>
              <TextInput
                testID="tails-guide-input"
                style={[styles.nativeInput, isDarkMode && styles.textWhite]}
                placeholder="Type a message..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
            </View>

            <BouncyPressable
              testID="tails-guide-send-btn"
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              activeScale={0.9}
              disabled={!inputText.trim() || isTyping}
              onPress={() => handleSendMessage()}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnGrad}>
                <Ionicons
                  name="paper-plane"
                  size={ms(16)}
                  color="#FFFFFF"
                  style={styles.sendIcon}
                />
              </LinearGradient>
            </BouncyPressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default TailsGuideScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
  headerBackBtn: {
    marginRight: s(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDisc: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
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
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: vs(2),
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerCloseBtn: {
    padding: s(4),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── SCREEN 1: Contact Details Form (Screenshot 1) ── */
  contactFormScroll: {
    flex: 1,
  },
  contactFormContent: {
    paddingHorizontal: s(14),
    paddingTop: vs(16),
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    padding: s(16),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD7CC',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  contactCardDark: {
    backgroundColor: '#190A32',
    borderColor: '#371569',
    borderBottomColor: '#230A47',
  },
  contactIntroText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#475569',
    lineHeight: s(18),
    marginBottom: vs(16),
  },
  devNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(7),
    marginBottom: vs(14),
    gap: s(6),
  },
  devNoticeBannerChat: {
    marginHorizontal: s(14),
    marginTop: vs(8),
    marginBottom: vs(4),
  },
  devNoticeBannerDark: {
    backgroundColor: '#352108',
    borderColor: '#78350F',
  },
  devNoticeText: {
    flex: 1,
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#92400E',
    lineHeight: s(14),
  },
  devNoticeTextDark: {
    color: '#FDE68A',
  },
  resumingWrap: {
    paddingVertical: vs(6),
    alignItems: 'center',
  },
  resumingText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#94A3B8',
  },
  fieldLabel: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: vs(5),
  },
  fieldLabelDark: {
    color: '#94A3B8',
  },
  contactInput: {
    height: vs(42),
    borderRadius: s(11),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAF8FC',
    paddingHorizontal: s(13),
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1E293B',
    marginBottom: vs(14),
  },
  contactInputDark: {
    backgroundColor: '#230D42',
    borderColor: '#3D1C73',
    color: '#FFFFFF',
  },
  startChatBtn: {
    borderRadius: s(12),
    marginTop: vs(4),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  startChatBtnGrad: {
    height: vs(44),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2,
    borderBottomColor: '#4C1D95',
  },
  startChatBtnText: {
    color: '#FFFFFF',
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  skipContactBtn: {
    paddingVertical: vs(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipContactText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6D28D9',
    textDecorationLine: 'underline',
  },
  skipContactTextDark: {
    color: '#C084FC',
  },

  /* ── SCREEN 2: Update Contact Details Top Banner ── */
  updateContactBanner: {
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    backgroundColor: '#FAF5FF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  updateContactBannerDark: {
    backgroundColor: '#1E0E38',
    borderBottomColor: '#2F145A',
  },
  updateContactText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  updateContactTextDark: {
    color: '#C084FC',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatIcon: {
    marginRight: s(3),
  },
  newChatText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#7C3AED',
  },
  newChatTextDark: {
    color: '#C084FC',
  },

  /* ── SCREEN 2: Chat Content ── */
  chatFlex: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: s(14),
    paddingTop: vs(12),
  },
  messageRow: {
    marginBottom: vs(12),
  },
  messageRowAi: {
    alignItems: 'flex-start',
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  senderNameText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    marginBottom: vs(4),
    marginLeft: s(4),
  },
  senderNameDark: {
    color: '#C084FC',
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: s(16),
    paddingHorizontal: s(13),
    paddingVertical: vs(10),
  },
  bubbleAi: {
    backgroundColor: '#F0F6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderTopLeftRadius: s(4),
  },
  bubbleAiDark: {
    backgroundColor: '#1E143B',
    borderColor: '#341D66',
  },
  bubbleUser: {
    backgroundColor: '#7C3AED',
    borderTopRightRadius: s(4),
  },
  messageText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: s(17.5),
  },
  textAiMessage: {
    color: '#1E293B',
  },
  textAiMessageDark: {
    color: '#F8FAFC',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  timestampText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#94A3B8',
    marginTop: vs(4),
  },
  timestampAi: {
    marginLeft: s(6),
  },
  timestampUser: {
    marginRight: s(6),
  },

  /* ── SCREEN 2: Choose Persona Card (Screenshot 2) ── */
  personaCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    padding: s(12),
    marginTop: vs(8),
    width: '100%',
  },
  personaCardDark: {
    backgroundColor: '#1F0B3D',
    borderColor: '#38166C',
  },
  personaCardTitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1B4B',
    marginBottom: vs(9),
  },
  personaButtonsRow: {
    flexDirection: 'row',
    gap: s(8),
  },
  personaBtn: {
    flex: 1,
    height: vs(38),
    borderRadius: s(10),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaBtnDark: {
    backgroundColor: '#28114D',
    borderColor: '#4A1D88',
  },
  personaBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#6D28D9',
  },
  personaBtnText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#6D28D9',
  },
  personaBtnTextDark: {
    color: '#DDD6FE',
  },
  personaBtnTextActive: {
    color: '#FFFFFF',
  },

  /* ── Quick Suggestion Pills ── */
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginTop: vs(8),
  },
  suggestionPill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  suggestionPillDark: {
    backgroundColor: '#261245',
    borderColor: '#4A1D88',
  },
  suggestionPillText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6D28D9',
  },
  suggestionPillTextDark: {
    color: '#DDD6FE',
  },

  /* ── Typing ── */
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  typingIcon: {
    marginRight: s(5),
  },
  typingText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },

  /* ── Emoji Picker Bar ── */
  emojiPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE8E1',
    paddingVertical: vs(6),
    paddingHorizontal: s(8),
  },
  emojiPickerBarDark: {
    backgroundColor: '#190A32',
    borderTopColor: '#2F145A',
  },
  emojiTouch: {
    padding: s(6),
  },
  emojiText: {
    fontSize: s(18),
  },

  /* ── Tools Bar ── */
  toolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    paddingVertical: vs(5),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE8E1',
    gap: s(14),
  },
  toolsBarDark: {
    backgroundColor: '#16082F',
    borderTopColor: '#28114D',
  },
  toolBtn: {
    padding: s(4),
  },
  toolBoldText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#475569',
  },
  toolItalicText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    fontStyle: 'italic',
    color: '#475569',
  },

  /* ── Input Bar ── */
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingTop: vs(6),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE8E1',
    gap: s(8),
  },
  inputRowContainerDark: {
    backgroundColor: '#16082F',
    borderTopColor: '#28114D',
  },
  inputFieldWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    minHeight: vs(36),
    maxHeight: vs(90),
    justifyContent: 'center',
  },
  inputFieldWrapDark: {
    backgroundColor: '#230E44',
    borderColor: '#3D1C73',
  },
  nativeInput: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#1E293B',
    paddingVertical: vs(6),
  },
  sendBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginLeft: s(2),
  },
});
