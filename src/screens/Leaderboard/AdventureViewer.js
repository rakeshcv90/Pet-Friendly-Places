import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  Easing,
  Linking,
  Pressable,
  StatusBar,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import FastImage from '../../components/common/FastImage';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { getErrorMessage } from '../../services/api/apiClient';
import {
  usePetMediaLikes,
  useTogglePetMediaLike,
  usePetMediaComments,
  usePostPetMediaComment,
} from '../../hooks/usePublicPet';

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const MAX_COMMENT = 500;
// react-native-video's ViewType.TEXTURE. Android needs the number, not the word 'texture'.
const VIEW_TYPE_TEXTURE = 0;

// The viewer follows the app theme instead of always being dark
const PALETTES = {
  dark: {
    bg: '#0F071D',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.72)',
    faint: '#8E86A8',
    line: 'rgba(255,255,255,0.12)',
    chip: 'rgba(255,255,255,0.1)',
    button: 'rgba(255,255,255,0.14)',
    composer: '#17092E',
    photoBg: '#000000',
    sheetShadow: '#000000',
  },
  light: {
    bg: '#FFF8F0',
    text: '#1A1A2E',
    muted: '#6B6B8A',
    faint: '#8E86A8',
    line: '#EDE8F5',
    chip: '#F5F0FF',
    button: 'rgba(26,26,46,0.08)',
    composer: '#FFFFFF',
    photoBg: '#F3EEFB',
    sheetShadow: '#3B108F',
  },
};

// The API names the commenter in `commenterName`; the others are fallbacks
const authorOf = (comment, mine) =>
  comment?.commenterName ||
  comment?.authorName ||
  comment?.authorDisplayName ||
  comment?.displayName ||
  comment?.author?.displayName ||
  comment?.author?.name ||
  comment?.account?.displayName ||
  comment?.user?.displayName ||
  comment?.user?.name ||
  comment?.userName ||
  comment?.name ||
  (mine ? 'You' : 'Pet parent');

// Banner colours by kind
const TOASTS = {
  success: { colors: ['#7B2CFF', '#00A8B5'], icon: 'check-circle' },
  error: { colors: ['#E11D48', '#FB7185'], icon: 'alert-circle' },
  info: { colors: ['#3B108F', '#7B2CFF'], icon: 'info' },
};

const timeAgo = iso => {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) {
    return '';
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return 'just now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-GB');
};

// Story-style view of one adventure: the photo or video fills the screen, like and comment sit on
// the right edge, and the comments slide up in a sheet.
export const AdventureViewer = ({ media, isAuthenticated, isDarkMode = true, onClose }) => {
  const c = isDarkMode ? PALETTES.dark : PALETTES.light;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const mediaId = media?.id;
  const [draft, setDraft] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusInput, setFocusInput] = useState(false);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // The phone's decoder can refuse a video (e.g. 10-bit H.264 from some cameras)
  const [videoFailed, setVideoFailed] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  // Comments this viewer has just posted, so they show as "You" even if the API sends no author
  const [mine, setMine] = useState([]);
  // A short in-app banner instead of a blocking system dialog
  const [toast, setToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  const notify = (text, kind = 'info') => {
    clearTimeout(toastTimer.current);
    toastAnim.setValue(0);
    setToast({ text, kind });
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  // How far the keyboard covers the bottom of the screen. A Modal on Android is not resized for the
  // keyboard, so the comment box has to be lifted by hand.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', event => {
      const covered = Dimensions.get('screen').height - (event?.endCoordinates?.screenY ?? 0);
      setKeyboardHeight(Math.max(0, covered || event?.endCoordinates?.height || 0));
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const likes = usePetMediaLikes(mediaId);
  const comments = usePetMediaComments(mediaId);
  const toggleLike = useTogglePetMediaLike(mediaId);
  const postComment = usePostPetMediaComment(mediaId);

  // The comment sheet springs up each time it opens
  useEffect(() => {
    if (sheetOpen) {
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [sheetOpen, slide]);

  if (!media) {
    return null;
  }

  const isVideo = media.mediaType === 'video';
  const liked = !!likes.data?.viewerLiked;
  const likeCount = likes.data?.likeCount ?? media.likeCount ?? 0;
  const list = comments.data || [];
  const canSend = draft.trim().length > 0 && !postComment.isPending;
  const mediaUri = resolveImageUrl(media.url);
  // With the keyboard up the sheet shrinks to the space above it, so the list never gets squeezed off
  const keyboardOpen = keyboardHeight > 0;
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.68),
    Math.round(windowHeight - keyboardHeight - Math.max(insets.top, s(12)) - s(24)),
  );

  const openSheet = withInput => {
    setFocusInput(withInput);
    setSheetOpen(true);
  };

  const needSignIn = action => notify(`Sign in to ${action}.`, 'info');

  const onLike = () => {
    if (!isAuthenticated) {
      needSignIn('like this adventure');
      return;
    }
    toggleLike.mutate(undefined, {
      onError: err => notify(getErrorMessage(err), 'error'),
    });
  };

  const onSend = () => {
    if (!isAuthenticated) {
      needSignIn('comment');
      return;
    }
    const body = draft.trim();
    if (!body) {
      return;
    }
    postComment.mutate(body, {
      onSuccess: data => {
        setDraft('');
        if (data?.id) {
          setMine(ids => [...ids, data.id]);
        }
        // Only say "approval" when the server really holds the comment back
        notify(
          /pending/i.test(data?.status || '')
            ? 'Comment sent. It will show for others once approved.'
            : 'Comment posted',
          'success',
        );
      },
      onError: err => notify(getErrorMessage(err), 'error'),
    });
  };

  return (
    <Modal
      visible
      animationType="fade"
      onRequestClose={sheetOpen ? () => setSheetOpen(false) : onClose}
      statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.root}>
        {/* The picture or video fills the screen */}
        {isVideo ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused(value => !value)}>
            <Video
              testID="adventure-video"
              source={{ uri: mediaUri }}
              poster={media.thumbnailUrl ? resolveImageUrl(media.thumbnailUrl) : undefined}
              // The poster is the video's own first picture: fit it like the video
              posterResizeMode="contain"
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              repeat
              paused={paused || sheetOpen}
              onError={event => {
                if (__DEV__) {
                  console.warn('Adventure video failed to play', media.url, event?.error);
                }
                setVideoFailed(true);
              }}
              // The default Android surface view draws black (or nothing) inside a Modal.
              viewType={VIEW_TYPE_TEXTURE}
            />
            {paused && !videoFailed ? (
              <View pointerEvents="none" style={styles.playCenter}>
                <View style={styles.playCircle}>
                  <Feather name="play" size={ms(30)} color="#FFFFFF" />
                </View>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <>
            {/* A soft blurred copy of the photo fills the screen behind it */}
            <FastImage
              source={{ uri: mediaUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              resizeMethod="resize"
              blurRadius={Platform.OS === 'ios' ? 40 : 25}
            />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.stageDim]} />
            <FastImage
              testID="adventure-photo"
              source={{ uri: mediaUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              // Uploads are full-size camera photos (often 5-10 MB). Without this Android decodes
              // them at full size, which can fail and leave the "no image" fallback showing.
              resizeMethod="resize"
              onError={event => {
                if (__DEV__) {
                  console.warn('Adventure photo failed to load', media.url, event?.nativeEvent);
                }
              }}
            />
          </>
        )}

        {isVideo && videoFailed ? (
          <View style={styles.failWrap}>
            <View style={styles.failCard}>
              <Text style={styles.failEmoji}>🎞️</Text>
              <Text style={styles.failTitle}>This video can't play in the app</Text>
              <Text style={styles.failBody}>
                Your phone can't decode this video's format. You can watch it in your browser.
              </Text>
              <BouncyPressable
                activeScale={0.95}
                accessibilityLabel="Open video in browser"
                onPress={() => Linking.openURL(mediaUri).catch(() => {})}>
                <LinearGradient
                  colors={[PURPLE, PINK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.failBtn}>
                  <Feather name="external-link" size={ms(14)} color="#FFFFFF" />
                  <Text style={styles.failBtnText}>Open in browser</Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          </View>
        ) : null}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10,4,26,0.6)', 'rgba(10,4,26,0)']}
          style={[styles.topScrim, { height: insets.top + s(90) }]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10,4,26,0)', 'rgba(10,4,26,0.85)']}
          style={[styles.bottomScrim, { height: s(260) + insets.bottom }]}
        />

        <View
          pointerEvents="box-none"
          style={[styles.topBar, { paddingTop: Math.max(insets.top, s(12)) }]}>
          <BouncyPressable
            activeScale={0.88}
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.glassBtn}>
            <Feather name="x" size={ms(20)} color="#FFFFFF" />
          </BouncyPressable>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{isVideo ? '🎬 Video' : '📸 Photo'}</Text>
          </View>
        </View>

        {/* Title, description and the comment box */}
        {/* box-none: the empty parts of this full-width block must not swallow taps meant for the
            like and comment buttons beside it */}
        <View
          testID="viewer-bottom"
          pointerEvents="box-none"
          style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, s(14)) }]}>
          {!!media.title && <Text style={styles.title}>{media.title}</Text>}
          {!!media.description && (
            <Pressable onPress={() => setExpanded(value => !value)}>
              <Text style={styles.description} numberOfLines={expanded ? undefined : 2}>
                {media.description}
              </Text>
            </Pressable>
          )}
          <BouncyPressable
            activeScale={0.98}
            accessibilityLabel="Add a comment"
            onPress={() => openSheet(true)}
            style={styles.commentPill}>
            <Text style={styles.commentPillText}>
              {isAuthenticated ? 'Add a comment…' : 'Sign in to comment'}
            </Text>
            <View style={styles.commentPillIcon}>
              <Feather name="send" size={ms(14)} color="#FFFFFF" />
            </View>
          </BouncyPressable>
        </View>

        {/* Like and comment on the right edge */}
        <View style={[styles.rail, { bottom: Math.max(insets.bottom, s(14)) + s(74) }]}>
          <BouncyPressable
            activeScale={0.85}
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
            disabled={toggleLike.isPending}
            onPress={onLike}
            style={styles.railItem}>
            <View style={[styles.railCircle, liked && styles.railCircleOn]}>
              <Text style={styles.railEmoji}>{liked ? '❤️' : '🤍'}</Text>
            </View>
            <Text style={styles.railCount}>{likeCount}</Text>
          </BouncyPressable>
          <BouncyPressable
            activeScale={0.85}
            accessibilityLabel="Open comments"
            onPress={() => openSheet(false)}
            style={styles.railItem}>
            <View style={styles.railCircle}>
              <Text style={styles.railEmoji}>💬</Text>
            </View>
            <Text style={styles.railCount}>{list.length}</Text>
          </BouncyPressable>
        </View>

        {/* Comments sheet */}
        {sheetOpen ? (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              testID="comments-backdrop"
              style={[StyleSheet.absoluteFill, styles.backdrop]}
              onPress={() => setSheetOpen(false)}
            />
            <View
              testID="comments-sheet-wrap"
              pointerEvents="box-none"
              style={[styles.sheetWrap, { paddingBottom: keyboardHeight }]}>
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    height: sheetHeight,
                    backgroundColor: c.bg,
                    transform: [
                      {
                        translateY: slide.interpolate({
                          inputRange: [0, 1],
                          outputRange: [sheetHeight, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <View style={[styles.grabber, { backgroundColor: c.line }]} />
                <View style={styles.sheetHead}>
                  <View style={styles.sectionHead}>
                    <LinearGradient colors={[PINK, PURPLE]} style={styles.sectionBar} />
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Comments</Text>
                  </View>
                  <Text style={[styles.commentCount, { color: c.muted }]}>
                    💬 {list.length} {list.length === 1 ? 'comment' : 'comments'}
                  </Text>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sheetScroll}>
                  {comments.isLoading ? (
                    <Text style={[styles.muted, { color: c.faint }]}>Loading comments…</Text>
                  ) : comments.isError ? (
                    <BouncyPressable onPress={() => comments.refetch()} style={styles.retry}>
                      <Text style={styles.retryText}>Could not load comments. Tap to retry</Text>
                    </BouncyPressable>
                  ) : list.length === 0 ? (
                    <View style={[styles.empty, { backgroundColor: c.chip }]}>
                      <Text style={styles.emptyEmoji}>🐾</Text>
                      <Text style={[styles.muted, styles.emptyText, { color: c.faint }]}>
                        No comments yet. Be the first to say something.
                      </Text>
                    </View>
                  ) : (
                    list.map((comment, index) => (
                      <View key={comment.id || index} style={styles.comment}>
                        <LinearGradient colors={[PURPLE, PINK]} style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {authorOf(comment, mine.includes(comment.id)).charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                        <View style={[styles.bubble, { backgroundColor: c.chip }]}>
                          <Text style={[styles.commentAuthor, { color: c.text }]}>
                            {authorOf(comment, mine.includes(comment.id))}
                            {!!comment.createdAt && (
                              <Text style={[styles.commentTime, { color: c.faint }]}>
                                {`  ${timeAgo(comment.createdAt)}`}
                              </Text>
                            )}
                          </Text>
                          <Text style={[styles.commentText, { color: c.muted }]}>
                            {comment.body}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View
                  style={[
                    styles.composer,
                    {
                      // The keyboard already covers the system bar area
                      marginBottom: keyboardOpen ? s(10) : Math.max(insets.bottom, s(10)),
                      backgroundColor: c.chip,
                    },
                  ]}>
                  <TextInput
                    testID="adventure-comment-input"
                    value={draft}
                    onChangeText={setDraft}
                    autoFocus={focusInput}
                    placeholder={isAuthenticated ? 'Add a comment…' : 'Sign in to comment'}
                    placeholderTextColor={c.faint}
                    maxLength={MAX_COMMENT}
                    multiline
                    style={[styles.input, { color: c.text }]}
                  />
                  <BouncyPressable
                    activeScale={0.9}
                    accessibilityLabel="Send comment"
                    disabled={!canSend}
                    onPress={onSend}
                    style={!canSend && styles.sendOff}>
                    <LinearGradient
                      colors={[PURPLE, PINK]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sendBtn}>
                      <Feather name="send" size={ms(16)} color="#FFFFFF" />
                    </LinearGradient>
                  </BouncyPressable>
                </View>
              </Animated.View>
            </View>
          </View>
        ) : null}
        {toast ? (
          <Animated.View
            testID="adventure-toast"
            pointerEvents="none"
            style={[
              styles.toastWrap,
              {
                top: Math.max(insets.top, s(12)) + s(54),
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-s(16), 0],
                    }),
                  },
                ],
              },
            ]}>
            <LinearGradient
              colors={TOASTS[toast.kind].colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toast}>
              <Feather name={TOASTS[toast.kind].icon} size={ms(16)} color="#FFFFFF" />
              <Text style={styles.toastText}>{toast.text}</Text>
            </LinearGradient>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A041A' },
  stageDim: { backgroundColor: 'rgba(10,4,26,0.4)' },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(15),
  },
  glassBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: 'rgba(20,8,48,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(20,8,48,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  typeBadgeText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11),
    color: '#FFFFFF',
  },
  failWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(28),
    backgroundColor: 'rgba(10,4,26,0.78)',
  },
  failCard: { alignItems: 'center' },
  failEmoji: { fontSize: s(40), marginBottom: s(10) },
  failTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(17),
    color: '#FFFFFF',
    textAlign: 'center',
  },
  failBody: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: s(6),
    marginBottom: s(16),
  },
  failBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderRadius: s(24),
    paddingHorizontal: s(22),
    paddingVertical: s(12),
  },
  failBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(13.5),
    color: '#FFFFFF',
  },
  playCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: 'rgba(20,8,48,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rail: { position: 'absolute', right: s(12), alignItems: 'center', gap: s(16) },
  railItem: { alignItems: 'center' },
  railCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(20,8,48,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railCircleOn: {
    backgroundColor: 'rgba(255,79,184,0.35)',
    borderColor: PINK,
    shadowColor: PINK,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  railEmoji: { fontSize: s(21) },
  railCount: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    color: '#FFFFFF',
    marginTop: s(4),
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: s(16) },
  title: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    letterSpacing: -0.4,
    color: '#FFFFFF',
    paddingRight: s(60),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(13),
    lineHeight: s(20),
    color: 'rgba(255,255,255,0.88)',
    marginTop: s(5),
    paddingRight: s(60),
  },
  commentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(14),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: s(26),
    paddingLeft: s(18),
    paddingRight: s(6),
    paddingVertical: s(6),
  },
  commentPillText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(13),
    color: 'rgba(255,255,255,0.85)',
  },
  commentPillIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toastWrap: { position: 'absolute', left: s(16), right: s(16), alignItems: 'center', zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderRadius: s(22),
    paddingHorizontal: s(16),
    paddingVertical: s(11),
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  toastText: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12.5),
    color: '#FFFFFF',
  },
  backdrop: { backgroundColor: 'rgba(10,4,26,0.55)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    paddingHorizontal: s(16),
    paddingTop: s(10),
  },
  grabber: {
    alignSelf: 'center',
    width: s(38),
    height: s(4),
    borderRadius: s(2),
    marginBottom: s(12),
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(12),
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  sectionBar: { width: s(4), height: s(16), borderRadius: s(2) },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    letterSpacing: -0.3,
  },
  commentCount: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(12) },
  sheetScroll: { paddingBottom: s(12) },
  muted: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(12.5) },
  empty: {
    alignItems: 'center',
    borderRadius: s(18),
    paddingVertical: s(26),
    paddingHorizontal: s(16),
  },
  emptyEmoji: { fontSize: s(28), marginBottom: s(6) },
  emptyText: { textAlign: 'center' },
  retry: { paddingVertical: s(6) },
  retryText: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(12), color: PINK },
  comment: { flexDirection: 'row', gap: s(10), marginBottom: s(12) },
  avatar: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#FFFFFF' },
  bubble: {
    flex: 1,
    minWidth: 0,
    borderRadius: s(16),
    borderTopLeftRadius: s(4),
    paddingHorizontal: s(12),
    paddingVertical: s(9),
  },
  commentAuthor: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(12) },
  commentTime: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(10.5) },
  commentText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(18),
    marginTop: s(3),
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s(8),
    paddingLeft: s(16),
    paddingRight: s(6),
    paddingVertical: s(6),
    borderRadius: s(28),
  },
  input: {
    flex: 1,
    maxHeight: s(90),
    minHeight: s(38),
    paddingVertical: s(9),
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(13.5),
  },
  sendBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});
