import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useCommunities, useCreatePost, uploadPostPhoto } from '../../hooks/useCommunity';
import { Bob, Shine, Enter } from './Motion';
import { openCommunityGuidelines } from './utils';
import { Loader } from '../../components/common/Loader';

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const DEEP_PURPLE = '#3B108F';
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
// Limits enforced by the API
const TITLE_MIN = 15;
const TITLE_MAX = 200;
const BODY_MIN = 30;
const BODY_MAX = 10000;
const GENERIC_ERROR =
  'The post could not be confirmed. Check your community posts before trying again.';

const TYPE_OPTIONS = [
  {
    value: 'QUESTION',
    label: 'Question',
    icon: '❓',
    desc: 'Ask fellow pet parents for help or advice',
    color: '#7B2CFF',
    tint: '#F5F3FF',
  },
  {
    value: 'DISCUSSION',
    label: 'Discussion',
    icon: '💬',
    desc: 'Start a conversation or share your thoughts',
    color: '#0F766E',
    tint: '#F0FDFA',
  },
  {
    value: 'EVENT',
    label: 'Event',
    icon: '📅',
    desc: 'Share a pet-friendly event happening near you',
    color: '#C2410C',
    tint: '#FFF7ED',
  },
];

const TITLE_PLACEHOLDER = {
  QUESTION: 'What would you like to ask?',
  DISCUSSION: "What's on your mind?",
  EVENT: 'Event name or headline',
};

const toIsoDate = date => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toDisplayDate = date =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Events must be in the future, so the earliest selectable day is tomorrow
const getTomorrow = () => {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() + 1);
  return date;
};

// Photos must be JPEG, PNG, WebP, HEIC or HEIF. Returns why a photo is rejected, or null if fine.
const photoProblem = asset => {
  const type = (asset.type || '').toLowerCase();
  const extension = (asset.fileName || asset.uri || '').split('.').pop().toLowerCase();
  const typeOk = type ? PHOTO_TYPES.includes(type) : PHOTO_EXTENSIONS.includes(extension);
  if (!typeOk) {
    return 'Photos must be JPEG, PNG, WebP, HEIC or HEIF.';
  }
  if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
    return 'Each photo must be 8 MB or smaller.';
  }
  return null;
};

// Numbered section inside a raised card
const Section = ({ step, label, optional, index = 0, children, isDarkMode }) => (
  <Enter index={index} style={[styles.card, isDarkMode && styles.cardDark]}>
    <View style={styles.sectionHead}>
      <LinearGradient
        colors={[PURPLE, PINK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{step}</Text>
      </LinearGradient>
      <Text style={[styles.label, isDarkMode && styles.labelDark]}>
        {label}
        {optional ? <Text style={styles.labelOptional}> {optional}</Text> : null}
      </Text>
    </View>
    {children}
  </Enter>
);

// Thin progress bar: amber until the minimum is reached, then green
const Meter = ({ value, min, max }) => {
  const reached = value >= min;
  return (
    <View style={styles.meterTrack}>
      <View
        style={[
          styles.meterFill,
          {
            width: `${Math.min(100, (value / max) * 100)}%`,
            backgroundColor: reached ? '#23B36F' : '#F59E0B',
          },
        ]}
      />
    </View>
  );
};

export const NewPostScreen = ({ navigation, route }) => {
  const params = route?.params || {};
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const { data: communities = [] } = useCommunities();
  const createPost = useCreatePost();

  const [communitySlug, setCommunitySlug] = useState(params.community?.slug || '');
  const [type, setType] = useState(params.type || 'QUESTION');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [eventCity, setEventCity] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [photos, setPhotos] = useState([]);
  const [focused, setFocused] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedPostId, setSubmittedPostId] = useState(null);
  const [submittedSlug, setSubmittedSlug] = useState(null);
  const [heldForReview, setHeldForReview] = useState(true);
  const [failedPhotos, setFailedPhotos] = useState([]);
  const [retryingPhotos, setRetryingPhotos] = useState(false);

  const submitting = createPost.isPending || uploading;
  const isEvent = type === 'EVENT';
  const titleValid = title.trim().length >= TITLE_MIN && title.trim().length <= TITLE_MAX;
  const bodyValid = body.trim().length >= BODY_MIN && body.trim().length <= BODY_MAX;
  const eventDateValid = !!eventDate && startOfDay(eventDate) > startOfDay(new Date());
  const eventValid = !isEvent || (eventDateValid && eventCity.trim().length > 0);
  const formValid = titleValid && bodyValid && eventValid && !!communitySlug;

  const missingHint = !communitySlug
    ? 'Choose a community to post in.'
    : !titleValid
    ? `Add a title (${TITLE_MIN}+ characters).`
    : !bodyValid
    ? `Add details (${BODY_MIN}+ characters).`
    : isEvent && !eventDateValid
    ? 'Pick a date in the future for your event.'
    : 'Add the city where your event takes place.';

  const selectedCommunity =
    communities.find(item => item.slug === communitySlug) ||
    (params.community?.slug === communitySlug
      ? { slug: communitySlug, name: params.community.title, emoji: params.community.icon }
      : null);

  const inputStyle = name => [
    styles.input,
    isDarkMode && styles.inputDark,
    focused === name && styles.inputFocused,
  ];

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
        const accepted = assets.filter(asset => !photoProblem(asset));
        setError(problems.length > 0 ? problems[0] : null);
        setPhotos(prev => [...prev, ...accepted].slice(0, MAX_PHOTOS));
      },
    );
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: eventDate || getTomorrow(),
        minimumDate: getTomorrow(),
        mode: 'date',
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            setEventDate(selected);
          }
        },
      });
    }
  };

  const handleSubmit = async () => {
    if (!formValid || submitting) {
      return;
    }
    setError(null);

    const payload = { communitySlug, type, title: title.trim(), body: body.trim() };
    if (isEvent) {
      payload.eventDate = toIsoDate(eventDate);
      payload.eventCity = eventCity.trim();
      if (eventVenue.trim()) {
        payload.eventVenue = eventVenue.trim();
      }
    }

    try {
      const data = await createPost.mutateAsync(payload);
      if (!data || data.error || typeof data.id !== 'number') {
        setError(data?.error ?? data?.message ?? GENERIC_ERROR);
        return;
      }
      setSubmittedPostId(data.id);
      setHeldForReview(!data.status || data.status === 'held_for_review');

      setUploading(true);
      const results = await Promise.all(
        photos.map(async photo => ({ photo, ok: await uploadPostPhoto(data.id, photo) })),
      );
      setUploading(false);

      setFailedPhotos(results.filter(result => !result.ok).map(result => result.photo));
      setSubmittedSlug(data.slug ?? null);
      setSuccess(true);
    } catch (e) {
      setUploading(false);
      setError(e?.response?.data?.error ?? e?.response?.data?.message ?? GENERIC_ERROR);
    }
  };

  const handleOpenGuidelines = () => openCommunityGuidelines(navigation);

  const retryFailedPhotos = async () => {
    if (!submittedPostId || failedPhotos.length === 0 || retryingPhotos) {
      return;
    }
    setRetryingPhotos(true);
    const results = await Promise.all(
      failedPhotos.map(async photo => ({
        photo,
        ok: await uploadPostPhoto(submittedPostId, photo),
      })),
    );
    setFailedPhotos(results.filter(result => !result.ok).map(result => result.photo));
    setRetryingPhotos(false);
  };

  const renderSuccess = () => (
    <Enter style={styles.successWrap}>
      <View style={styles.successBadgeWrap}>
        <View style={styles.successRing} />
        <Bob distance={6} duration={2000}>
          <LinearGradient
            colors={[PURPLE, PINK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successBadge}>
            <Text style={styles.successEmoji}>🐾</Text>
          </LinearGradient>
        </Bob>
      </View>
      <Text style={[styles.successTitle, isDarkMode && styles.textLight]}>Post submitted!</Text>
      <Text style={[styles.successText, isDarkMode && styles.textMutedDark]}>
        {heldForReview
          ? 'Your post is being reviewed by our moderators. Once approved it will be live and visible to the community.'
          : 'Your post is live and visible to the community.'}
      </Text>

      {failedPhotos.length > 0 && (
        <View style={styles.photoWarning}>
          <Text style={styles.photoWarningText}>
            Your post was submitted, but {failedPhotos.length} photo
            {failedPhotos.length === 1 ? '' : 's'} could not be uploaded. The post is safe; you do
            not need to submit it again.
          </Text>
          <BouncyPressable
            onPress={retryFailedPhotos}
            disabled={retryingPhotos}
            style={styles.retryPhotosBtn}>
            <Text style={styles.retryPhotosText}>
              {retryingPhotos ? 'Retrying photos...' : 'Retry photo upload'}
            </Text>
          </BouncyPressable>
        </View>
      )}

      <View style={styles.successButtons}>
        <BouncyPressable
          activeScale={0.95}
          onPress={() => navigation.goBack()}
          style={[styles.outlineBtn, isDarkMode && styles.outlineBtnDark]}>
          <Text style={styles.outlineBtnText}>Back to community</Text>
        </BouncyPressable>
        {submittedSlug ? (
          <BouncyPressable
            activeScale={0.95}
            onPress={() =>
              navigation.replace('CommunityPostDetailScreen', {
                slug: submittedSlug,
                title: title.trim(),
              })
            }
            style={styles.solidBtnWrap}>
            <LinearGradient
              colors={[DEEP_PURPLE, PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.solidBtn}>
              <Text style={styles.solidBtnText}>View my post</Text>
              <Shine travel={s(150)} />
            </LinearGradient>
          </BouncyPressable>
        ) : null}
      </View>
    </Enter>
  );

  const renderForm = () => (
    <>
      <Section step="1" label="Community" index={0} isDarkMode={isDarkMode}>
        <BouncyPressable
          activeScale={0.98}
          onPress={() => setPickerOpen(true)}
          style={[styles.input, styles.selectField, isDarkMode && styles.inputDark]}>
          <Text
            style={[
              styles.selectText,
              isDarkMode && styles.textLight,
              !selectedCommunity && styles.selectPlaceholder,
            ]}
            numberOfLines={1}>
            {selectedCommunity
              ? `${selectedCommunity.emoji} ${selectedCommunity.name}`
              : 'Select a community…'}
          </Text>
          <View style={[styles.chevron, isDarkMode && styles.chevronDark]}>
            <Feather name="chevron-down" size={ms(14)} color={PURPLE} />
          </View>
        </BouncyPressable>

        <Text style={[styles.label, styles.subLabel, isDarkMode && styles.labelDark]}>
          Post type
        </Text>
        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map(option => {
            const active = option.value === type;
            return (
              <BouncyPressable
                key={option.value}
                activeScale={0.96}
                onPress={() => setType(option.value)}
                style={[
                  styles.typeCard,
                  isDarkMode && styles.typeCardDark,
                  active && {
                    backgroundColor: isDarkMode ? '#2A1250' : option.tint,
                    borderColor: option.color,
                  },
                ]}>
                {active && (
                  <View style={[styles.typeCheck, { backgroundColor: option.color }]}>
                    <Feather name="check" size={ms(9)} color="#FFFFFF" />
                  </View>
                )}
                <View style={[styles.typeIconWrap, { backgroundColor: option.tint }]}>
                  <Text style={styles.typeIcon}>{option.icon}</Text>
                </View>
                <Text
                  style={[
                    styles.typeLabel,
                    isDarkMode && styles.textLight,
                    active && { color: option.color },
                  ]}>
                  {option.label}
                </Text>
                <Text style={styles.typeDesc}>{option.desc}</Text>
              </BouncyPressable>
            );
          })}
        </View>
      </Section>

      <Section step="2" label="Title" index={1} isDarkMode={isDarkMode}>
        <TextInput
          style={inputStyle('title')}
          placeholder={TITLE_PLACEHOLDER[type]}
          placeholderTextColor={isDarkMode ? '#94A3B8' : '#A49AAF'}
          maxLength={TITLE_MAX}
          value={title}
          onChangeText={setTitle}
          onFocus={() => setFocused('title')}
          onBlur={() => setFocused(null)}
        />
        <Meter value={title.trim().length} min={TITLE_MIN} max={TITLE_MAX} />
        <Text style={[styles.counter, titleValid && styles.counterOk]}>
          {title.length}/{TITLE_MAX} (min {TITLE_MIN})
        </Text>
      </Section>

      <Section step="3" label="Details" index={2} isDarkMode={isDarkMode}>
        <TextInput
          style={[...inputStyle('body'), styles.bodyInput]}
          placeholder="Add context, details, or anything helpful… Markdown supported: **bold**, _italic_, lists"
          placeholderTextColor={isDarkMode ? '#94A3B8' : '#A49AAF'}
          multiline
          maxLength={BODY_MAX}
          value={body}
          onChangeText={setBody}
          onFocus={() => setFocused('body')}
          onBlur={() => setFocused(null)}
          textAlignVertical="top"
        />
        <Meter value={body.trim().length} min={BODY_MIN} max={BODY_MAX} />
        <Text style={[styles.counter, bodyValid && styles.counterOk]}>
          {body.length}/{BODY_MAX} (min {BODY_MIN})
        </Text>
      </Section>

      {isEvent && (
        <Enter index={0} style={styles.eventBox}>
          <Text style={styles.eventTitle}>📅 Event details</Text>
          <Text style={styles.eventHint}>
            Date and city are required. The date must be in the future.
          </Text>

          <Text style={styles.eventLabel}>Date</Text>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosDate}>
              <DateTimePicker
                testID="event-date-picker"
                value={eventDate || getTomorrow()}
                minimumDate={getTomorrow()}
                mode="date"
                display="compact"
                onChange={(event, selected) => selected && setEventDate(selected)}
              />
            </View>
          ) : (
            <BouncyPressable
              activeScale={0.98}
              onPress={openDatePicker}
              style={[styles.input, styles.eventInput, styles.selectField]}>
              <Text style={[styles.selectText, !eventDate && styles.selectPlaceholder]}>
                {eventDate ? toDisplayDate(eventDate) : 'Select a date'}
              </Text>
              <Feather name="calendar" size={ms(15)} color="#92400E" />
            </BouncyPressable>
          )}

          <Text style={styles.eventLabel}>City</Text>
          <TextInput
            style={[styles.input, styles.eventInput]}
            placeholder="e.g. Bengaluru"
            placeholderTextColor="#B8A27A"
            maxLength={60}
            value={eventCity}
            onChangeText={setEventCity}
          />

          <Text style={styles.eventLabel}>Venue / Location (optional)</Text>
          <TextInput
            style={[styles.input, styles.eventInput]}
            placeholder="e.g. Cubbon Park, Bengaluru"
            placeholderTextColor="#B8A27A"
            maxLength={120}
            value={eventVenue}
            onChangeText={setEventVenue}
          />
        </Enter>
      )}

      <Section
        step="4"
        label="Photos"
        optional="(optional, up to 3)"
        index={3}
        isDarkMode={isDarkMode}>
        <View style={styles.photoRow}>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoThumb}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <Pressable
                accessibilityLabel="Remove photo"
                onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                style={styles.photoRemove}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <BouncyPressable
              activeScale={0.95}
              onPress={pickPhotos}
              style={[styles.addPhoto, isDarkMode && styles.addPhotoDark]}>
              <View style={styles.addPhotoIcon}>
                <Text style={styles.addPhotoEmoji}>📷</Text>
              </View>
              <Text style={styles.addPhotoText}>Add photo</Text>
            </BouncyPressable>
          )}
        </View>
        {photos.length > 0 && (
          <Text style={styles.photoNote}>Photos are reviewed before appearing publicly.</Text>
        )}
      </Section>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={ms(16)} color="#B91C1C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
        <LinearGradient
          colors={[DEEP_PURPLE, PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoIcon}>
          <Ionicons name="shield-checkmark" size={ms(14)} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.flex}>
          <Text style={[styles.infoTitle, isDarkMode && styles.textLight]}>
            Every post is reviewed before it goes live.
          </Text>
          <Text style={[styles.infoText, isDarkMode && styles.textMutedDark]}>
            We remove posts that are off-topic, promotional without disclosure, or give pet health
            instructions without a vet source.{' '}
            <Text accessibilityRole="link" style={styles.infoLink} onPress={handleOpenGuidelines}>
              Community guidelines
            </Text>
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} translucent={false} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: success ? s(32) : s(120) + Math.max(insets.bottom, s(8)),
          }}>
          <LinearGradient
            colors={[DEEP_PURPLE, PURPLE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
            <LinearGradient
              pointerEvents="none"
              colors={[DEEP_PURPLE, 'rgba(59,16,143,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.heroTopFade, { height: insets.top + s(70) }]}
            />
            <View pointerEvents="none" style={styles.heroGlow} />
            <Ionicons
              name="paw"
              size={ms(96)}
              color="rgba(255,255,255,0.07)"
              style={styles.heroPaw}
            />

            <BouncyPressable
              activeScale={0.95}
              onPress={() => navigation.goBack()}
              style={styles.backLink}>
              <Feather name="chevron-left" size={ms(15)} color="rgba(255,255,255,0.85)" />
              <Text style={styles.backLinkText}>Tails Community</Text>
            </BouncyPressable>

            <View style={styles.heroRow}>
              <Bob style={styles.heroTile} distance={4} duration={2400}>
                <Text style={styles.heroTileEmoji}>{success ? '🎉' : '✍️'}</Text>
              </Bob>
              <View style={styles.flex}>
                <Text style={styles.heroTitle}>{success ? 'All done' : 'New Post'}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={2}>
                  {success
                    ? 'Thanks for sharing with the pack.'
                    : selectedCommunity
                    ? `Posting in ${selectedCommunity.name}`
                    : 'Share a question, story or event with fellow pet parents.'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>{success ? renderSuccess() : renderForm()}</View>
        </ScrollView>

        {success ? null : (
          <View
            style={[
              styles.actionBar,
              isDarkMode && styles.actionBarDark,
              { paddingBottom: Math.max(insets.bottom, s(10)) },
            ]}>
            {!formValid && <Text style={styles.hint}>{missingHint}</Text>}
            <View style={styles.actions}>
              <BouncyPressable
                activeScale={0.95}
                onPress={() => navigation.goBack()}
                style={[styles.cancelBtn, isDarkMode && styles.cancelBtnDark]}>
                <Text style={[styles.cancelText, isDarkMode && styles.textLight]}>Cancel</Text>
              </BouncyPressable>
              <Loader visible={submitting} title="Submitting your post…" />
              <BouncyPressable
                activeScale={0.96}
                disabled={!formValid || submitting}
                onPress={handleSubmit}
                style={[styles.submitWrap, (!formValid || submitting) && styles.submitDisabled]}>
                <LinearGradient
                  colors={[PURPLE, PINK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}>
                  <Ionicons name="paper-plane" size={ms(14)} color="#FFFFFF" />
                  <Text style={styles.submitText}>
                    {submitting ? 'Submitting…' : 'Submit post'}
                  </Text>
                  {formValid && !submitting ? <Shine travel={s(220)} /> : null}
                </LinearGradient>
              </BouncyPressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <View pointerEvents="none" style={[styles.statusCover, { height: insets.top }]} />

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />
        <View style={[styles.sheet, isDarkMode && styles.sheetDark]}>
          <View style={[styles.sheetHandle, isDarkMode && styles.sheetHandleDark]} />
          <Text style={[styles.sheetTitle, isDarkMode && styles.textLight]}>
            Select a community
          </Text>
          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {communities.map(item => {
              const active = item.slug === communitySlug;
              return (
                <BouncyPressable
                  key={item.slug}
                  activeScale={0.98}
                  onPress={() => {
                    setCommunitySlug(item.slug);
                    setPickerOpen(false);
                  }}
                  style={[
                    styles.sheetRow,
                    active && styles.sheetRowActive,
                    active && isDarkMode && styles.sheetRowActiveDark,
                  ]}>
                  <Text style={styles.sheetEmoji}>{item.emoji}</Text>
                  <View style={styles.flex}>
                    <Text style={[styles.sheetRowTitle, isDarkMode && styles.textLight]}>
                      {item.name}
                    </Text>
                    <Text style={styles.sheetRowMeta}>
                      {item.type === 'CITY' ? 'City' : 'Topic'}
                    </Text>
                  </View>
                  {active && <Feather name="check" size={ms(16)} color={PURPLE} />}
                </BouncyPressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const shadow = (color, opacity, radius, y) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.round(radius / 3),
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },
  statusCover: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: DEEP_PURPLE },
  body: { paddingHorizontal: s(15), paddingTop: s(16) },

  hero: {
    paddingHorizontal: s(15),
    paddingBottom: s(22),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroGlow: {
    position: 'absolute',
    top: -s(60),
    right: -s(40),
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPaw: {
    position: 'absolute',
    right: s(16),
    bottom: -s(20),
    transform: [{ rotate: '-20deg' }],
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: -s(4),
    paddingVertical: s(4),
    marginBottom: s(8),
  },
  backLinkText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12),
    color: 'rgba(255,255,255,0.85)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
  heroTile: {
    width: s(50),
    height: s(50),
    borderRadius: s(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow('#000000', 0.2, 8, 4),
  },
  heroTileEmoji: { fontSize: s(24) },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(26),
    lineHeight: s(30),
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    lineHeight: s(17),
    color: 'rgba(255,255,255,0.82)',
    marginTop: s(2),
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    borderRadius: s(20),
    padding: s(14),
    marginBottom: s(14),
    ...shadow('#4A1D96', 0.1, 14, 6),
  },
  cardDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(10) },
  stepBadge: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(11),
    color: '#FFFFFF',
  },
  label: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(13), color: '#1A1A2E' },
  labelDark: { color: '#FFFFFF' },
  subLabel: { fontSize: s(11.5), color: '#6B7280', marginTop: s(14), marginBottom: s(8) },
  labelOptional: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10.5),
    color: '#9CA3AF',
  },

  input: {
    backgroundColor: '#FAF8FF',
    borderColor: '#E4DDF7',
    borderWidth: 1.5,
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(13),
    color: '#1A1A2E',
  },
  inputDark: { backgroundColor: '#170A2E', borderColor: '#2E1654', color: '#FFFFFF' },
  inputFocused: { borderColor: PURPLE, backgroundColor: '#FFFFFF', ...shadow(PURPLE, 0.18, 8, 3) },
  bodyInput: { minHeight: s(140) },
  meterTrack: {
    height: s(3),
    borderRadius: s(2),
    backgroundColor: '#EDE8F8',
    marginTop: s(10),
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: s(2) },
  counter: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10.5),
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: s(5),
  },
  counterOk: { color: '#23B36F' },

  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  selectText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(13),
    color: '#1A1A2E',
  },
  selectPlaceholder: { color: '#A49AAF', fontFamily: theme.typography.fontFamily.medium },
  chevron: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronDark: { backgroundColor: '#2E1654' },

  typeRow: { flexDirection: 'row', gap: s(8) },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EDE8F8',
    borderWidth: 2,
    borderRadius: s(16),
    paddingTop: s(12),
    paddingBottom: s(10),
    paddingHorizontal: s(6),
    gap: s(4),
  },
  typeCardDark: { backgroundColor: '#170A2E', borderColor: '#2E1654' },
  typeCheck: {
    position: 'absolute',
    top: s(6),
    right: s(6),
    width: s(16),
    height: s(16),
    borderRadius: s(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconWrap: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: { fontSize: s(20) },
  typeLabel: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: '#374151',
  },
  typeDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(9.5),
    lineHeight: s(13),
    color: '#9CA3AF',
    textAlign: 'center',
  },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
  photoThumb: {
    width: s(80),
    height: s(80),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#E4DDF7',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: s(4),
    right: s(4),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { fontSize: s(10), color: '#FFFFFF' },
  addPhoto: {
    width: s(80),
    height: s(80),
    borderRadius: s(14),
    borderWidth: 2,
    borderColor: '#C4B8F5',
    borderStyle: 'dashed',
    backgroundColor: '#FAF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(3),
  },
  addPhotoDark: { backgroundColor: '#170A2E', borderColor: '#2E1654' },
  addPhotoIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoEmoji: { fontSize: s(16) },
  addPhotoText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10), color: PURPLE },
  photoNote: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10.5),
    color: '#9CA3AF',
    marginTop: s(8),
  },

  eventBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: s(18),
    padding: s(14),
    marginBottom: s(14),
  },
  eventTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13),
    color: '#92400E',
    marginBottom: s(8),
  },
  eventHint: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    lineHeight: s(15),
    color: '#B45309',
    marginBottom: s(4),
  },
  eventLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11),
    color: '#92400E',
    marginBottom: s(4),
    marginTop: s(6),
  },
  eventInput: { backgroundColor: '#FFFFFF', color: '#1A1A2E', borderColor: '#F1D9A0' },
  iosDate: { alignItems: 'flex-start' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(8),
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: s(14),
    padding: s(12),
    marginBottom: s(14),
  },
  errorText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    lineHeight: s(17),
    color: '#B91C1C',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(10),
    backgroundColor: '#F0EEFF',
    borderColor: '#DDDAFF',
    borderWidth: 1,
    borderRadius: s(16),
    paddingVertical: s(12),
    paddingHorizontal: s(14),
    marginBottom: s(8),
  },
  infoBoxDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  infoIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: DEEP_PURPLE,
    marginBottom: s(3),
  },
  infoLink: {
    fontFamily: theme.typography.fontFamily.bold,
    color: PURPLE,
    textDecorationLine: 'underline',
  },
  infoText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11),
    lineHeight: s(16),
    color: '#534AB7',
  },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#EDE8F8',
    paddingTop: s(10),
    paddingHorizontal: s(15),
    ...shadow('#4A1D96', 0.12, 16, -4),
  },
  actionBarDark: { backgroundColor: 'rgba(23,10,46,0.97)', borderTopColor: '#2E1654' },
  hint: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: '#9A8BA9',
    textAlign: 'center',
    marginBottom: s(8),
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: s(24),
    paddingVertical: s(13),
    paddingHorizontal: s(22),
  },
  cancelBtnDark: { backgroundColor: '#1E0E38' },
  cancelText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#374151' },
  submitWrap: { flex: 1, borderRadius: s(24), ...shadow(PINK, 0.35, 12, 6) },
  submitDisabled: { opacity: 0.5 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    borderRadius: s(24),
    paddingVertical: s(13),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 3,
    borderBottomColor: '#5B17C4',
  },
  submitText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13.5),
    color: '#FFFFFF',
  },

  successWrap: { alignItems: 'center', paddingTop: s(14), paddingHorizontal: s(4) },
  successBadgeWrap: {
    width: s(96),
    height: s(96),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(14),
  },
  successRing: {
    position: 'absolute',
    width: s(96),
    height: s(96),
    borderRadius: s(48),
    borderWidth: 2,
    borderColor: 'rgba(123,44,255,0.25)',
  },
  successBadge: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(PURPLE, 0.35, 14, 8),
  },
  successEmoji: { fontSize: s(32) },
  successTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    letterSpacing: -0.5,
    color: '#1A1A2E',
    marginBottom: s(8),
  },
  successText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(13),
    lineHeight: s(20),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: s(22),
  },
  photoWarning: {
    alignSelf: 'stretch',
    backgroundColor: '#FEF3C7',
    borderRadius: s(14),
    padding: s(12),
    marginBottom: s(20),
    gap: s(8),
  },
  photoWarningText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    lineHeight: s(17),
    color: '#92400E',
  },
  retryPhotosBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
  },
  retryPhotosText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11.5),
    color: '#92400E',
  },
  successButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: s(10) },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: PURPLE,
    borderWidth: 2,
    borderRadius: s(24),
    paddingVertical: s(10),
    paddingHorizontal: s(20),
  },
  outlineBtnDark: { backgroundColor: '#1E0E38' },
  outlineBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12.5),
    color: PURPLE,
  },
  solidBtnWrap: { borderRadius: s(24), ...shadow(DEEP_PURPLE, 0.28, 10, 5) },
  solidBtn: {
    borderRadius: s(24),
    paddingVertical: s(12),
    paddingHorizontal: s(22),
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: '#24086A',
  },
  solidBtnText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12.5),
    color: '#FFFFFF',
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(15, 7, 29, 0.55)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(26),
    borderTopRightRadius: s(26),
    paddingHorizontal: s(15),
    paddingTop: s(10),
    paddingBottom: s(24),
    maxHeight: '70%',
  },
  sheetDark: { backgroundColor: '#170A2E' },
  sheetHandle: {
    alignSelf: 'center',
    width: s(40),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#E5E7EB',
    marginBottom: s(12),
  },
  sheetHandleDark: { backgroundColor: '#2E1654' },
  sheetTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(18),
    color: DEEP_PURPLE,
    marginBottom: s(8),
  },
  sheetList: { flexGrow: 0 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: s(10),
    paddingHorizontal: s(10),
    borderRadius: s(14),
  },
  sheetRowActive: { backgroundColor: '#F5F3FF' },
  sheetRowActiveDark: { backgroundColor: '#2A1250' },
  sheetEmoji: { fontSize: s(22) },
  sheetRowTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(13),
    color: '#1A1A2E',
  },
  sheetRowMeta: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: '#9CA3AF',
  },
});
