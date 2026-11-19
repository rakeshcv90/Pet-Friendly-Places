import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { s } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { uploadReplyPhoto } from '../../hooks/useCommunity';
import { Loader } from '../../components/common/Loader';

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const DEEP_PURPLE = '#3B108F';
// Limits enforced by the API
const BODY_MIN = 10;
const BODY_MAX = 10000;
const MAX_PHOTOS = 2;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const GENERIC_ERROR = 'The reply could not be confirmed. Check the thread before trying again.';

const photoProblem = asset => {
  const type = (asset.type || '').toLowerCase();
  if (type && !PHOTO_TYPES.includes(type)) {
    return 'Photos must be JPEG, PNG, WebP, HEIC or HEIF.';
  }
  if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
    return 'Each photo must be 8 MB or smaller.';
  }
  return null;
};

// "Post a reply" card at the end of a thread. Replies are moderated before they go live.
export const ReplyComposer = ({ hasReplies, isDarkMode, onSubmit, submitting }) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [failedPhotos, setFailedPhotos] = useState([]);
  const [retrying, setRetrying] = useState(false);

  const trimmed = body.trim();
  const canSubmit = trimmed.length >= BODY_MIN && !submitting;

  const pickPhotos = () => {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.85,
        selectionLimit: MAX_PHOTOS - photos.length,
        maxWidth: 1600,
        maxHeight: 1600,
      },
      response => {
        if (response?.didCancel) {
          return;
        }
        if (response?.errorCode) {
          setError(response.errorMessage || 'Unable to open your photos. Please try again.');
          return;
        }
        const assets = (response?.assets || []).filter(asset => asset?.uri);
        const problems = assets.map(photoProblem).filter(Boolean);
        if (problems.length) {
          setError(problems[0]);
          return;
        }
        setError(null);
        setPhotos(prev => [...prev, ...assets].slice(0, MAX_PHOTOS));
      },
    );
  };

  const uploadAll = async (id, list) => {
    const results = await Promise.all(
      list.map(async photo => ({ photo, ok: await uploadReplyPhoto(id, photo) })),
    );
    return results.filter(result => !result.ok).map(result => result.photo);
  };

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    try {
      const data = await onSubmit({ body: trimmed, parentReplyId: null });
      if (!data || data.error || typeof data.id !== 'number') {
        setError(data?.error ?? data?.message ?? GENERIC_ERROR);
        return;
      }
      setReplyId(data.id);
      setFailedPhotos(await uploadAll(data.id, photos));
      setDone(true);
      setBody('');
      setPhotos([]);
    } catch (e) {
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? GENERIC_ERROR);
    }
  };

  const retryPhotos = async () => {
    setRetrying(true);
    setFailedPhotos(await uploadAll(replyId, failedPhotos));
    setRetrying(false);
  };

  const heading = hasReplies ? 'Post a reply' : 'Be the first to reply!';

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={styles.signIn}>
          <Text style={styles.signInEmoji}>🐶</Text>
          <Text style={styles.signInText}>Sign in to join the conversation</Text>
        </View>
      );
    }

    if (done) {
      return (
        <View style={styles.success}>
          <Text style={styles.successText}>
            ✅ Reply submitted and pending review, thank you for sharing! 🐾
          </Text>
          <Text style={styles.successHint}>
            Your reply is shown above as pending until a moderator approves it
            {replyId ? ` (reply #${replyId})` : ''}.
          </Text>
          {failedPhotos.length > 0 ? (
            <View style={styles.photoWarn}>
              <Text style={styles.photoWarnText}>
                The reply was submitted, but {failedPhotos.length} photo
                {failedPhotos.length === 1 ? '' : 's'} could not be uploaded. The reply is safe; you
                do not need to submit it again.
              </Text>
              <BouncyPressable onPress={retryPhotos} disabled={retrying} style={styles.retryBtn}>
                <Text style={styles.retryText}>
                  {retrying ? 'Retrying photos...' : 'Retry photo upload'}
                </Text>
              </BouncyPressable>
            </View>
          ) : null}
          <Pressable
            onPress={() => {
              setDone(false);
              setReplyId(null);
              setFailedPhotos([]);
            }}
            accessibilityRole="button"
            style={styles.againBtn}>
            <Text style={styles.againText}>Write another reply</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <>
        <Text style={[styles.label, isDarkMode && styles.textLight]}>Your reply</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={BODY_MAX}
          textAlignVertical="top"
          placeholder="Share your experience, tips, or advice… Markdown supported: **bold**, _italic_, lists 🐾"
          placeholderTextColor="#9A8BA9"
          accessibilityLabel="Your reply"
          style={[styles.input, isDarkMode && styles.inputDark]}
        />
        <Text style={styles.helper}>
          Markdown formatting is supported. Replies are reviewed before going live.
        </Text>
        {trimmed.length > 0 && trimmed.length < BODY_MIN ? (
          <Text style={styles.minHint}>Replies need at least {BODY_MIN} characters.</Text>
        ) : null}

        <View style={styles.photoRow}>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.thumb}>
              <Image source={{ uri: photo.uri }} style={styles.thumbImg} />
              <Pressable
                onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                hitSlop={6}
                style={styles.thumbRemove}>
                <Ionicons name="close" size={s(11)} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              onPress={pickPhotos}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              style={styles.addPhoto}>
              <Ionicons name="camera" size={s(18)} color={PURPLE} />
              <Text style={styles.addPhotoText}>Photo</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.rules}>
          Replies are reviewed before going live. Medical advice needs a vet source. Undisclosed
          promotion is removed.
        </Text>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.counter}>
            {body.length}/{BODY_MAX}
          </Text>
          <Loader visible={submitting} title="Posting your reply…" />
          <BouncyPressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityLabel="Post Reply"
            style={[styles.postBtnWrap, !canSubmit && styles.postBtnDisabled]}>
            <LinearGradient
              colors={canSubmit ? [PURPLE, PINK] : ['#E5E7EB', '#E5E7EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.postBtn}>
              <Text style={[styles.postBtnText, !canSubmit && styles.postBtnTextDisabled]}>
                Post Reply 🐾
              </Text>
            </LinearGradient>
          </BouncyPressable>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={styles.head}>
        <Text style={styles.headEmoji}>🐾</Text>
        <Text style={[styles.headTitle, isDarkMode && styles.textLight]}>{heading}</Text>
      </View>
      {renderContent()}
    </View>
  );
};

const { fontFamily } = theme.typography;

const styles = StyleSheet.create({
  card: {
    marginTop: s(8),
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(16),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#4A1D96',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cardDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  textLight: { color: '#FFFFFF' },
  head: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(12) },
  headEmoji: { fontSize: s(20) },
  headTitle: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(15),
    letterSpacing: -0.3,
    color: DEEP_PURPLE,
  },
  label: {
    fontFamily: fontFamily.extraBold,
    fontSize: s(11.5),
    color: DEEP_PURPLE,
    marginBottom: s(6),
  },
  input: {
    minHeight: s(110),
    maxHeight: s(220),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: s(14),
    backgroundColor: '#FEFCFF',
    paddingHorizontal: s(13),
    paddingTop: s(11),
    paddingBottom: s(11),
    fontFamily: fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#1C1C1C',
  },
  inputDark: { backgroundColor: '#170A2E', borderColor: '#2E1654', color: '#FFFFFF' },
  minHint: { fontFamily: fontFamily.semiBold, fontSize: s(10), color: '#B45309', marginTop: s(4) },
  helper: { fontFamily: fontFamily.regular, fontSize: s(10), color: '#9A8BA9', marginTop: s(6) },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(10) },
  addPhoto: {
    width: s(60),
    height: s(60),
    borderRadius: s(12),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF7FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(1),
  },
  addPhotoText: { fontFamily: fontFamily.semiBold, fontSize: s(9), color: '#9A8BA9' },
  thumb: {
    width: s(60),
    height: s(60),
    borderRadius: s(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: s(3),
    right: s(3),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rules: {
    fontFamily: fontFamily.medium,
    fontSize: s(10),
    lineHeight: s(14),
    color: '#6B5B95',
    marginTop: s(10),
  },
  error: { fontFamily: fontFamily.semiBold, fontSize: s(11), color: '#B91C1C', marginTop: s(8) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(12),
  },
  counter: { fontFamily: fontFamily.medium, fontSize: s(10), color: '#9A8BA9' },
  postBtnWrap: {
    borderRadius: s(22),
    shadowColor: PINK,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  postBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  postBtn: {
    borderRadius: s(22),
    paddingVertical: s(11),
    paddingHorizontal: s(22),
    minWidth: s(120),
    alignItems: 'center',
  },
  postBtnText: { fontFamily: fontFamily.extraBold, fontSize: s(12.5), color: '#FFFFFF' },
  postBtnTextDisabled: { color: '#9CA3AF' },

  success: {
    backgroundColor: '#E6FBF8',
    borderColor: '#2DD4BF',
    borderWidth: 1.5,
    borderRadius: s(14),
    padding: s(16),
    gap: s(10),
  },
  successText: {
    fontFamily: fontFamily.bold,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#065F46',
    textAlign: 'center',
  },
  successHint: {
    fontFamily: fontFamily.medium,
    fontSize: s(10.5),
    lineHeight: s(15),
    color: '#0F766E',
    textAlign: 'center',
  },
  photoWarn: { gap: s(8) },
  photoWarnText: {
    fontFamily: fontFamily.medium,
    fontSize: s(11),
    lineHeight: s(16),
    color: '#92400E',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  retryText: { fontFamily: fontFamily.extraBold, fontSize: s(11), color: '#92400E' },
  againBtn: { alignSelf: 'center', paddingVertical: s(4) },
  againText: {
    fontFamily: fontFamily.bold,
    fontSize: s(11.5),
    color: PURPLE,
    textDecorationLine: 'underline',
  },

  signIn: { alignItems: 'center', gap: s(8), paddingVertical: s(18) },
  signInEmoji: { fontSize: s(30) },
  signInText: { fontFamily: fontFamily.medium, fontSize: s(12.5), color: '#6B7280' },
});
