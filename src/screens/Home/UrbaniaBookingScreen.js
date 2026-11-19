import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TextInput, Alert, Linking, StatusBar, StyleSheet } from 'react-native';
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
import {
  AgreementSection,
  BookingSteps,
  FaqSection,
  FeatureCards,
  PricingCard,
  UrbaniaGallery,
  UrbaniaHero,
  VehicleNote,
} from './components/UrbaniaSections';
import {
  BOOKING_EMAIL,
  EMPTY_BOOKING,
  MAX_PASSENGERS,
  MAX_PETS,
  MAX_STOPS,
  STEP_VALIDATORS,
  TRIP_TYPES,
  buildBookingMailto,
  estimateFare,
  formatDateTime,
  formatRupees,
} from './urbaniaBooking';

const PURPLE = '#7C3AED';
// Placeholder colour for the form's text boxes (a lighter grey-blue is kept for dark mode)
const PLACEHOLDER = '#3D2D46';
const PLACEHOLDER_DARK = '#64748B';
const STEPS = [
  { id: 1, label: 'Trip', title: 'Where are you going?' },
  { id: 2, label: 'Group', title: 'Who is travelling?' },
  { id: 3, label: 'Request', title: 'How can we reach you?' },
];

// ── Small pieces ────────────────────────────────────────────────────────────────────────────────

const Field = ({ label, error, isDarkMode, children, style }) => (
  <View style={[styles.field, style]}>
    <Text style={[styles.label, isDarkMode && styles.labelDark]}>{label}</Text>
    {children}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

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

// Trip / Group / Request, joined by a line; finished steps can be tapped to go back
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

// ── The screen ──────────────────────────────────────────────────────────────────────────────────

// Book Now (from the Home banner): a three-step request for the pet-friendly Urbania, sent as an email
export const UrbaniaBookingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const { data } = useUserProfile();
  const account = data?.account || data?.user || data || {};
  const scrollRef = useRef(null);
  const cardY = useRef(0);

  const [photo, setPhoto] = useState(0);
  // True once the page has scrolled past the hero photo; the status bar and back button then switch
  // to dark so they stay readable on the light page
  const [pastHero, setPastHero] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({
    ...EMPTY_BOOKING,
    name: account?.name || account?.displayName || '',
    phone: account?.phone || '',
    email: account?.email || '',
  }));
  const [errors, setErrors] = useState({});

  const update = useCallback((key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => (current[key] ? { ...current, [key]: undefined } : current));
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
    scrollRef.current?.scrollToPosition?.(0, Math.max(0, cardY.current - s(8)), true);
  }, []);

  const handleNext = useCallback(() => {
    const found = STEP_VALIDATORS[step - 1](form);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      goTo(step + 1);
    }
  }, [form, step, goTo]);

  const handleSend = useCallback(() => {
    const found = STEP_VALIDATORS[2](form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    Linking.openURL(buildBookingMailto(form)).catch(() =>
      Alert.alert(
        'Could not open your email app',
        `Please write to ${BOOKING_EMAIL} with your trip details.`,
      ),
    );
  }, [form]);

  const input = (key, extra = {}) => ({
    value: form[key],
    onChangeText: text => update(key, text),
    placeholderTextColor: isDarkMode ? PLACEHOLDER_DARK : PLACEHOLDER,
    style: [styles.input, isDarkMode && styles.inputDark, errors[key] && styles.inputError],
    ...extra,
  });

  // A text box with a coloured pin or icon on its left, like the website
  const iconInput = (key, icon, color, props) => (
    <View
      style={[styles.inputRow, isDarkMode && styles.inputDark, errors[key] && styles.inputError]}>
      <Ionicons name={icon} size={ms(17)} color={color} />
      <TextInput
        {...input(key, { style: [styles.inputBare, isDarkMode && styles.textWhite] })}
        {...props}
      />
    </View>
  );

  const fare = estimateFare(form);

  const renderTrip = () => (
    <>
      <View style={[styles.tabs, isDarkMode && styles.tabsDark]}>
        {TRIP_TYPES.map(type => {
          const active = form.tripType === type.id;
          return (
            <BouncyPressable
              key={type.id}
              testID={`urbania-type-${type.id}`}
              accessibilityState={{ selected: active }}
              activeScale={0.96}
              onPress={() => update('tripType', type.id)}
              style={styles.tab}>
              {active ? (
                <LinearGradient
                  colors={['#4C1D95', PURPLE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tabFill}>
                  <Text style={styles.tabTextOn}>{type.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabFill}>
                  <Text style={[styles.tabText, isDarkMode && styles.mutedDark]}>{type.label}</Text>
                </View>
              )}
            </BouncyPressable>
          );
        })}
      </View>

      <Field label="Pickup location" error={errors.pickup} isDarkMode={isDarkMode}>
        {iconInput('pickup', 'location-outline', PURPLE, {
          testID: 'urbania-pickup',
          placeholder: 'e.g. Gurugram',
        })}
      </Field>

      <Field label="Destination" error={errors.destination} isDarkMode={isDarkMode}>
        {iconInput('destination', 'location-outline', '#EC4899', {
          testID: 'urbania-destination',
          placeholder: 'e.g. Jim Corbett',
        })}
      </Field>

      {form.stops.map((stop, index) => (
        <Field key={index} label={`Stop ${index + 1}`} isDarkMode={isDarkMode}>
          <View style={[styles.inputRow, isDarkMode && styles.inputDark]}>
            <Ionicons name="flag-outline" size={ms(17)} color={PURPLE} />
            <TextInput
              testID={`urbania-stop-${index}`}
              value={stop}
              onChangeText={text => updateStop(index, text)}
              placeholder="Place to stop on the way"
              placeholderTextColor={isDarkMode ? PLACEHOLDER_DARK : PLACEHOLDER}
              style={[styles.inputBare, isDarkMode && styles.textWhite]}
            />
            <BouncyPressable
              testID={`urbania-remove-stop-${index}`}
              accessibilityLabel={`Remove stop ${index + 1}`}
              activeScale={0.85}
              onPress={() =>
                setForm(current => ({
                  ...current,
                  stops: current.stops.filter((_, i) => i !== index),
                }))
              }>
              <Ionicons name="close-circle" size={ms(18)} color="#94A3B8" />
            </BouncyPressable>
          </View>
        </Field>
      ))}

      {form.stops.length < MAX_STOPS ? (
        <BouncyPressable
          testID="urbania-add-stop"
          activeScale={0.97}
          onPress={() => setForm(current => ({ ...current, stops: [...current.stops, ''] }))}
          style={[styles.addStop, isDarkMode && styles.addStopDark]}>
          <Ionicons name="pin-outline" size={ms(18)} color={isDarkMode ? '#C4B5FD' : '#3B108F'} />
          <Text style={[styles.addStopText, isDarkMode && styles.addStopTextDark]}>Add stop</Text>
        </BouncyPressable>
      ) : null}

      <Field label="Drop-off location" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-dropoff"
          placeholder="If different from pickup"
          {...input('dropoff')}
        />
      </Field>

      <View style={styles.row}>
        <Field
          style={styles.half}
          label="Pickup date & time"
          error={errors.pickupAt}
          isDarkMode={isDarkMode}>
          <TextInput
            testID="urbania-pickup-at"
            placeholder="DD/MM/YYYY HH:MM"
            keyboardType="number-pad"
            maxLength={16}
            {...input('pickupAt', {
              onChangeText: text => update('pickupAt', formatDateTime(text)),
            })}
          />
        </Field>
        <Field
          style={styles.half}
          label="Expected return"
          error={errors.returnAt}
          isDarkMode={isDarkMode}>
          <TextInput
            testID="urbania-return-at"
            placeholder="DD/MM/YYYY HH:MM"
            keyboardType="number-pad"
            maxLength={16}
            {...input('returnAt', {
              onChangeText: text => update('returnAt', formatDateTime(text)),
            })}
          />
        </Field>
      </View>

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
          style={[styles.input, styles.multiline, isDarkMode && styles.inputDark]}
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
      <View style={styles.row}>
        <Field
          style={styles.half}
          label="Passengers"
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
        <Field style={styles.half} label="Pets" error={errors.pets} isDarkMode={isDarkMode}>
          <Stepper
            testID="pets"
            value={form.pets}
            min={0}
            max={MAX_PETS}
            onChange={value => update('pets', value)}
            isDarkMode={isDarkMode}
          />
        </Field>
      </View>
      <Text style={[styles.help, isDarkMode && styles.mutedDark]}>
        Up to {MAX_PASSENGERS} passengers. All breeds are welcome and there is no fixed pet-count
        limit, as long as space stays safe.
      </Text>

      <Field label="Breeds and sizes (optional)" isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-breeds"
          placeholder="e.g. two Labradors and a Beagle"
          multiline
          textAlignVertical="top"
          {...input('breeds')}
          style={[styles.input, styles.multiline, isDarkMode && styles.inputDark]}
        />
      </Field>
    </>
  );

  const renderRequest = () => (
    <>
      <Field label="Your name" error={errors.name} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-name"
          placeholder="Full name"
          autoCapitalize="words"
          {...input('name')}
        />
      </Field>
      <Field label="Phone number" error={errors.phone} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-phone"
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          {...input('phone')}
        />
      </Field>
      <Field label="Email (optional)" error={errors.email} isDarkMode={isDarkMode}>
        <TextInput
          testID="urbania-email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          {...input('email')}
        />
      </Field>

      <LinearGradient
        colors={['#2A0A6B', '#4C1D95', '#7B2CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.estimate}
        testID="urbania-estimate">
        <Text style={styles.estimateEyebrow}>YOUR ESTIMATE · 10% DISCOUNT APPLIED</Text>
        <Text style={styles.estimateAmount}>From {formatRupees(fare.amount)}</Text>
        <Text style={styles.estimateBasis}>{fare.basis}</Text>
        <Text style={styles.estimateFine}>
          Tolls and parking are charged at actuals. A request is provisional until Akash confirms
          it.
        </Text>
      </LinearGradient>
    </>
  );

  const current = STEPS[step - 1];
  const isLast = step === 3;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={pastHero && !isDarkMode ? 'dark-content' : 'light-content'}
      />

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
          <UrbaniaHero photoIndex={photo} topInset={insets.top} />
        </Enter>
        <Enter index={1}>
          <FeatureCards isDarkMode={isDarkMode} />
        </Enter>
        <UrbaniaGallery selected={photo} onSelect={setPhoto} isDarkMode={isDarkMode} />

        <View
          style={[styles.card, isDarkMode && styles.cardDark]}
          onLayout={event => {
            cardY.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.cardTop}>
            <View style={styles.cardTitles}>
              <Text style={[styles.cardEyebrow, isDarkMode && styles.mutedDark]}>
                TRIP ESTIMATE & REQUEST
              </Text>
              <Text
                testID="urbania-step-title"
                style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                {current.title}
              </Text>
            </View>
            <View style={[styles.counter, isDarkMode && styles.counterDark]}>
              <Text style={[styles.counterText, isDarkMode && styles.counterTextDark]}>
                {step} of 3
              </Text>
            </View>
          </View>

          <StepDots step={step} onGo={goTo} isDarkMode={isDarkMode} />

          {step === 1 ? renderTrip() : step === 2 ? renderGroup() : renderRequest()}

          <View style={styles.buttons}>
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
                <Text style={[styles.backText, isDarkMode && styles.addStopTextDark]}>Back</Text>
              </BouncyPressable>
            ) : null}
            <BouncyPressable
              testID={isLast ? 'urbania-send' : 'urbania-next'}
              activeScale={0.96}
              onPress={isLast ? handleSend : handleNext}
              style={styles.next}>
              <LinearGradient
                colors={['#4C1D95', '#7B2CFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextFill}>
                <Text style={styles.nextText}>
                  {step === 1
                    ? 'Next: passengers and pets'
                    : step === 2
                    ? 'Next: your details'
                    : 'Send booking request'}
                </Text>
                <Feather name={isLast ? 'send' : 'arrow-right'} size={ms(16)} color="#FFFFFF" />
              </LinearGradient>
            </BouncyPressable>
          </View>
          {isLast ? (
            <Text style={[styles.hint, isDarkMode && styles.mutedDark]}>
              This opens your email app with the details filled in, addressed to {BOOKING_EMAIL}.
            </Text>
          ) : null}
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

      {/* Stays in place while the page scrolls; glass over the photo, a light button over the page */}
      <BouncyPressable
        testID="urbania-back-btn"
        accessibilityLabel="Back"
        activeScale={0.9}
        onPress={() => navigation.goBack()}
        style={[
          styles.floatingBack,
          { top: insets.top + s(8) },
          pastHero && (isDarkMode ? styles.floatingBackDark : styles.floatingBackLight),
        ]}>
        <Ionicons
          name="chevron-back"
          size={ms(21)}
          color={pastHero && !isDarkMode ? '#1D1238' : '#FFFFFF'}
        />
      </BouncyPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },

  floatingBack: {
    position: 'absolute',
    left: s(15),
    width: s(44),
    height: s(44),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,8,40,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  floatingBackLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  floatingBackDark: { backgroundColor: '#27104B', borderColor: '#3B1B6E' },

  card: {
    marginHorizontal: s(15),
    marginTop: vs(18),
    padding: s(16),
    borderRadius: s(24),
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
  dotOn: { backgroundColor: PURPLE, borderColor: PURPLE },
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
    padding: s(4),
    borderRadius: s(16),
    backgroundColor: '#F4F1F8',
  },
  tabsDark: { backgroundColor: '#12071F' },
  tab: { flex: 1, borderRadius: s(12), overflow: 'hidden' },
  tabFill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(11),
    borderRadius: s(12),
  },
  tabText: { fontSize: s(13), color: '#8D809E', fontFamily: theme.typography.fontFamily.bold },
  tabTextOn: { fontSize: s(13), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },

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
    borderColor: '#E4DCF3',
    backgroundColor: '#FFFFFF',
    // What is typed and the placeholder: Manrope Regular, 14 / 20
    fontSize: s(14),
    lineHeight: s(20),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputDark: { backgroundColor: '#12071F', borderColor: '#2E1654', color: '#FFFFFF' },
  inputError: { borderColor: '#DC2626' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    minHeight: s(46),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E4DCF3',
    backgroundColor: '#FFFFFF',
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

  addStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginTop: vs(14),
    paddingVertical: s(14),
    borderRadius: s(16),
    backgroundColor: '#F7F4FE',
    borderWidth: 1.2,
    borderColor: '#E4DCF3',
  },
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
    borderColor: '#E4DCF3',
    backgroundColor: '#FFFFFF',
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
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
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
