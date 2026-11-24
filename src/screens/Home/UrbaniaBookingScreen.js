import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  Keyboard,
  Platform,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useUserProfile } from '../../hooks/useUser';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Enter } from '../Community/Motion';
import { usePlaceSuggestions } from '../../hooks/usePlaceSuggestions';
import {
  apiMessage,
  fetchAvailability,
  fetchMonthAvailability,
  fetchPublicConfig,
  fetchStatus,
  requestEstimate,
  submitRequest,
} from '../../services/urbania/urbaniaApi';
import { loadStatusToken, saveStatusToken } from '../../services/urbania/statusTokenStore';
import { saveBooking, updateBooking } from '../../services/urbania/bookingHistory';
import { AmbientBackground } from './components/AmbientBackground';
import {
  AgreementSection,
  BookingSteps,
  FaqSection,
  FeatureCards,
  PricingCard,
  UrbaniaHero,
  prefetchGallery,
  VehicleNote,
} from './components/UrbaniaSections';
import { UrbaniaPhotoViewer } from './components/UrbaniaPhotoViewer';
import { UrbaniaCalendar } from './components/UrbaniaCalendar';
import {
  BASE_PLACE,
  EMPTY_BOOKING,
  MAX_HOURS,
  MAX_NIGHTS,
  MAX_PASSENGERS,
  MAX_PETS,
  MAX_STARTED_DAYS,
  MAX_STOPS,
  PRICING,
  STEP_VALIDATORS,
  TRIP_TYPES,
  buildRequestPayload,
  buildTripPayload,
  hasAllConsents,
  readBookingStatus,
  statusLabel,
  composeDateTime,
  describeWindow,
  formatRupeesExact,
  formatDuration,
  formatTime12,
  mapUrl,
  monthKey,
  parseDateText,
  readMonthAvailability,
  toDateText,
  toIstIso,
  isWindowValid,
  newIdempotencyKey,
  overnightPeriods,
  parseDateTime,
  readAvailability,
  readEstimate,
  readRequestResult,
  tripWindow,
} from './urbaniaBooking';

const PURPLE = '#7C3AED';

export const AUTO_SWIPE_MS = 4500;

const PLACEHOLDER = '#3D2D46';
const PLACEHOLDER_DARK = '#64748B';
const STEPS = [
  { id: 1, label: 'Trip' },
  { id: 2, label: 'Group' },
  { id: 3, label: 'Request' },
];

const Field = ({ label, error, isDarkMode, children, style }) => (
  <View style={[styles.field, style]}>
    <Text style={[styles.label, isDarkMode && styles.labelDark]}>{label}</Text>
    {children}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatWhen = text => {
  const date = parseDateTime(text);
  if (!date) {
    return null;
  }
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${
    ((hour + 11) % 12) + 1
  }:${minute} ${hour < 12 ? 'am' : 'pm'}`;
};

const Checkbox = ({ testID, checked, onChange, children, isDarkMode, error }) => (
  <Pressable
    testID={testID}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    onPress={() => onChange(!checked)}
    style={styles.checkRow}>
    <View
      style={[
        styles.checkBox,
        isDarkMode && styles.checkBoxDark,
        checked && styles.checkBoxOn,
        error && styles.checkBoxError,
      ]}>
      {checked ? <Feather name="check" size={ms(13)} color="#FFFFFF" /> : null}
    </View>
    <Text style={[styles.checkText, isDarkMode && styles.mutedDark]}>{children}</Text>
  </Pressable>
);

const TAB_ICONS = { local: 'car-sport-outline', outstation: 'map-outline' };
const TAB_PAD = s(4);

export const TripTypeTabs = ({ value, onChange, isDarkMode }) => {
  const index = Math.max(
    0,
    TRIP_TYPES.findIndex(type => type.id === value),
  );
  const position = useRef(new Animated.Value(index)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbWidth = trackWidth > 0 ? (trackWidth - TAB_PAD * 2) / TRIP_TYPES.length : 0;

  useEffect(() => {
    Animated.spring(position, {
      toValue: index,
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [index, position]);

  const labelOn = i =>
    position.interpolate({
      inputRange: [i - 1, i, i + 1],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

  return (
    <View
      testID="urbania-tabs"
      style={[styles.tabs, isDarkMode && styles.tabsDark]}
      onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}>
      <Animated.View
        pointerEvents="none"
        testID="urbania-tab-thumb"
        style={[
          styles.tabThumb,
          thumbWidth > 0 ? { width: thumbWidth } : styles.tabThumbHalf,
          {
            transform: [
              {
                translateX: position.interpolate({
                  inputRange: [0, TRIP_TYPES.length - 1],
                  outputRange: [0, thumbWidth * (TRIP_TYPES.length - 1)],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.tabThumbDepth} />
        <LinearGradient
          colors={['#4C1D95', PURPLE, '#C026D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabThumbFace}>
          <View style={styles.tabThumbGloss} />
        </LinearGradient>
      </Animated.View>

      {TRIP_TYPES.map((type, i) => {
        const active = value === type.id;
        return (
          <BouncyPressable
            key={type.id}
            testID={`urbania-type-${type.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            activeScale={0.97}
            onPress={() => onChange(type.id)}
            style={styles.tab}>
            <View style={styles.tabContent}>
              <View>
                <Ionicons
                  name={TAB_ICONS[type.id]}
                  size={ms(17)}
                  color={isDarkMode ? '#94A3B8' : '#8D809E'}
                />
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: labelOn(i) }]}>
                  <Ionicons name={TAB_ICONS[type.id]} size={ms(17)} color="#FFFFFF" />
                </Animated.View>
              </View>
              <View>
                <Text style={[styles.tabText, isDarkMode && styles.mutedDark]}>{type.label}</Text>
                <Animated.Text
                  style={[
                    styles.tabText,
                    styles.tabTextOn,
                    StyleSheet.absoluteFill,
                    { opacity: labelOn(i) },
                  ]}>
                  {type.label}
                </Animated.Text>
              </View>
            </View>
          </BouncyPressable>
        );
      })}
    </View>
  );
};

const PlaceSuggestionList = ({ items, loading, onPick, isDarkMode, testID }) => {
  if (items.length === 0 && !loading) {
    return null;
  }
  return (
    <View testID={testID} style={[styles.suggestions, isDarkMode && styles.suggestionsDark]}>
      {items.length === 0 ? (
        <Text
          style={[styles.suggestionSub, styles.suggestionLoading, isDarkMode && styles.mutedDark]}>
          Searching places…
        </Text>
      ) : (
        items.map((item, index) => (
          <Pressable
            key={item.id}
            testID={`${testID}-item-${index}`}
            accessibilityRole="button"
            accessibilityLabel={item.description}
            onPress={() => onPick(item)}
            style={[
              styles.suggestionRow,
              index > 0 && styles.suggestionBorder,
              isDarkMode && index > 0 && styles.suggestionBorderDark,
            ]}>
            <Ionicons name="location" size={ms(16)} color={PURPLE} />
            <View style={styles.suggestionText}>
              <Text
                numberOfLines={1}
                style={[styles.suggestionTitle, isDarkMode && styles.textWhite]}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text
                  numberOfLines={1}
                  style={[styles.suggestionSub, isDarkMode && styles.mutedDark]}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
};

const StopField = ({ index, value, onChange, onRemove, isDarkMode }) => {
  const [focused, setFocused] = useState(false);
  const [chosen, setChosen] = useState('');
  const places = usePlaceSuggestions(value, focused);

  return (
    <Field label={`Optional stop ${index + 1}`} isDarkMode={isDarkMode}>
      <BouncyPressable
        testID={`urbania-remove-stop-${index}`}
        accessibilityLabel={`Remove stop ${index + 1}`}
        activeScale={0.85}
        onPress={onRemove}
        style={[styles.trash, isDarkMode && styles.trashDark]}>
        <Ionicons name="trash-outline" size={ms(15)} color={isDarkMode ? '#C4B5FD' : '#3B108F'} />
      </BouncyPressable>
      <View
        style={[
          styles.inputRow,
          isDarkMode && styles.inputDark,
          focused && styles.inputFocused,
          focused && isDarkMode && styles.inputFocusedDark,
        ]}>
        <Ionicons name="flag-outline" size={ms(17)} color={PURPLE} />
        <TextInput
          testID={`urbania-stop-${index}`}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Place to stop on the way"
          placeholderTextColor={isDarkMode ? PLACEHOLDER_DARK : PLACEHOLDER}
          style={[styles.inputBare, isDarkMode && styles.textWhite]}
        />
      </View>
      {focused ? (
        <PlaceSuggestionList
          testID={`urbania-stop-${index}-suggestions`}
          items={places.items}
          loading={places.loading}
          isDarkMode={isDarkMode}
          onPick={item => {
            places.choose(item.description);
            onChange(item.description);
            setChosen(item.description);
          }}
        />
      ) : null}
      {chosen && chosen === value ? (
        <Text testID={`urbania-stop-${index}-chosen`} style={styles.caption}>
          Selected from Google Maps.
        </Text>
      ) : null}
    </Field>
  );
};

const RAISE = s(5);

const RaisedButton = ({ testID, label, icon, onPress, isDarkMode }) => {
  const press = useRef(new Animated.Value(0)).current;
  const spring = toValue =>
    Animated.spring(press, { toValue, friction: 7, tension: 240, useNativeDriver: true }).start();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => spring(1)}
      onPressOut={() => spring(0)}
      onPress={onPress}
      style={styles.raisedPress}>
      <View style={styles.raisedWrap}>
        <View
          testID={`${testID}-depth`}
          style={[styles.raisedDepth, isDarkMode && styles.raisedDepthDark]}
        />
        <Animated.View
          testID={`${testID}-face`}
          style={[
            styles.raisedFace,
            isDarkMode && styles.raisedFaceDark,
            {
              transform: [
                {
                  translateY: press.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, RAISE - 1],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={isDarkMode ? ['#3B1B6E', '#27104B'] : ['#F7F3FF', '#E7DDFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.raisedFill}>
            <View
              pointerEvents="none"
              testID={`${testID}-gloss`}
              style={[styles.raisedGloss, isDarkMode && styles.raisedGlossDark]}
            />
            <View style={[styles.raisedIcon, isDarkMode && styles.raisedIconDark]}>
              <Ionicons name={icon} size={ms(16)} color={isDarkMode ? '#C4B5FD' : '#5B21B6'} />
            </View>
            <Text style={[styles.addStopText, isDarkMode && styles.addStopTextDark]}>{label}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const Stepper = ({ testID, value, min, max, onChange, isDarkMode }) => (
  <View style={[styles.stepper, isDarkMode && styles.inputDark]}>
    <BouncyPressable
      testID={`${testID}-minus`}
      accessibilityLabel={`Fewer ${testID}`}
      activeScale={0.85}
      disabled={value <= min}
      onPress={() => onChange(value - 1)}
      style={[styles.stepBtn, value <= min && styles.stepBtnOff]}>
      <Feather name="minus" size={ms(15)} color="#FFFFFF" />
    </BouncyPressable>
    <Text testID={`${testID}-value`} style={[styles.stepValue, isDarkMode && styles.textWhite]}>
      {value}
    </Text>
    <BouncyPressable
      testID={`${testID}-plus`}
      accessibilityLabel={`More ${testID}`}
      activeScale={0.85}
      disabled={value >= max}
      onPress={() => onChange(value + 1)}
      style={[styles.stepBtn, value >= max && styles.stepBtnOff]}>
      <Feather name="plus" size={ms(15)} color="#FFFFFF" />
    </BouncyPressable>
  </View>
);

const StepDots = ({ step, onGo, isDarkMode }) => (
  <View style={styles.dots}>
    {STEPS.map((item, index) => {
      const done = item.id < step;
      const active = item.id === step;
      return (
        <React.Fragment key={item.id}>
          {index > 0 ? (
            <View
              style={[styles.dotLine, isDarkMode && styles.dotLineDark, done && styles.dotLineDone]}
            />
          ) : null}
          <BouncyPressable
            testID={`urbania-step-${item.id}`}
            accessibilityLabel={`${item.label}, step ${item.id} of 3`}
            activeScale={0.92}
            disabled={!done}
            onPress={() => onGo(item.id)}
            style={styles.dotWrap}>
            <View
              style={[
                styles.dot,
                isDarkMode && styles.dotDark,
                (active || done) && styles.dotOn,
                active && styles.dotActive,
              ]}>
              {active || done ? (
                <LinearGradient
                  pointerEvents="none"
                  colors={['#7B2CFF', '#C026D3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              {done ? (
                <Feather name="check" size={ms(14)} color="#FFFFFF" />
              ) : (
                <Text style={[styles.dotText, active && styles.dotTextOn]}>{item.id}</Text>
              )}
            </View>
            <Text
              style={[
                styles.dotLabel,
                isDarkMode && styles.mutedDark,
                active && styles.dotLabelOn,
              ]}>
              {item.label}
            </Text>
          </BouncyPressable>
        </React.Fragment>
      );
    })}
  </View>
);

export const UrbaniaBookingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const { data } = useUserProfile();
  const account = data?.account || data?.user || data || {};
  const scrollRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const cardY = useRef(0);

  const [photo, setPhoto] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  useEffect(() => {
    prefetchGallery();
  }, []);

  useEffect(() => {
    if (viewerOpen) {
      return undefined;
    }
    const timer = setTimeout(
      () => setPhoto(current => (current + 1) % theme.images.urbaniaGallery.length),
      AUTO_SWIPE_MS,
    );
    return () => clearTimeout(timer);
  }, [photo, viewerOpen]);

  const [pastHero, setPastHero] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({
    ...EMPTY_BOOKING,
    name: account?.name || account?.displayName || '',
    phone: account?.phone || '',
    email: account?.email || '',
  }));
  const [errors, setErrors] = useState({});

  const [config, setConfig] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [busy, setBusy] = useState(null);
  const [problem, setProblem] = useState('');
  const [sent, setSent] = useState(null);

  const idempotencyKey = useRef(null);

  const statusToken = useRef('');
  const [refreshing, setRefreshing] = useState(false);
  const [focused, setFocused] = useState(null);
  const pickupPlaces = usePlaceSuggestions(form.pickup, focused === 'pickup');
  const destinationPlaces = usePlaceSuggestions(form.destination, focused === 'destination');

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [monthAvail, setMonthAvail] = useState({});
  const [picker, setPicker] = useState(null);
  const [windowCheck, setWindowCheck] = useState({ state: 'idle', message: '' });
  const [chosen, setChosen] = useState({});
  const dropoffPlaces = usePlaceSuggestions(form.dropoff, focused === 'dropoff');

  useEffect(() => {
    let current = true;
    fetchPublicConfig()
      .then(answer => current && setConfig(answer))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);

  const dropoffTouched = useRef(false);

  const update = useCallback((key, value) => {
    if (key === 'dropoff') {
      dropoffTouched.current = true;
    }
    setForm(current => ({
      ...current,
      [key]: value,
      ...(key === 'pickup' && !dropoffTouched.current ? { dropoff: value } : {}),
    }));
    setErrors(current => {
      const clearsWindow = (key === 'pickupAt' || key === 'returnAt') && current.window;
      if (!current[key] && !clearsWindow) {
        return current;
      }
      return { ...current, [key]: undefined, ...(clearsWindow ? { window: undefined } : {}) };
    });
  }, []);

  const updateStop = useCallback((index, value) => {
    setForm(current => ({
      ...current,
      stops: current.stops.map((stop, i) => (i === index ? value : stop)),
    }));
  }, []);

  const handleScroll = useCallback(event => {
    const past = event.nativeEvent.contentOffset.y > s(330) - s(20);
    setPastHero(current => (current === past ? current : past));
  }, []);

  const goTo = useCallback(next => {
    setStep(next);
    setErrors({});
    setProblem('');
    scrollRef.current?.scrollToPosition?.(0, Math.max(0, cardY.current - s(8)), true);
  }, []);
  const windowProblem = async () => {
    const payload = buildTripPayload(form);
    const end = payload.expectedReturnAt || payload.pickupAt;
    try {
      const answer = readAvailability(await fetchAvailability({ start: payload.pickupAt, end }));
      return answer.available ? '' : answer.message;
    } catch (error) {
      return apiMessage(error, 'We could not check availability. Please try again.');
    }
  };

  const handleNext = useCallback(() => {
    const found = STEP_VALIDATORS[step - 1](form);
    if (step === 1 && !found.window && windowCheck.state === 'blocked') {
      found.window = windowCheck.message;
    }
    setErrors(found);
    if (Object.keys(found).length === 0) {
      goTo(step + 1);
    }
  }, [form, step, goTo, windowCheck]);

  const handleCheckFare = async () => {
    const found = STEP_VALIDATORS[1](form);
    setErrors(found);
    if (Object.keys(found).length > 0 || busy) {
      return;
    }
    setBusy('estimate');
    setProblem('');
    const blocked = await windowProblem();
    if (blocked) {
      setProblem(blocked);
      setBusy(null);
      return;
    }
    try {
      setEstimate(readEstimate(await requestEstimate(buildTripPayload(form))));
      goTo(3);
    } catch (error) {
      setProblem(apiMessage(error, 'We could not work out the route and fare. Please try again.'));
    }
    setBusy(null);
  };

  const handleRefresh = async () => {
    if (!sent || refreshing) {
      return;
    }
    setRefreshing(true);
    setProblem('');
    try {
      const token = statusToken.current || (await loadStatusToken(sent.reference));
      const answer = readBookingStatus(await fetchStatus(token));
      updateBooking(sent.reference, {
        ...(answer.status ? { status: answer.status } : {}),
        message: answer.message,
      });
      setSent(current => ({
        ...current,
        status: answer.status || current.status,
        message: answer.message,
        estimate: answer.estimate?.hasFare ? answer.estimate : current.estimate,
      }));
    } catch (error) {
      setProblem(apiMessage(error, 'We could not refresh the status. Please try again.'));
    }
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!hasAllConsents(form)) {
      setErrors({
        ...(form.agreed
          ? {}
          : { agreed: 'Please confirm you understand this is a provisional request' }),
        ...(form.ageConfirmed ? {} : { ageConfirmed: 'Please confirm that you are 18 or older' }),
        ...(form.accountTerms
          ? {}
          : { accountTerms: 'Please accept the Terms of Service and Privacy Policy' }),
      });
      return;
    }
    const found = STEP_VALIDATORS[2](form);
    setErrors(found);
    if (Object.keys(found).length > 0 || busy) {
      return;
    }
    setBusy('send');
    setProblem('');
    const blocked = await windowProblem();
    if (blocked) {
      setProblem(blocked);
      setBusy(null);
      return;
    }
    if (!idempotencyKey.current) {
      idempotencyKey.current = newIdempotencyKey();
    }
    try {
      const result = readRequestResult(
        await submitRequest(buildRequestPayload(form, idempotencyKey.current)),
      );
      // The private status token goes to the secure store only: it is never shown or logged
      await saveStatusToken(result.reference, result.statusToken);
      statusToken.current = result.statusToken;
      idempotencyKey.current = null;
      // Keep a private record on this phone for Profile > Urbania bookings (never the token)
      const total = estimate?.rows?.find(row => row.strong)?.value;
      saveBooking({
        reference: result.reference,
        status: result.status || 'pending_review',
        tripType: form.tripType,
        pickupLabel: formatWhen(form.pickupAt),
        returnLabel: windowInfo ? formatWhen(form.returnAt) : '',
        places: [
          { kind: 'pickup', address: form.pickup.trim() },
          ...form.stops
            .map(stop => stop.trim())
            .filter(Boolean)
            .map(address => ({ kind: 'stop', address })),
          { kind: 'destination', address: form.destination.trim() },
          { kind: 'drop', address: form.dropoff.trim() || form.pickup.trim() },
        ],
        fare: typeof total === 'number' ? { total, ...estimate.summary } : null,
      });
      setSent({
        reference: result.reference,
        status: result.status || 'pending_review',
        message: '',
        estimate,
        trip: {
          places: [
            ['Open pickup map', form.pickup],
            ...form.stops
              .map(stop => stop.trim())
              .filter(Boolean)
              .map((stop, index) => [`Open stop ${index + 1} map`, stop]),
            ['Open destination map', form.destination],
            ['Open drop-off map', form.dropoff.trim() || form.pickup],
          ].map(([label, address]) => ({ label, address: address.trim() })),
          when: windowInfo
            ? `${formatWhen(form.pickupAt)} – ${formatWhen(form.returnAt)}`
            : formatWhen(form.pickupAt),
        },
      });
    } catch (error) {
      if (error?.response) {
        idempotencyKey.current = null;
      }
      setProblem(
        apiMessage(
          error,
          'We could not send your request. Please check your connection and try again.',
        ),
      );
    }
    setBusy(null);
  };

  const boxStates = key => [
    isDarkMode && styles.inputDark,
    focused === key && styles.inputFocused,
    focused === key && isDarkMode && styles.inputFocusedDark,
    errors[key] && styles.inputError,
  ];
  const boxStyle = key => [styles.input, ...boxStates(key)];
  const rowStyle = key => [styles.inputRow, ...boxStates(key)];

  const input = (key, extra = {}) => ({
    value: form[key],
    onChangeText: text => update(key, text),
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(current => (current === key ? null : current)),
    placeholderTextColor: isDarkMode ? PLACEHOLDER_DARK : PLACEHOLDER,
    style: boxStyle(key),
    ...extra,
  });

  const iconInput = (key, icon, color, props) => (
    <View testID={`${props.testID}-box`} style={rowStyle(key)}>
      <Ionicons name={icon} size={ms(17)} color={focused === key ? PURPLE : color} />
      <TextInput
        {...input(key, { style: [styles.inputBare, isDarkMode && styles.textWhite] })}
        {...props}
      />
    </View>
  );
  const setSchedule = useCallback(patch => {
    setForm(current => {
      const next = { ...current, ...patch };
      next.pickupAt = composeDateTime(next.pickupDate, next.pickupTime);
      next.returnAt = composeDateTime(next.returnDate, next.returnTime);
      return next;
    });
    setErrors(current => ({
      ...current,
      pickupAt: undefined,
      returnAt: undefined,
      window: undefined,
    }));
  }, []);

  const pickDay = date => {
    const text = toDateText(date);
    const first = parseDateText(form.pickupDate);
    if (!first || form.returnDate || date < first) {
      setSchedule({ pickupDate: text, returnDate: '' });
    } else {
      setSchedule({ returnDate: text });
    }
  };

  useEffect(() => {
    let current = true;
    fetchMonthAvailability(monthKey(month))
      .then(answer => current && setMonthAvail(readMonthAvailability(answer)))
      .catch(() => current && setMonthAvail({}));
    return () => {
      current = false;
    };
  }, [month]);

  useEffect(() => {
    const start = toIstIso(form.pickupAt);
    const end = toIstIso(form.returnAt);
    if (!start || !end || !tripWindow(form.pickupAt, form.returnAt)) {
      setWindowCheck({ state: 'idle', message: '' });
      return undefined;
    }
    let current = true;
    setWindowCheck({ state: 'checking', message: '' });
    fetchAvailability({ start, end })
      .then(answer => {
        const result = readAvailability(answer);
        current &&
          setWindowCheck({ state: result.available ? 'ok' : 'blocked', message: result.message });
      })
      .catch(() => current && setWindowCheck({ state: 'idle', message: '' }));
    return () => {
      current = false;
    };
  }, [form.pickupAt, form.returnAt]);

  const timeAsDate = time => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  };
  const timeText = date =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const openTimePicker = key => {
    Keyboard.dismiss();
    const field = `${key}Time`;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timeAsDate(form[field]),
        mode: 'time',
        is24Hour: false,
        onValueChange: (_, date) => setSchedule({ [field]: timeText(date) }),
      });
    } else {
      setPicker(current => (current === key ? null : key));
    }
  };

  const renderTimeField = (key, label) => (
    <View style={styles.timeCol}>
      <Text style={[styles.label, isDarkMode && styles.labelDark]}>{label}</Text>
      <BouncyPressable
        testID={`urbania-${key}-time`}
        accessibilityLabel={label}
        activeScale={0.97}
        onPress={() => openTimePicker(key)}
        style={[
          styles.input,
          styles.timeBox,
          isDarkMode && styles.inputDark,
          picker === key && styles.inputFocused,
        ]}>
        <Text
          testID={`urbania-${key}-time-value`}
          style={[styles.timeText, isDarkMode && styles.textWhite]}>
          {formatTime12(form[`${key}Time`])}
        </Text>
        <Feather name="clock" size={ms(15)} color={isDarkMode ? '#C4B5FD' : '#475569'} />
      </BouncyPressable>
    </View>
  );

  const windowInfo = tripWindow(form.pickupAt, form.returnAt);
  const nights = overnightPeriods(form);

  const renderTrip = () => (
    <>
      <TripTypeTabs
        value={form.tripType}
        onChange={value => update('tripType', value)}
        isDarkMode={isDarkMode}
      />

      <Field label="Pickup location" error={errors.pickup} isDarkMode={isDarkMode}>
        {iconInput('pickup', 'location-outline', PURPLE, {
          testID: 'urbania-pickup',
          placeholder: 'e.g. Gurugram',
        })}
        {focused === 'pickup' ? (
          <PlaceSuggestionList
            testID="urbania-pickup-suggestions"
            items={pickupPlaces.items}
            loading={pickupPlaces.loading}
            isDarkMode={isDarkMode}
            onPick={item => {
              pickupPlaces.choose(item.description);
              update('pickup', item.description);
              setChosen(current => ({
                ...current,
                pickup: item.description,
                ...(dropoffTouched.current ? {} : { dropoff: item.description }),
              }));
            }}
          />
        ) : null}
        {chosen.pickup && chosen.pickup === form.pickup ? (
          <Text testID="urbania-pickup-chosen" style={styles.caption}>
            Selected from Google Maps.
          </Text>
        ) : null}
      </Field>

      <Field label="Destination" error={errors.destination} isDarkMode={isDarkMode}>
        {iconInput('destination', 'location-outline', '#EC4899', {
          testID: 'urbania-destination',
          placeholder: 'e.g. Jim Corbett',
        })}
        {focused === 'destination' ? (
          <PlaceSuggestionList
            testID="urbania-destination-suggestions"
            items={destinationPlaces.items}
            loading={destinationPlaces.loading}
            isDarkMode={isDarkMode}
            onPick={item => {
              destinationPlaces.choose(item.description);
              update('destination', item.description);
              setChosen(current => ({ ...current, destination: item.description }));
            }}
          />
        ) : null}
        {chosen.destination && chosen.destination === form.destination ? (
          <Text testID="urbania-destination-chosen" style={styles.caption}>
            Selected from Google Maps.
          </Text>
        ) : null}
      </Field>

      {form.stops.map((stop, index) => (
        <StopField
          key={index}
          index={index}
          value={stop}
          isDarkMode={isDarkMode}
          onChange={text => updateStop(index, text)}
          onRemove={() =>
            setForm(current => ({
              ...current,
              stops: current.stops.filter((_, i) => i !== index),
            }))
          }
        />
      ))}

      {form.stops.length < MAX_STOPS ? (
        <RaisedButton
          testID="urbania-add-stop"
          label="Add a stop"
          icon="pin-outline"
          isDarkMode={isDarkMode}
          onPress={() => setForm(current => ({ ...current, stops: [...current.stops, ''] }))}
        />
      ) : null}

      <Field label="Drop-off location" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-dropoff"
          placeholder="Same as pickup unless you change it"
          {...input('dropoff')}
        />
        {focused === 'dropoff' ? (
          <PlaceSuggestionList
            testID="urbania-dropoff-suggestions"
            items={dropoffPlaces.items}
            loading={dropoffPlaces.loading}
            isDarkMode={isDarkMode}
            onPick={item => {
              dropoffPlaces.choose(item.description);
              update('dropoff', item.description);
              setChosen(current => ({ ...current, dropoff: item.description }));
            }}
          />
        ) : null}
        {chosen.dropoff && chosen.dropoff === form.dropoff ? (
          <Text testID="urbania-dropoff-chosen" style={styles.caption}>
            Selected from Google Maps.
          </Text>
        ) : null}
      </Field>

      <UrbaniaCalendar
        month={month}
        onMonthChange={setMonth}
        availability={monthAvail}
        start={form.pickupDate}
        end={form.returnDate}
        onPick={pickDay}
        isDarkMode={isDarkMode}
      />
      {errors.pickupAt || errors.returnAt ? (
        <Text testID="urbania-dates-error" style={styles.error}>
          {errors.pickupAt || errors.returnAt}
        </Text>
      ) : null}

      <View style={styles.timeRow}>
        {renderTimeField('pickup', 'Exact pickup time (IST)')}
        {renderTimeField('return', 'Exact return time (IST)')}
      </View>
      {Platform.OS === 'ios' && picker ? (
        <View style={[styles.iosPicker, isDarkMode && styles.iosPickerDark]}>
          <DateTimePicker
            testID="urbania-time-picker"
            value={timeAsDate(form[`${picker}Time`])}
            mode="time"
            display="spinner"
            themeVariant={isDarkMode ? 'dark' : 'light'}
            onValueChange={(_, date) => setSchedule({ [`${picker}Time`]: timeText(date) })}
          />
        </View>
      ) : null}

      {windowCheck.state !== 'idle' ? (
        <View
          testID="urbania-availability"
          style={[
            styles.windowCard,
            isDarkMode && styles.windowCardDark,
            windowCheck.state === 'blocked' && styles.windowCardBad,
          ]}>
          <Text style={[styles.windowNote, styles.windowNoteBig, isDarkMode && styles.mutedDark]}>
            {windowCheck.state === 'checking'
              ? 'Checking availability...'
              : windowCheck.state === 'ok'
              ? 'Selected times are available. Availability is checked again before your estimate and request.'
              : windowCheck.message}
          </Text>
        </View>
      ) : null}

      {windowInfo ? (
        <View
          testID="urbania-window"
          style={[
            styles.windowCard,
            isDarkMode && styles.windowCardDark,
            !isWindowValid(windowInfo) && styles.windowCardBad,
          ]}>
          <Text
            testID="urbania-window-title"
            style={[styles.windowTitle, isDarkMode && styles.textWhite]}>
            {describeWindow(windowInfo)}
          </Text>
          <Text style={[styles.windowNote, isDarkMode && styles.mutedDark]}>
            Maximum {MAX_STARTED_DAYS} started days, {MAX_NIGHTS} nights and {MAX_HOURS} hours.
          </Text>
        </View>
      ) : null}

      <Field label="Stay plan" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-stay"
          placeholder="Where you will stay overnight"
          {...input('stayPlan')}
        />
      </Field>

      <Field label="Itinerary notes" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-itinerary"
          placeholder="Stops, activities or timing notes"
          multiline
          textAlignVertical="top"
          {...input('itinerary')}
          style={[...boxStyle('itinerary'), styles.multiline]}
        />
      </Field>

      <Field
        label="Optional sightseeing distance (km)"
        error={errors.sightseeingKm}
        isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-km"
          placeholder="e.g. 40"
          keyboardType="decimal-pad"
          {...input('sightseeingKm')}
        />
      </Field>
    </>
  );

  const renderGroup = () => (
    <>
      <Field
        label={`Passengers (maximum ${MAX_PASSENGERS})`}
        error={errors.passengers}
        isDarkMode={isDarkMode}>
        <Stepper
          testID="passengers"
          value={form.passengers}
          min={1}
          max={MAX_PASSENGERS}
          onChange={value => update('passengers', value)}
          isDarkMode={isDarkMode}
        />
      </Field>
      <Field label="Number of pets (no fixed cap)" error={errors.pets} isDarkMode={isDarkMode}>
        <Stepper
          testID="pets"
          value={form.pets}
          min={0}
          max={MAX_PETS}
          onChange={value => update('pets', value)}
          isDarkMode={isDarkMode}
        />
      </Field>

      <Field label="Optional breed / size notes" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-breeds"
          placeholder="e.g. two Labradors and a Beagle"
          multiline
          textAlignVertical="top"
          {...input('breeds')}
          style={[...boxStyle('breeds'), styles.multiline]}
        />
      </Field>
      <Field label="Luggage notes" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-luggage"
          placeholder="Bags, crates, anything bulky"
          multiline
          textAlignVertical="top"
          {...input('luggage')}
          style={[...boxStyle('luggage'), styles.multiline]}
        />
      </Field>
      <Field label="Special requirements" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-special"
          placeholder="Anything else we should know"
          multiline
          textAlignVertical="top"
          {...input('special')}
          style={[...boxStyle('special'), styles.multiline]}
        />
      </Field>

      <View style={styles.checkBlock}>
        <Checkbox
          testID="urbania-night-driving"
          checked={form.nightDriving}
          onChange={value => update('nightDriving', value)}
          isDarkMode={isDarkMode}>
          Request night driving (10pm–6am).{' '}
          {formatRupeesExact(PRICING.nightDriving).replace('.00', '')} per affected night. A
          parking-only overnight has no charge.
        </Checkbox>
      </View>

      {form.nightDriving ? (
        nights > 0 ? (
          <Field label="Overnight periods with night driving" isDarkMode={isDarkMode}>
            <View style={styles.chips}>
              {Array.from({ length: nights }, (_, index) => index + 1).map(count => {
                const active = Math.min(form.nightPeriods, nights) === count;
                return (
                  <BouncyPressable
                    key={count}
                    testID={`urbania-night-${count}`}
                    accessibilityState={{ selected: active }}
                    activeScale={0.95}
                    onPress={() => update('nightPeriods', count)}
                    style={[styles.chip, isDarkMode && styles.chipDark, active && styles.chipOn]}>
                    <Text
                      style={[
                        styles.chipText,
                        isDarkMode && styles.mutedDark,
                        active && styles.chipTextOn,
                      ]}>
                      {count} of {nights} overnight period(s)
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </Field>
        ) : (
          <Text testID="urbania-night-hint" style={[styles.help, isDarkMode && styles.mutedDark]}>
            This trip has no overnight period yet. Add a return on a later day in step 1 to choose
            overnight periods.
          </Text>
        )
      ) : null}
    </>
  );

  const routePoints = (() => {
    const base = config?.baseAddress || config?.base?.address || BASE_PLACE;
    const points = [{ name: base, role: 'Urbania base' }];
    points.push({ name: form.pickup.trim() || 'Pickup', role: 'Pickup' });
    form.stops
      .map(stop => stop.trim())
      .filter(Boolean)
      .forEach((stop, index) => points.push({ name: stop, role: `Stop ${index + 1}` }));
    points.push({ name: form.destination.trim() || 'Destination', role: 'Destination' });
    points.push({
      name: form.dropoff.trim() || form.pickup.trim() || 'Drop-off',
      role: 'Drop-off',
    });
    points.push({ name: base, role: 'Back to base' });
    return points;
  })();

  const renderFare = (est, testID) => (
    <View testID={testID} style={[styles.fareCard, isDarkMode && styles.fareCardDark]}>
      <Text style={[styles.infoTitle, isDarkMode && styles.textWhite]}>Server fare breakdown</Text>
      {est?.hasFare ? (
        est.rows.map(row => (
          <View
            key={row.key}
            style={[
              styles.fareRow,
              isDarkMode && styles.fareRowDark,
              row.strong && styles.fareRowStrong,
            ]}>
            <Text
              style={[
                styles.fareLabel,
                isDarkMode && styles.mutedDark,
                row.strong && styles.fareStrong,
              ]}>
              {row.label}
            </Text>
            <Text
              testID={`urbania-fare-${row.key}`}
              style={[
                styles.fareValue,
                isDarkMode && styles.textWhite,
                row.strong && styles.fareStrong,
              ]}>
              {row.negative ? '-' : ''}
              {formatRupeesExact(row.value)}
            </Text>
          </View>
        ))
      ) : (
        <Text
          testID="urbania-fare-manual"
          style={[styles.fareFine, isDarkMode && styles.mutedDark]}>
          This route needs a manual review, so there is no fare yet. Akash will send you a quote
          after reviewing your request.
        </Text>
      )}
      {est?.hasFare && est.summary ? (
        <View testID="urbania-fare-summary" style={styles.fareSummary}>
          {[
            ['advance', `${PRICING.advancePercent}% advance`],
            ['balance', 'Balance at pickup'],
            ['deposit', 'Refundable damage deposit at pickup'],
          ]
            .filter(([key]) => typeof est.summary[key] === 'number')
            .map(([key, label]) => (
              <Text key={key} style={[styles.fareSummaryText, isDarkMode && styles.mutedDark]}>
                {label}:{' '}
                <Text
                  testID={`urbania-fare-${key}`}
                  style={[styles.fareSummaryValue, isDarkMode && styles.textWhite]}>
                  {formatRupeesExact(est.summary[key])}
                </Text>
              </Text>
            ))}
        </View>
      ) : null}
      {est?.fareNote ? (
        <Text testID="urbania-fare-note" style={[styles.fareFine, isDarkMode && styles.mutedDark]}>
          {est.fareNote}
        </Text>
      ) : null}
      <Text style={[styles.fareFine, isDarkMode && styles.mutedDark]}>
        Tolls and parking are payable at actuals. This estimate does not calculate a separate GST
        amount.
      </Text>
    </View>
  );

  const renderRequest = () => (
    <>
      <View testID="urbania-route" style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
        <Text style={[styles.infoTitle, isDarkMode && styles.textWhite]}>Route estimate</Text>
        <Text style={[styles.infoSource, isDarkMode && styles.mutedDark]}>
          Route distance and drive time are estimates, and Akash confirms the route and the final
          fare when the request is reviewed.
        </Text>
        {estimate?.legs?.length ? (
          <View testID="urbania-route-legs" style={styles.legList}>
            {estimate.legs.map((leg, index) => (
              <View key={`${leg.from}-${index}`} style={styles.legRow}>
                <Text style={[styles.legTitle, isDarkMode && styles.textWhite]}>
                  <Text style={styles.legFrom}>{leg.from}</Text>
                  {`  →  ${leg.to}`}
                </Text>
                <Text
                  testID={`urbania-route-leg-${index}`}
                  style={[styles.legText, isDarkMode && styles.mutedDark]}>
                  {leg.text}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.routeList}>
            {routePoints.map((point, index) => (
              <View key={`${point.role}-${index}`} style={styles.routeRow}>
                <View style={styles.routeRail}>
                  <View
                    style={[
                      styles.routeDot,
                      point.role === 'Destination' && styles.routeDotEnd,
                      (point.role === 'Urbania base' || point.role === 'Back to base') &&
                        styles.routeDotBase,
                    ]}
                  />
                  {index < routePoints.length - 1 ? <View style={styles.routeLine} /> : null}
                </View>
                <View style={styles.routeText}>
                  <Text style={[styles.routeName, isDarkMode && styles.textWhite]}>
                    {point.name}
                  </Text>
                  <Text style={[styles.routeRole, isDarkMode && styles.mutedDark]}>
                    {point.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {estimate?.distanceKm !== null && estimate?.distanceKm !== undefined ? (
          <Text
            testID="urbania-route-distance"
            style={[styles.infoTotal, isDarkMode && styles.textWhite]}>
            Total base-route: {estimate.distanceKm.toLocaleString('en-IN')} km
            {estimate.durationMinutes ? ` · ${formatDuration(estimate.durationMinutes)}` : ''}
          </Text>
        ) : null}

        {estimate?.windowStart && estimate?.windowEnd ? (
          <Text
            testID="urbania-route-window"
            style={[styles.infoStrong, isDarkMode && styles.textWhite]}>
            Base window: {estimate.windowStart} – {estimate.windowEnd}
          </Text>
        ) : windowInfo ? (
          <Text
            testID="urbania-route-window"
            style={[styles.infoStrong, isDarkMode && styles.textWhite]}>
            Base window: {formatWhen(form.pickupAt)} – {formatWhen(form.returnAt)}
          </Text>
        ) : (
          <Text
            testID="urbania-route-window"
            style={[styles.infoStrong, isDarkMode && styles.textWhite]}>
            Pickup: {formatWhen(form.pickupAt)}
          </Text>
        )}
        <Text
          testID="urbania-route-message"
          style={[styles.infoNote, isDarkMode && styles.mutedDark]}>
          {estimate?.availabilityMessage ||
            'The time appears open for a request, but the operator must review feasibility before confirmation.'}
        </Text>
        {estimate?.reasons.map((reason, index) => (
          <Text
            key={index}
            testID={`urbania-review-reason-${index}`}
            style={[styles.infoNote, isDarkMode && styles.mutedDark]}>
            {reason}
          </Text>
        ))}
        {estimate?.reasons?.length || !form.nightDriving ? null : (
          <Text
            testID="urbania-route-night"
            style={[styles.infoNote, isDarkMode && styles.mutedDark]}>
            Night driving was requested; driver-rest feasibility needs manual review.
          </Text>
        )}
      </View>

      {renderFare(estimate, 'urbania-fare')}

      <View testID="urbania-notice" style={styles.notice}>
        <Text style={styles.noticeText}>
          Customer cancellation: the {PRICING.advancePercent}% advance is non-refundable. Balance
          and {formatRupeesExact(PRICING.depositRefundable).replace('.00', '')} refundable damage
          deposit are due at pickup. Tolls and parking are at actuals. Other cancellation,
          duplicate-payment, verification and rescheduling policies must be completed before payment
          is enabled.
        </Text>
      </View>

      <Field label="Your name" error={errors.name} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-name"
          placeholder="Full name"
          autoCapitalize="words"
          {...input('name')}
        />
      </Field>
      <Field label="Mobile / WhatsApp" error={errors.phone} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-phone"
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          {...input('phone')}
        />
      </Field>
      <Field label="Email (required)" error={errors.email} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          {...input('email')}
        />
      </Field>

      <View style={styles.checkBlock}>
        <Checkbox
          testID="urbania-agree"
          checked={form.agreed}
          onChange={value => update('agreed', value)}
          isDarkMode={isDarkMode}
          error={!!errors.agreed}>
          I understand this is a provisional request, not a confirmed booking. Akash will confirm
          availability. No payment is completed by viewing a QR code or submitting a reference.
        </Checkbox>
        <Checkbox
          testID="urbania-age"
          checked={form.ageConfirmed}
          onChange={value => update('ageConfirmed', value)}
          isDarkMode={isDarkMode}
          error={!!errors.ageConfirmed}>
          I confirm that I am 18 or older.
        </Checkbox>
        <Checkbox
          testID="urbania-account-terms"
          checked={form.accountTerms}
          onChange={value => update('accountTerms', value)}
          isDarkMode={isDarkMode}
          error={!!errors.accountTerms}>
          I accept the account Terms of Service and Privacy Policy. We will prepare an account for
          this booking and email a one-time activation link. This does not sign you up for
          marketing.
        </Checkbox>
      </View>
    </>
  );

  const isLast = step === 3;
  const consented = hasAllConsents(form);
  // On the last step the send button only appears once all three boxes are ticked
  const showNext = !isLast || consented;
  const sendBlocked = !!busy;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={pastHero && !isDarkMode ? 'dark-content' : 'light-content'}
      />

      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <KeyboardAwareScrollView
        testID="urbania-scroll"
        ref={scrollRef}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(32) }}>
        <Enter index={0}>
          <UrbaniaHero
            photoIndex={photo}
            topInset={insets.top}
            onPressPhoto={() => setViewerOpen(true)}
            onBack={() => navigation.goBack()}
          />
        </Enter>
        <Enter index={1}>
          <FeatureCards isDarkMode={isDarkMode} />
        </Enter>

        <View
          style={[styles.card, isDarkMode && styles.cardDark]}
          onLayout={event => {
            cardY.current = event.nativeEvent.layout.y;
          }}>
          <LinearGradient
            pointerEvents="none"
            testID="urbania-card-accent"
            colors={['#7B2CFF', '#EC4899', '#FF7A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardAccent}
          />
          <View style={styles.cardTop}>
            <View style={styles.cardTitles}>
              <Text style={[styles.cardEyebrow, isDarkMode && styles.mutedDark]}>
                TRIP ESTIMATE & REQUEST
              </Text>
              <Text
                testID="urbania-step-title"
                style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                Plan your trip
              </Text>
            </View>
            <View style={[styles.counter, isDarkMode && styles.counterDark]}>
              <Text
                testID="urbania-step-count"
                style={[styles.counterText, isDarkMode && styles.counterTextDark]}>
                {step} of 3
              </Text>
            </View>
          </View>

          <Text
            testID="urbania-card-note"
            style={[styles.cardNote, isDarkMode && styles.mutedDark]}>
            Time zone: Asia/Kolkata. Your route is only an estimate; availability is checked again
            before confirmation. Base: Udyog Vihar Phase 5, Gurugram, Haryana, India · maximum{' '}
            {MAX_STARTED_DAYS} started day(s) / {MAX_NIGHTS} night(s).
          </Text>

          {sent ? (
            <View testID="urbania-sent" style={styles.sentCard}>
              <Text style={styles.sentKicker}>REQUEST RECEIVED</Text>
              <Text
                testID="urbania-sent-reference"
                style={[styles.sentTitle, isDarkMode && styles.textWhite]}>
                Reference {sent.reference || 'pending'}
              </Text>
              <Text style={[styles.sentNote, isDarkMode && styles.mutedDark]}>
                This is a provisional request, not a confirmed booking. Akash must confirm
                availability. Open the status here at any time; email updates are best-effort.
              </Text>

              <View testID="urbania-status-card" style={styles.statusCard}>
                <View style={styles.statusHead}>
                  <Text style={styles.statusTitle}>Booking status</Text>
                  <View style={styles.statusPill}>
                    <Text testID="urbania-status" style={styles.statusPillText}>
                      {sent.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.statusRef}>Reference {sent.reference}</Text>
                {sent.trip.places.map(place => (
                  <Pressable
                    key={place.label}
                    testID={`urbania-map-${place.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    accessibilityRole="link"
                    onPress={() => Linking.openURL(mapUrl(place.address))}>
                    <Text style={styles.statusLink} numberOfLines={1}>
                      {place.label}
                      <Text style={styles.statusPlace}>{`  ·  ${place.address}`}</Text>
                    </Text>
                  </Pressable>
                ))}
                {sent.trip.when ? (
                  <Text testID="urbania-status-when" style={styles.statusWhen}>
                    {sent.trip.when}
                  </Text>
                ) : null}
                <Text style={styles.statusFine}>
                  Payments are recorded by status, not assumed from submitted references.
                </Text>

                {sent.estimate?.hasFare ? renderFare(sent.estimate, 'urbania-status-fare') : null}

                <View testID="urbania-status-review" style={styles.statusNotice}>
                  <Text style={styles.statusNoticeText}>
                    {sent.message ||
                      (sent.status === 'pending_review'
                        ? 'This request is still under review. No payment action is available yet.'
                        : `Status: ${statusLabel(sent.status)}.`)}
                  </Text>
                </View>
              </View>

              {sent.status === 'pending_review' ? (
                <View style={styles.statusNotice}>
                  <Text style={styles.statusNoticeText}>
                    Your request needs an operator review before an advance can be requested.
                  </Text>
                </View>
              ) : null}

              {problem ? (
                <Text testID="urbania-problem" style={styles.statusError}>
                  {problem}
                </Text>
              ) : null}

              <BouncyPressable
                testID="urbania-refresh-status"
                activeScale={0.97}
                disabled={refreshing}
                onPress={handleRefresh}
                style={[styles.refreshBtn, refreshing && styles.refreshBusy]}>
                <Text style={styles.refreshText}>
                  {refreshing ? 'Refreshing…' : 'Refresh booking status'}
                </Text>
              </BouncyPressable>
              <BouncyPressable
                testID="urbania-sent-done"
                activeScale={0.96}
                onPress={() => navigation.goBack()}
                style={[styles.back, isDarkMode && styles.addStopDark]}>
                <Text style={[styles.backText, isDarkMode && styles.addStopTextDark]}>Done</Text>
              </BouncyPressable>
            </View>
          ) : (
            <>
              <StepDots step={step} onGo={goTo} isDarkMode={isDarkMode} />

              {step === 1 ? renderTrip() : step === 2 ? renderGroup() : renderRequest()}

              <View
                testID="urbania-buttons"
                style={[styles.buttons, isLast && styles.buttonsStacked]}>
                {step > 1 ? (
                  <BouncyPressable
                    testID="urbania-prev"
                    activeScale={0.96}
                    onPress={() => goTo(step - 1)}
                    style={[styles.back, isDarkMode && styles.addStopDark]}>
                    <Feather
                      name="arrow-left"
                      size={ms(16)}
                      color={isDarkMode ? '#C4B5FD' : '#3B108F'}
                    />
                    <Text style={[styles.backText, isDarkMode && styles.addStopTextDark]}>
                      Back
                    </Text>
                  </BouncyPressable>
                ) : null}
                {showNext ? (
                  <BouncyPressable
                    testID={isLast ? 'urbania-send' : 'urbania-next'}
                    accessibilityState={{ disabled: sendBlocked }}
                    disabled={sendBlocked}
                    activeScale={0.96}
                    onPress={isLast ? handleSend : step === 2 ? handleCheckFare : handleNext}
                    style={[styles.next, sendBlocked && styles.nextOff]}>
                    <LinearGradient
                      colors={
                        sendBlocked ? ['#B9A6D9', '#CDBFE6'] : ['#4C1D95', '#7B2CFF', '#C026D3']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.nextFill}>
                      <Text
                        style={styles.nextText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}>
                        {busy === 'estimate'
                          ? 'Checking route & fare...'
                          : busy === 'send'
                          ? 'Sending request...'
                          : step === 1
                          ? 'Next: passengers and pets'
                          : step === 2
                          ? 'Check route & fare'
                          : 'Send provisional request'}
                      </Text>
                      <Feather
                        name={isLast ? 'send' : step === 2 ? 'map' : 'arrow-right'}
                        size={ms(16)}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </BouncyPressable>
                ) : null}
              </View>
              {step === 1 && errors.window ? (
                <View testID="urbania-window-error" style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errors.window}</Text>
                </View>
              ) : null}
              {problem ? (
                <View testID="urbania-problem" style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{problem}</Text>
                </View>
              ) : null}
              {isLast && !consented ? (
                <Text
                  testID="urbania-consent-hint"
                  style={[styles.hint, isDarkMode && styles.mutedDark]}>
                  Tick all three boxes above to send your request.
                </Text>
              ) : null}
              {isLast ? (
                <Text style={[styles.hint, isDarkMode && styles.mutedDark]}>
                  Sending shares your request with the Urbania team. It is provisional until Akash
                  confirms it.
                </Text>
              ) : null}
            </>
          )}
        </View>

        <VehicleNote isDarkMode={isDarkMode} />
        <AgreementSection isDarkMode={isDarkMode} />
        <PricingCard />
        <BookingSteps isDarkMode={isDarkMode} />
        <FaqSection isDarkMode={isDarkMode} />

        <BouncyPressable
          testID="urbania-routes"
          activeScale={0.97}
          onPress={() => navigation.navigate('RoadTripRoutesScreen')}
          style={styles.routesLink}>
          <Ionicons name="map-outline" size={ms(16)} color={isDarkMode ? '#C4B5FD' : PURPLE} />
          <Text style={[styles.routesText, isDarkMode && styles.routesTextDark]}>
            Need ideas? Browse road trip routes
          </Text>
          <Feather name="arrow-right" size={ms(15)} color={isDarkMode ? '#C4B5FD' : PURPLE} />
        </BouncyPressable>
      </KeyboardAwareScrollView>
      {pastHero ? (
        <View
          pointerEvents="none"
          testID="urbania-status-strip"
          style={[styles.statusStrip, { height: insets.top }, isDarkMode && styles.statusStripDark]}
        />
      ) : null}

      {viewerOpen ? (
        <UrbaniaPhotoViewer index={photo} onIndexChange={setPhoto} onClose={closeViewer} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },

  statusStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF7F2',
    zIndex: 10,
  },
  statusStripDark: { backgroundColor: '#0F071D' },
  suggestions: {
    marginTop: s(6),
    borderRadius: s(16),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  suggestionsDark: {
    backgroundColor: '#220D42',
    borderColor: '#3D1C73',
    borderBottomColor: '#4C1D95',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(14),
    paddingVertical: s(11),
  },
  suggestionBorder: { borderTopWidth: 1, borderTopColor: '#F1EEF8' },
  suggestionBorderDark: { borderTopColor: '#2E1654' },
  suggestionText: { flex: 1 },
  suggestionTitle: {
    fontSize: s(13.5),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  suggestionSub: {
    marginTop: 1,
    fontSize: s(11.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.regular,
  },
  suggestionLoading: { padding: s(14) },
  cardNote: {
    marginTop: vs(8),
    fontSize: s(11.5),
    lineHeight: s(17),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.regular,
  },
  windowCard: {
    marginTop: vs(14),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#F3EEFF',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  windowCardDark: {
    backgroundColor: '#27104B',
    borderColor: '#3B1B6E',
    borderBottomColor: '#4C1D95',
  },
  windowCardBad: {
    backgroundColor: '#FDF2F2',
    borderColor: '#F0C9C9',
    borderBottomColor: '#E5A9A9',
  },
  windowTitle: {
    fontSize: s(16),
    lineHeight: s(22),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  windowNote: {
    marginTop: s(4),
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.regular,
  },
  sentCard: { paddingVertical: vs(10), gap: vs(10) },
  sentKicker: {
    fontSize: s(11),
    letterSpacing: 1.2,
    color: '#4C1D95',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    borderWidth: 1,
    borderColor: '#E9E1F7',
    padding: s(14),
    gap: vs(6),
  },
  statusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTitle: {
    fontSize: s(17),
    color: '#1F1236',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  statusPill: {
    backgroundColor: '#F1EAFB',
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  statusPillText: {
    fontSize: s(12),
    color: '#4C1D95',
    fontFamily: theme.typography.fontFamily.bold,
  },
  statusRef: { fontSize: s(13), color: '#4C1D95', fontFamily: theme.typography.fontFamily.bold },
  statusLink: {
    fontSize: s(13),
    color: '#4C1D95',
    textDecorationLine: 'underline',
    fontFamily: theme.typography.fontFamily.bold,
    paddingVertical: vs(2),
  },
  statusPlace: {
    color: '#6B6485',
    textDecorationLine: 'none',
    fontFamily: theme.typography.fontFamily.regular,
  },
  statusWhen: { fontSize: s(13), color: '#4B3F68', marginTop: vs(4) },
  statusFine: { fontSize: s(12), color: '#6B6485' },
  statusNotice: {
    backgroundColor: '#FFF6E0',
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#F3DF9C',
    padding: s(12),
  },
  statusNoticeText: { fontSize: s(13), color: '#5C4A12', lineHeight: s(19) },
  statusError: { fontSize: s(13), color: '#B42318' },
  refreshBtn: {
    backgroundColor: '#EEF3FF',
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#C9D7F8',
    paddingVertical: vs(12),
    alignItems: 'center',
  },
  refreshBusy: { opacity: 0.6 },
  refreshText: { fontSize: s(14), color: '#2D3FB5', fontFamily: theme.typography.fontFamily.bold },
  sentIcon: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentTitle: {
    fontSize: s(20),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  sentRef: { fontSize: s(14), color: '#4C1D95', fontFamily: theme.typography.fontFamily.bold },
  sentNote: {
    fontSize: s(12.5),
    lineHeight: s(19),
    textAlign: 'center',
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: vs(8),
  },
  errorBanner: {
    marginTop: vs(12),
    padding: s(14),
    borderRadius: s(14),
    backgroundColor: '#FDF2F2',
    borderWidth: 1.2,
    borderColor: '#EBCACA',
  },
  errorBannerText: {
    fontSize: s(13),
    lineHeight: s(19),
    color: '#8B2C2C',
    fontFamily: theme.typography.fontFamily.regular,
  },
  checkBlock: { marginTop: vs(16) },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
  checkBox: {
    width: s(22),
    height: s(22),
    marginTop: s(1),
    borderRadius: s(7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#B8BDC6',
  },
  checkBoxDark: {
    backgroundColor: '#220D42',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
  },
  checkBoxOn: { backgroundColor: PURPLE, borderColor: '#6D28D9', borderBottomColor: '#4C1D95' },
  checkBoxError: { borderColor: '#DC2626', borderBottomColor: '#B91C1C' },
  checkText: {
    flex: 1,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.regular,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  chip: {
    paddingHorizontal: s(14),
    paddingVertical: s(10),
    borderRadius: s(14),
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
  },
  chipDark: { backgroundColor: '#220D42', borderColor: '#3D1C73', borderBottomColor: '#240B4C' },
  chipOn: { backgroundColor: '#EFE6FF', borderColor: PURPLE, borderBottomColor: '#5B21B6' },
  chipText: {
    fontSize: s(12.5),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  chipTextOn: { color: '#4C1D95', fontFamily: theme.typography.fontFamily.bold },

  infoCard: {
    marginTop: vs(16),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#F3EEFF',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  infoCardDark: {
    backgroundColor: '#27104B',
    borderColor: '#3B1B6E',
    borderBottomColor: '#4C1D95',
  },
  infoTitle: {
    fontSize: s(15),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  infoSource: {
    marginTop: s(4),
    fontSize: s(11.5),
    lineHeight: s(17),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.regular,
  },
  infoStrong: {
    marginTop: vs(12),
    fontSize: s(13),
    lineHeight: s(19),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  infoNote: {
    marginTop: s(6),
    fontSize: s(12),
    lineHeight: s(18),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.regular,
  },
  routeList: { marginTop: vs(12) },
  routeRow: { flexDirection: 'row', gap: s(12) },
  routeRail: { alignItems: 'center', width: s(14) },
  routeDot: {
    width: s(12),
    height: s(12),
    marginTop: s(3),
    borderRadius: s(6),
    backgroundColor: PURPLE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeDotBase: { backgroundColor: '#8D809E' },
  routeDotEnd: { backgroundColor: '#EC4899' },
  routeLine: { flex: 1, width: 2, marginVertical: s(2), backgroundColor: '#C4B5FD' },
  routeText: { flex: 1, paddingBottom: s(12) },
  routeName: { fontSize: s(13), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  routeRole: { fontSize: s(11), color: '#6B5C85', fontFamily: theme.typography.fontFamily.regular },

  fareCard: {
    marginTop: vs(16),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 3,
    borderBottomColor: '#D1D5DB',
  },
  fareCardDark: {
    backgroundColor: '#220D42',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
    paddingVertical: s(10),
    borderTopWidth: 1,
    borderTopColor: '#EFEAF6',
  },
  fareRowDark: { borderTopColor: '#2E1654' },
  fareRowStrong: { borderBottomWidth: 1, borderBottomColor: '#EFEAF6' },
  fareLabel: {
    flex: 1,
    fontSize: s(12.5),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.regular,
  },
  fareValue: { fontSize: s(12.5), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  fareGood: { color: '#059669' },
  fareStrong: { fontFamily: theme.typography.fontFamily.extraBold },
  fareSplit: { marginTop: vs(10), gap: s(6) },
  fareSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
  },
  fareFine: {
    marginTop: s(8),
    fontSize: s(11),
    lineHeight: s(16),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.regular,
  },
  notice: {
    marginTop: vs(16),
    padding: s(14),
    borderRadius: s(14),
    backgroundColor: '#FFF8E6',
    borderWidth: 1.2,
    borderColor: '#F3DDA2',
  },
  noticeText: {
    fontSize: s(12),
    lineHeight: s(18),
    color: '#6B4A12',
    fontFamily: theme.typography.fontFamily.regular,
  },
  nextOff: { opacity: 0.7 },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: s(5) },
  card: {
    marginHorizontal: s(15),
    marginTop: vs(18),
    padding: s(16),
    paddingTop: s(20),
    borderRadius: s(24),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: s(10),
  },
  cardTitles: { flex: 1 },
  cardEyebrow: {
    fontSize: s(10.5),
    letterSpacing: 0.8,
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  cardTitle: {
    marginTop: 2,
    fontSize: s(22),
    letterSpacing: -0.5,
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  cardTitleDark: { color: '#FFFFFF' },
  counter: {
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    borderRadius: s(12),
    backgroundColor: '#F1ECFD',
  },
  counterDark: { backgroundColor: '#27104B' },
  counterText: { fontSize: s(12), color: '#6D28D9', fontFamily: theme.typography.fontFamily.bold },
  counterTextDark: { color: '#C4B5FD' },

  dots: { flexDirection: 'row', alignItems: 'flex-start', marginTop: vs(16), marginBottom: vs(6) },
  dotWrap: { alignItems: 'center', width: s(56) },
  dot: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  dotDark: { backgroundColor: '#1A0B30', borderColor: '#3B1B6E' },
  dotOn: { borderColor: PURPLE, overflow: 'hidden' },
  dotActive: {
    shadowColor: PURPLE,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  dotText: { fontSize: s(12.5), color: '#8D809E', fontFamily: theme.typography.fontFamily.bold },
  dotTextOn: { color: '#FFFFFF' },
  dotLabel: {
    marginTop: s(5),
    fontSize: s(11.5),
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  dotLabelOn: { color: '#6D28D9', fontFamily: theme.typography.fontFamily.bold },
  dotLine: { flex: 1, height: 2, marginTop: s(14), backgroundColor: '#E9E3F7' },
  dotLineDark: { backgroundColor: '#2E1654' },
  dotLineDone: { backgroundColor: PURPLE },

  tabs: {
    flexDirection: 'row',
    marginTop: vs(10),
    padding: TAB_PAD,
    borderRadius: s(18),
    backgroundColor: '#F1ECF9',
    borderWidth: 1.2,
    borderColor: '#E4DCF3',
  },
  tabsDark: { backgroundColor: '#12071F', borderColor: '#2E1654' },
  tab: { flex: 1 },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(12),
  },
  tabThumb: { position: 'absolute', top: TAB_PAD, bottom: TAB_PAD, left: TAB_PAD },
  tabThumbHalf: { width: '48%' },
  tabThumbDepth: {
    position: 'absolute',
    top: s(3),
    left: 0,
    right: 0,
    bottom: -s(3),
    borderRadius: s(14),
    backgroundColor: '#2A0A6B',
  },
  tabThumbFace: { flex: 1, borderRadius: s(14), overflow: 'hidden' },
  tabThumbGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tabText: {
    fontSize: s(13.5),
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  tabTextOn: { color: '#FFFFFF' },

  field: { marginTop: vs(12) },
  // Label above each text box: Manrope ExtraBold, 12 / 14, no letter spacing
  label: {
    marginBottom: s(6),
    fontSize: s(12),
    lineHeight: s(14),
    letterSpacing: 0,
    color: '#3B2A55',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  labelDark: { color: '#E9E3F7' },
  input: {
    minHeight: s(46),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
    // What is typed and the placeholder: Manrope Regular, 14 / 20
    fontSize: s(14),
    lineHeight: s(20),
    color: '#16082F',
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputDark: {
    backgroundColor: '#220D42',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
    color: '#FFFFFF',
  },
  inputFocused: {
    borderColor: '#7C3AED',
    borderBottomColor: '#5B21B6',
    backgroundColor: '#FFFFFF',
  },
  inputFocusedDark: { backgroundColor: '#2E1259', borderBottomColor: '#4C1D95' },
  inputError: { borderColor: '#DC2626', borderBottomColor: '#B91C1C' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    minHeight: s(46),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
  },
  inputBare: {
    flex: 1,
    paddingVertical: s(8),
    fontSize: s(14),
    lineHeight: s(20),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.regular,
  },
  multiline: { minHeight: s(84), paddingTop: s(12) },
  error: {
    marginTop: s(4),
    fontSize: s(11.5),
    color: '#DC2626',
    fontFamily: theme.typography.fontFamily.medium,
  },
  row: { flexDirection: 'row', gap: s(10) },
  half: { flex: 1 },
  help: {
    marginTop: vs(10),
    fontSize: s(12),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },

  raisedPress: { marginTop: vs(14) },
  raisedWrap: { paddingBottom: RAISE },
  raisedDepth: {
    position: 'absolute',
    top: RAISE,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: s(16),
    backgroundColor: '#B9A6F2',
  },
  raisedDepthDark: { backgroundColor: '#4C1D95' },
  raisedFace: {
    borderRadius: s(16),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    backgroundColor: '#F1EAFF',
  },
  raisedFaceDark: { borderColor: '#4C1D95', backgroundColor: '#27104B' },
  raisedFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(10),
    paddingVertical: s(13),
  },
  raisedGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  // On the dark purple the light-theme white gloss showed as a grey band, so it is only a faint sheen
  raisedGlossDark: { height: '40%', backgroundColor: 'rgba(196,181,253,0.07)' },
  raisedIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#DDD0FF',
  },
  raisedIconDark: { backgroundColor: '#3B1B6E', borderBottomColor: '#27104B' },
  timeRow: { flexDirection: 'row', gap: s(10), marginBottom: vs(12) },
  timeCol: { flex: 1 },
  timeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: s(13), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.medium },
  windowNoteBig: { fontSize: s(12.5), lineHeight: s(19) },
  trash: {
    position: 'absolute',
    right: 0,
    top: -vs(4),
    width: s(30),
    height: s(30),
    borderRadius: s(9),
    backgroundColor: '#F3ECFF',
    borderBottomWidth: s(2),
    borderBottomColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  trashDark: { backgroundColor: '#2E1654', borderBottomColor: '#4C1D95' },
  caption: {
    fontSize: s(10),
    color: '#6D28D9',
    marginTop: vs(3),
    fontFamily: theme.typography.fontFamily.medium,
  },
  iosPicker: {
    marginTop: s(8),
    padding: s(6),
    borderRadius: s(18),
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  iosPickerDark: { backgroundColor: '#220D42', borderColor: '#3D1C73' },
  addStopDark: { backgroundColor: '#27104B', borderColor: '#3B1B6E' },
  addStopText: {
    fontSize: s(14),
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  addStopTextDark: { color: '#C4B5FD' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: s(46),
    paddingHorizontal: s(6),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
  },
  stepBtn: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE,
    borderBottomWidth: 2.5,
    borderBottomColor: '#4C1D95',
  },
  stepBtnOff: { opacity: 0.35 },
  stepValue: {
    fontSize: s(17),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },

  infoTotal: { fontSize: ms(16), fontWeight: '800', color: '#1F1236', marginTop: vs(10) },
  legList: { marginTop: vs(8) },
  legRow: { marginBottom: vs(8) },
  legTitle: { fontSize: ms(13), color: '#4B3F68' },
  legFrom: { fontWeight: '800' },
  legText: { fontSize: ms(13), color: '#6B6485', marginTop: vs(2) },
  fareSummary: { marginTop: vs(10) },
  fareSummaryText: { fontSize: ms(14), color: '#6B6485', marginBottom: vs(6) },
  fareSummaryValue: { fontWeight: '800', color: '#2E1654' },
  estimate: {
    marginTop: vs(18),
    padding: s(16),
    borderRadius: s(20),
    overflow: 'hidden',
  },
  estimateEyebrow: {
    fontSize: s(10),
    letterSpacing: 0.7,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  estimateAmount: {
    marginTop: s(6),
    fontSize: s(26),
    letterSpacing: -0.5,
    color: '#FDE68A',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  estimateBasis: {
    marginTop: s(2),
    fontSize: s(12.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  estimateFine: {
    marginTop: s(8),
    fontSize: s(11.5),
    lineHeight: s(17),
    color: 'rgba(255,255,255,0.72)',
    fontFamily: theme.typography.fontFamily.medium,
  },

  buttons: { flexDirection: 'row', gap: s(10), marginTop: vs(20) },
  // The last step's label is long, so the buttons sit one above the other: Send on top, Back below
  buttonsStacked: { flexDirection: 'column-reverse', alignItems: 'stretch' },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    borderRadius: s(16),
    backgroundColor: '#F7F4FE',
    borderWidth: 1.2,
    borderColor: '#E4DCF3',
  },
  backText: { fontSize: s(13.5), color: '#3B108F', fontFamily: theme.typography.fontFamily.bold },
  next: { flex: 1, borderRadius: s(16), overflow: 'hidden' },
  nextFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(9),
    paddingVertical: s(15),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,5,60,0.5)',
  },
  nextText: {
    flexShrink: 1,
    fontSize: s(14.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  hint: {
    marginTop: vs(10),
    textAlign: 'center',
    fontSize: s(11.5),
    lineHeight: s(16),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },

  routesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginTop: vs(22),
    padding: s(12),
  },
  routesText: { fontSize: s(13), color: PURPLE, fontFamily: theme.typography.fontFamily.bold },
  routesTextDark: { color: '#C4B5FD' },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
