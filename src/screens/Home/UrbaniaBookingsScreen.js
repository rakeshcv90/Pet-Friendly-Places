import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useUrbaniaBookings } from '../../hooks/useUrbaniaBookings';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { Enter } from '../Community/Motion';
import { AmbientBackground } from './components/AmbientBackground';
import { UrbaniaVanScene } from './components/UrbaniaBanner';
import { api } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/apiList';
import { apiMessage, claimBooking, fetchStatus } from '../../services/urbania/urbaniaApi';
import { loadStatusToken } from '../../services/urbania/statusTokenStore';
import { loadBookings, updateBooking } from '../../services/urbania/bookingHistory';
import {
  formatRupeesExact,
  mapUrl,
  mergeBookings,
  readBookingStatus,
  statusLabel,
} from './urbaniaBooking';

// The words the website uses on the list: a request waiting for review is "Request received"
export const bookingStatusText = status =>
  !status || status === 'pending_review' ? 'Request received' : statusLabel(status);

const isProvisional = status =>
  !status || ['pending_review', 'requested', 'submitted', 'quoted'].includes(status);

const isConfirmed = status => ['confirmed', 'completed', 'paid'].includes(status);

// The colour of a booking's accent edge and pill
const toneOf = status =>
  isConfirmed(status)
    ? { bar: '#10B981', pill: '#D9F7EA', text: '#047857' }
    : ['cancelled', 'rejected', 'declined'].includes(status)
    ? { bar: '#EF4444', pill: '#FDE3E3', text: '#B42318' }
    : { bar: '#F59E0B', pill: '#FBEFD2', text: '#7A5A12' };

const MapLink = ({ label, address, testID, isDarkMode }) => (
  <Pressable
    testID={testID}
    accessibilityRole="link"
    onPress={() => Linking.openURL(mapUrl(address))}
    style={styles.mapLink}>
    <Text style={[styles.link, isDarkMode && styles.linkDark]}>{label}</Text>
  </Pressable>
);

const Fact = ({ label, children, isDarkMode, half }) => (
  <View style={[styles.fact, half && styles.factHalf]}>
    <Text style={[styles.factLabel, isDarkMode && styles.mutedDark]}>{label}</Text>
    {children}
  </View>
);

const BookingCard = ({ item, open, onToggle, onRefresh, refreshing, isDarkMode }) => {
  const id = item.reference;
  const places = item.places || [];
  const place = name => places.find(entry => entry.kind === name);
  const stops = places.filter(entry => entry.kind === 'stop');
  const fare = item.fare || {};
  const text = isDarkMode && styles.textWhite;
  const tone = toneOf(item.status);
  const from = place('pickup')?.address;
  const to = place('destination')?.address;

  return (
    <View testID={`booking-${id}`} style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={[styles.accent, { backgroundColor: tone.bar }]} />

      <View style={styles.headRow}>
        <LinearGradient
          colors={isDarkMode ? ['#3B1B6E', '#27104B'] : ['#F3ECFF', '#E3D6FB']}
          style={styles.cardIcon}>
          <Ionicons name="bus-outline" size={ms(18)} color={isDarkMode ? '#C4B5FD' : '#4C1D95'} />
        </LinearGradient>
        <View style={styles.headText}>
          <Text style={[styles.ref, text]} numberOfLines={1}>
            {id}
          </Text>
          <Text style={[styles.meta, isDarkMode && styles.mutedDark]} numberOfLines={1}>
            {item.tripType === 'local' ? 'Local' : 'Outstation'} · {item.pickupLabel}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: tone.pill }]}>
          <View style={[styles.pillDot, { backgroundColor: tone.bar }]} />
          <Text testID={`booking-${id}-status`} style={[styles.pillText, { color: tone.text }]}>
            {bookingStatusText(item.status)}
          </Text>
        </View>
      </View>

      {from || to ? (
        <View testID={`booking-${id}-route`} style={styles.timeline}>
          <View style={styles.rail}>
            <View style={[styles.railDot, { borderColor: tone.bar }]} />
            <View style={[styles.railLine, isDarkMode && styles.railLineDark]} />
            <View style={[styles.railDot, styles.railDotEnd]} />
          </View>
          <View style={styles.railText}>
            <Text style={[styles.stopText, text]} numberOfLines={1}>
              {from || 'Pickup'}
            </Text>
            <Text style={[styles.stopText, text]} numberOfLines={1}>
              {to || 'Destination'}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.footRow, isDarkMode && styles.footRowDark]}>
        {isProvisional(item.status) ? (
          <View style={styles.noteRow}>
            <Ionicons name="information-circle-outline" size={ms(14)} color="#9A7414" />
            <Text style={styles.provisional}>
              This request is provisional. It is not a confirmed trip.
            </Text>
          </View>
        ) : (
          <View style={styles.noteRow} />
        )}
        <BouncyPressable
          testID={`booking-${id}-toggle`}
          activeScale={0.95}
          onPress={() => onToggle(id)}
          style={[styles.toggle, isDarkMode && styles.toggleDark]}>
          <Text style={[styles.toggleText, isDarkMode && styles.linkDark]}>
            {open ? 'Hide details' : 'Trip details'}
          </Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={ms(15)}
            color={isDarkMode ? '#C4B5FD' : '#3B108F'}
          />
        </BouncyPressable>
      </View>

      {open ? (
        <View
          testID={`booking-${id}-details`}
          style={[styles.details, isDarkMode && styles.detailsDark]}>
          <View style={styles.facts}>
            {place('pickup') ? (
              <Fact label="Pickup" isDarkMode={isDarkMode}>
                <MapLink
                  testID={`booking-${id}-pickup`}
                  label={place('pickup').address}
                  address={place('pickup').address}
                  isDarkMode={isDarkMode}
                />
              </Fact>
            ) : null}
            {place('destination') ? (
              <Fact label="Destination" isDarkMode={isDarkMode}>
                <MapLink
                  testID={`booking-${id}-destination`}
                  label={place('destination').address}
                  address={place('destination').address}
                  isDarkMode={isDarkMode}
                />
              </Fact>
            ) : null}
            {place('drop') ? (
              <Fact label="Final drop" isDarkMode={isDarkMode}>
                <MapLink
                  testID={`booking-${id}-drop`}
                  label={place('drop').address}
                  address={place('drop').address}
                  isDarkMode={isDarkMode}
                />
              </Fact>
            ) : null}
            <Fact label="Pickup time" isDarkMode={isDarkMode} half>
              <Text style={[styles.factValue, text]}>{item.pickupLabel}</Text>
            </Fact>
            {item.returnLabel ? (
              <Fact label="Expected return" isDarkMode={isDarkMode} half>
                <Text style={[styles.factValue, text]}>{item.returnLabel}</Text>
              </Fact>
            ) : null}
            <Fact label="Trip type" isDarkMode={isDarkMode} half>
              <Text style={[styles.factValue, text]}>
                {item.tripType === 'local' ? 'Local' : 'Outstation'}
              </Text>
            </Fact>
            {stops.length ? (
              <Fact label="Planned stops" isDarkMode={isDarkMode}>
                {stops.map((stop, index) => (
                  <MapLink
                    key={`${stop.address}-${index}`}
                    testID={`booking-${id}-stop-${index}`}
                    label={stop.address}
                    address={stop.address}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </Fact>
            ) : null}
          </View>

          {typeof fare.total === 'number' ? (
            <View testID={`booking-${id}-fare`} style={styles.fareRow}>
              {[
                ['Quoted total', fare.total, true],
                ['Advance', fare.advance],
                ['Balance', fare.balance],
                ['Refundable deposit', fare.deposit],
              ]
                .filter(([, value]) => typeof value === 'number')
                .map(([label, value, strong]) => (
                  <View
                    key={label}
                    testID={`booking-${id}-chip-${label}`}
                    style={[styles.fareChip, isDarkMode && styles.fareChipDark]}>
                    <Text style={[styles.fareLabel, isDarkMode && styles.mutedDark]}>{label}</Text>
                    <Text style={[styles.fareValue, strong && styles.fareStrong, text]}>
                      {formatRupeesExact(value)}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}

          <View style={[styles.actions, isDarkMode && styles.cardDark]}>
            <Text style={[styles.actionsTitle, text]}>Booking status and actions</Text>
            <Text style={[styles.actionsLine, isDarkMode && styles.mutedDark]}>
              Current status:{' '}
              <Text testID={`booking-${id}-current`} style={[styles.fareStrong, text]}>
                {(item.status || 'pending_review').replace(/_/g, ' ')}
              </Text>
            </Text>
            <Text style={[styles.actionsLine, isDarkMode && styles.mutedDark]}>
              {item.message ||
                (isProvisional(item.status)
                  ? 'Your request needs an operator review before an advance can be requested.'
                  : 'Open the booking status again to see any new step.')}
            </Text>
            <BouncyPressable
              testID={`booking-${id}-refresh`}
              activeScale={0.97}
              disabled={refreshing}
              onPress={() => onRefresh(id)}
              style={[styles.refresh, refreshing && styles.refreshBusy]}>
              <Text style={styles.refreshText}>
                {refreshing ? 'Refreshing…' : 'Refresh booking status'}
              </Text>
            </BouncyPressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};

// "Missing a guest booking made with this email?" and the staff-review form, under the list
const ClaimAndReview = ({ isDarkMode, onClaim, claim }) => {
  const [form, setForm] = useState({ reference: '', name: '', phone: '', details: '' });
  const [state, setState] = useState({ busy: false, error: '', done: false });
  const [focused, setFocused] = useState(null);
  const [missing, setMissing] = useState({});
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const text = isDarkMode && styles.textWhite;
  // The same warm, raised input as the booking form
  const inputStyle = key => [
    styles.input,
    isDarkMode && styles.inputDark,
    focused === key && styles.inputFocused,
    focused === key && isDarkMode && styles.inputFocusedDark,
    missing[key] && styles.inputError,
  ];
  const placeholderColor = isDarkMode ? '#64748B' : '#3D2D46';

  const submit = async () => {
    if (state.busy) {
      return;
    }
    const lacking = {
      reference: !form.reference.trim(),
      name: !form.name.trim(),
      phone: form.phone.replace(/\D/g, '').length < 10,
    };
    setMissing(lacking);
    if (lacking.reference || lacking.name || lacking.phone) {
      setState({
        busy: false,
        done: false,
        error: 'Enter the booking reference, the name and a 10-digit phone used for the booking.',
      });
      return;
    }
    setState({ busy: true, error: '', done: false });
    try {
      await api.post(API_ENDPOINTS.URBANIA_STAFF_REVIEW, {
        reference: form.reference.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        details: form.details.trim(),
      });
      setForm({ reference: '', name: '', phone: '', details: '' });
      setState({ busy: false, error: '', done: true });
    } catch (error) {
      setState({
        busy: false,
        done: false,
        error: apiMessage(error, 'We could not send this request. Please try again.'),
      });
    }
  };

  return (
    <View>
      <View testID="urbania-claim" style={[styles.claim, isDarkMode && styles.claimDark]}>
        <View style={styles.claimRow}>
          <Text style={[styles.claimText, isDarkMode && styles.mutedDark]}>
            Missing a guest booking made with this email?
          </Text>
          <BouncyPressable
            testID="urbania-claim-button"
            activeScale={0.96}
            disabled={claim.busy}
            onPress={onClaim}
            style={[styles.claimBtn, isDarkMode && styles.toggleDark]}>
            <Ionicons
              name="mail-outline"
              size={ms(15)}
              color={isDarkMode ? '#C4B5FD' : '#3B108F'}
            />
            <Text style={[styles.claimBtnText, isDarkMode && styles.linkDark]}>
              {claim.busy ? 'Sending…' : 'Email a secure claim link'}
            </Text>
          </BouncyPressable>
        </View>
        {claim.message ? (
          <Text
            testID="urbania-claim-message"
            style={[styles.claimMessage, claim.failed && styles.errorText]}>
            {claim.message}
          </Text>
        ) : null}
      </View>

      <View testID="urbania-review" style={[styles.review, isDarkMode && styles.cardDark]}>
        <Text style={[styles.reviewTitle, text]}>Can’t access your booking email?</Text>
        <Text style={[styles.reviewText, isDarkMode && styles.mutedDark]}>
          Send the booking details to our staff for a manual ownership check. Your booking stays
          private and is not connected to this account unless staff approve the request.
        </Text>
        {[
          ['reference', 'Booking reference', 'default', 'e.g. URB-202611-F2036A1078'],
          ['name', 'Name used for the booking', 'default', 'Your name'],
          ['phone', 'Phone used for the booking', 'phone-pad', '10-digit mobile number'],
        ].map(([key, label, keyboard, hint]) => (
          <View key={key} style={styles.formField}>
            <Text style={[styles.formLabel, isDarkMode && styles.formLabelDark]}>{label}</Text>
            <TextInput
              testID={`urbania-review-${key}`}
              value={form[key]}
              onChangeText={value => {
                set(key, value);
                setMissing(current => ({ ...current, [key]: false }));
              }}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused(null)}
              keyboardType={keyboard}
              autoCapitalize={key === 'reference' ? 'characters' : 'words'}
              placeholder={hint}
              placeholderTextColor={placeholderColor}
              style={inputStyle(key)}
            />
          </View>
        ))}
        <View style={styles.formField}>
          <Text style={[styles.formLabel, isDarkMode && styles.formLabelDark]}>
            Other details that can help verify ownership
          </Text>
          <TextInput
            testID="urbania-review-details"
            value={form.details}
            onChangeText={value => set('details', value)}
            onFocus={() => setFocused('details')}
            onBlur={() => setFocused(null)}
            multiline
            textAlignVertical="top"
            placeholder="Anything that helps us confirm the booking is yours"
            placeholderTextColor={placeholderColor}
            style={[...inputStyle('details'), styles.textarea]}
          />
        </View>
        {state.error ? (
          <Text testID="urbania-review-error" style={styles.errorText}>
            {state.error}
          </Text>
        ) : null}
        {state.done ? (
          <Text testID="urbania-review-done" style={styles.claimMessage}>
            Thank you. Our staff will check this and email you.
          </Text>
        ) : null}
        <BouncyPressable
          testID="urbania-review-submit"
          activeScale={0.97}
          disabled={state.busy}
          onPress={submit}
          style={[styles.reviewBtn, state.busy && styles.refreshBusy]}>
          <Text style={styles.bookText}>{state.busy ? 'Sending…' : 'Request staff review'}</Text>
        </BouncyPressable>
      </View>
    </View>
  );
};

// A slowly drifting light on the banner, like the glow on the Home banner
const Glow = () => {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 3600, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 3600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          transform: [
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, s(12)] }) },
            { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
          ],
        },
      ]}
    />
  );
};

// Profile -> Urbania bookings: the account's bookings (GET /accounts/me/urbania-bookings), plus any
// made on this phone that the account does not have yet; each is refreshed from its private status
export const UrbaniaBookingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;
  const account = useUrbaniaBookings();
  const [local, setLocal] = useState(() => loadBookings());
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState({});
  const [claim, setClaim] = useState({ busy: false, message: '', failed: false });

  const bookings = useMemo(() => mergeBookings(account.data || [], local), [account.data, local]);

  const refresh = useCallback(async reference => {
    setBusy(current => ({ ...current, [reference]: true }));
    try {
      const token = await loadStatusToken(reference);
      if (token) {
        const answer = readBookingStatus(await fetchStatus(token));
        updateBooking(reference, {
          ...(answer.status ? { status: answer.status } : {}),
          message: answer.message,
        });
        setLocal(loadBookings());
      }
    } catch (e) {
      // Keep showing what was saved: the status can be refreshed again later
    }
    setBusy(current => ({ ...current, [reference]: false }));
  }, []);

  // Emails a one-time claim link. It uses each booking's own private token, so it covers the bookings
  // made on this phone.
  const handleClaim = useCallback(async () => {
    setClaim({ busy: true, message: '', failed: false });
    try {
      const tokens = (
        await Promise.all(loadBookings().map(item => loadStatusToken(item.reference)))
      ).filter(Boolean);
      if (!tokens.length) {
        setClaim({
          busy: false,
          failed: true,
          message:
            'There are no guest bookings on this phone to claim. Use the staff review below.',
        });
        return;
      }
      await Promise.all(tokens.map(token => claimBooking(token)));
      setClaim({
        busy: false,
        failed: false,
        message:
          'If earlier guest bookings match this account email, a one-time link is on its way.',
      });
    } catch (error) {
      setClaim({
        busy: false,
        failed: true,
        message: apiMessage(error, 'We could not send the link. Please try again.'),
      });
    }
  }, []);

  // Best effort on opening: bring the status of the bookings made on this phone up to date
  useEffect(() => {
    loadBookings().forEach(item => refresh(item.reference));
  }, [refresh]);

  // A status refreshed on this phone wins over an older one from the list
  const shown = bookings.map(item => {
    const mine = local.find(entry => entry.reference === item.reference);
    return mine && item.remote ? { ...item, status: mine.status, message: mine.message } : item;
  });

  const confirmed = shown.filter(item => isConfirmed(item.status)).length;

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />
      <ScreenHeader
        title="Urbania bookings"
        onBack={() => navigation.goBack()}
        testID="urbania-bookings-back"
      />

      <ScrollView
        testID="urbania-bookings-scroll"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={account.isRefetching}
            onRefresh={() => account.refetch()}
            tintColor="#7C3AED"
          />
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + vs(32) }]}>
        <Enter index={0}>
          <View testID="urbania-bookings-banner" style={styles.bannerShadow}>
            <LinearGradient
              colors={['#2A0C63', '#4C2A85', '#7B2CFF']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}>
              <Glow />
              <View pointerEvents="none" style={styles.ringBig} />
              <View style={styles.bannerText}>
                <View style={styles.kickerPill}>
                  <Ionicons name="shield-checkmark" size={ms(10)} color="#E9DDFF" />
                  <Text style={styles.bannerKicker}>PRIVATE TRIP HISTORY</Text>
                </View>
                <Text style={styles.bannerTitle}>Your Urbania bookings</Text>
                <Text style={styles.bannerSub} numberOfLines={2}>
                  Requests stay provisional until they are explicitly confirmed.
                </Text>
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text testID="urbania-stat-total" style={styles.statNumber}>
                      {shown.length}
                    </Text>
                    <Text style={styles.statLabel}>Requests</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text testID="urbania-stat-confirmed" style={styles.statNumber}>
                      {confirmed}
                    </Text>
                    <Text style={styles.statLabel}>Confirmed</Text>
                  </View>
                </View>
              </View>
              <UrbaniaVanScene style={styles.van} />
            </LinearGradient>
          </View>
        </Enter>

        {account.isLoading && !shown.length ? (
          <View testID="urbania-bookings-loading" style={styles.skeletons}>
            {[0, 1].map(index => (
              <View key={index} style={[styles.skeleton, isDarkMode && styles.cardDark]} />
            ))}
          </View>
        ) : shown.length ? (
          <>
            <Enter index={1}>
              <Text
                testID="urbania-bookings-count"
                style={[styles.section, isDarkMode && styles.textWhite]}>
                Upcoming and in progress <Text style={styles.sectionCount}>({shown.length})</Text>
              </Text>
            </Enter>
            {shown.map((item, index) => (
              <Enter key={item.reference} index={2 + index}>
                <BookingCard
                  item={item}
                  open={openId === item.reference}
                  onToggle={id => setOpenId(current => (current === id ? null : id))}
                  onRefresh={refresh}
                  refreshing={!!busy[item.reference]}
                  isDarkMode={isDarkMode}
                />
              </Enter>
            ))}
          </>
        ) : (
          <Enter index={1}>
            <View
              testID="urbania-bookings-empty"
              style={[styles.empty, isDarkMode && styles.cardDark]}>
              <Ionicons name="bus-outline" size={ms(34)} color="#7C3AED" />
              <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
                No bookings yet
              </Text>
              <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                Requests you send appear here, on every device you sign in to.
              </Text>
              <BouncyPressable
                testID="urbania-bookings-book"
                activeScale={0.97}
                onPress={() => navigation.navigate('UrbaniaBookingScreen')}
                style={styles.bookBtn}>
                <Text style={styles.bookText}>Plan a trip</Text>
              </BouncyPressable>
            </View>
          </Enter>
        )}

        {account.isError ? (
          <Text testID="urbania-bookings-error" style={styles.error}>
            We could not load your account's bookings. Showing the ones saved on this phone.
          </Text>
        ) : null}

        <ClaimAndReview isDarkMode={isDarkMode} onClaim={handleClaim} claim={claim} />

        <Text style={[styles.footer, isDarkMode && styles.mutedDark]}>
          This view shows trip details and fare summaries only. Payment proofs and operator notes
          are never shown here.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  content: { paddingHorizontal: s(15), paddingTop: vs(8) },
  bannerShadow: {
    borderRadius: s(20),
    marginBottom: vs(14),
    shadowColor: '#4C1D95',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    backgroundColor: '#4C2A85',
  },
  banner: {
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: s(12),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,5,60,0.55)',
  },
  glow: {
    position: 'absolute',
    right: -s(40),
    top: -s(50),
    width: s(190),
    height: s(190),
    borderRadius: s(95),
    backgroundColor: 'rgba(192,132,252,0.35)',
  },
  ringBig: {
    position: 'absolute',
    left: -s(60),
    bottom: -s(80),
    width: s(200),
    height: s(200),
    borderRadius: s(100),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bannerText: { zIndex: 2, maxWidth: '70%' },
  kickerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  bannerKicker: {
    fontSize: s(10),
    letterSpacing: 1.2,
    color: '#E9DDFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  bannerTitle: {
    fontSize: s(19),
    color: '#FFFFFF',
    marginTop: vs(6),
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  bannerSub: { fontSize: s(11.5), color: '#E5DCFB', marginTop: vs(3), lineHeight: s(16) },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: vs(8) },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: s(5) },
  statNumber: {
    fontSize: s(20),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  statLabel: { fontSize: s(11), color: '#D8C9F7' },
  statDivider: {
    width: 1,
    height: s(16),
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: s(10),
  },
  // The van is drawn 205 wide and scaled to 60% around its centre, so it is placed to end 10 from the edge
  van: { position: 'absolute', right: -s(31), bottom: s(10), transform: [{ scale: 0.6 }] },
  section: {
    fontSize: s(17),
    color: '#1F1236',
    marginBottom: vs(10),
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionCount: { color: '#7C3AED' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: '#EDE7F6',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD0F5',
    padding: s(13),
    paddingLeft: s(17),
    marginBottom: vs(11),
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#3B1B6E', borderBottomColor: '#2E1654' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: s(4) },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  cardIcon: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  ref: {
    fontSize: s(13.5),
    color: '#1F1236',
    letterSpacing: 0.2,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  meta: { fontSize: s(12), color: '#6B6485', marginTop: vs(1) },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  pillDot: { width: s(6), height: s(6), borderRadius: s(3) },
  pillText: { fontSize: s(10.5), fontFamily: theme.typography.fontFamily.bold },
  timeline: { flexDirection: 'row', alignItems: 'stretch', marginTop: vs(12), gap: s(10) },
  rail: { alignItems: 'center', paddingVertical: vs(4) },
  railDot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
  },
  railDotEnd: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  railLine: { flex: 1, width: 2, backgroundColor: '#E3D9F7', marginVertical: vs(2) },
  railLineDark: { backgroundColor: '#3B1B6E' },
  railText: { flex: 1, justifyContent: 'space-between', gap: vs(8) },
  stopText: { fontSize: s(13), color: '#1F1236', fontFamily: theme.typography.fontFamily.bold },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
    marginTop: vs(12),
    paddingTop: vs(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E3D9F7',
  },
  footRowDark: { borderTopColor: '#3B1B6E' },
  noteRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(4) },
  provisional: { flex: 1, fontSize: s(11), color: '#7A5A12', lineHeight: s(15) },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    borderRadius: s(12),
    borderWidth: 1,
    borderBottomWidth: 2.5,
    borderColor: '#E3D9F7',
    backgroundColor: '#F8F4FF',
    paddingHorizontal: s(11),
    paddingVertical: vs(7),
  },
  toggleDark: { borderColor: '#3B1B6E', backgroundColor: '#27104B' },
  toggleText: {
    fontSize: s(12.5),
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  linkDark: { color: '#C4B5FD' },
  details: { marginTop: vs(12), backgroundColor: '#FAF8FF', borderRadius: s(14), padding: s(12) },
  detailsDark: { backgroundColor: '#150A28' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: vs(10) },
  fact: { width: '100%', paddingRight: s(8) },
  factHalf: { width: '50%' },
  factLabel: { fontSize: s(12), color: '#6B6485' },
  factValue: { fontSize: s(13), color: '#1F1236', marginTop: vs(2) },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: vs(2) },
  link: { fontSize: s(13), color: '#6D28D9', textDecorationLine: 'underline' },
  fareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: vs(12) },
  fareChip: {
    backgroundColor: '#F1EAFB',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
  },
  fareChipDark: { backgroundColor: '#27104B' },
  fareLabel: { fontSize: s(11), color: '#6B6485' },
  fareValue: { fontSize: s(13), color: '#1F1236', fontFamily: theme.typography.fontFamily.bold },
  fareStrong: { fontFamily: theme.typography.fontFamily.extraBold },
  actions: {
    marginTop: vs(12),
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#EDE7F6',
    padding: s(12),
    gap: vs(6),
  },
  actionsTitle: { fontSize: s(14), color: '#1F1236', fontFamily: theme.typography.fontFamily.bold },
  actionsLine: { fontSize: s(13), color: '#6B6485', lineHeight: s(19) },
  refresh: {
    marginTop: vs(6),
    backgroundColor: '#EEF3FF',
    borderRadius: s(12),
    borderWidth: 1,
    borderBottomWidth: 2.5,
    borderColor: '#C9D7F8',
    paddingVertical: vs(10),
    alignItems: 'center',
  },
  refreshBusy: { opacity: 0.6 },
  refreshText: { fontSize: s(13), color: '#2D3FB5', fontFamily: theme.typography.fontFamily.bold },
  skeletons: { gap: vs(12) },
  skeleton: {
    height: vs(110),
    borderRadius: s(20),
    backgroundColor: '#EFE8FA',
    opacity: 0.7,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: '#EDE7F6',
    padding: s(22),
    gap: vs(8),
  },
  emptyTitle: { fontSize: s(16), color: '#1F1236', fontFamily: theme.typography.fontFamily.bold },
  emptyText: { fontSize: s(13), color: '#6B6485', textAlign: 'center' },
  bookBtn: {
    marginTop: vs(6),
    backgroundColor: '#4C1D95',
    borderRadius: s(14),
    borderBottomWidth: 3,
    borderBottomColor: '#2E1065',
    paddingHorizontal: s(22),
    paddingVertical: vs(11),
  },
  bookText: { color: '#FFFFFF', fontSize: s(14), fontFamily: theme.typography.fontFamily.bold },
  error: { fontSize: s(12.5), color: '#B42318', marginTop: vs(4) },
  errorText: { fontSize: s(12.5), color: '#B42318' },
  claim: {
    backgroundColor: '#F4F1FA',
    borderRadius: s(18),
    padding: s(14),
    marginTop: vs(6),
    gap: vs(10),
  },
  claimDark: { backgroundColor: '#1A0B30' },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
  },
  claimText: { flex: 1, fontSize: s(13), color: '#6B6485' },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    borderWidth: 1,
    borderBottomWidth: 2.5,
    borderColor: '#E3D9F7',
    paddingHorizontal: s(10),
    paddingVertical: vs(9),
  },
  claimBtnText: {
    fontSize: s(12.5),
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  claimMessage: { fontSize: s(13), color: '#2F6B4F' },
  review: {
    backgroundColor: '#FBF9FF',
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: '#EDE7F6',
    padding: s(16),
    marginTop: vs(14),
  },
  reviewTitle: { fontSize: s(16), color: '#1F1236', fontFamily: theme.typography.fontFamily.bold },
  reviewText: { fontSize: s(13), color: '#6B6485', lineHeight: s(19), marginTop: vs(6) },
  formField: { marginTop: vs(12) },
  formLabel: {
    marginBottom: s(6),
    fontSize: s(12),
    lineHeight: s(14),
    color: '#3B2A55',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  formLabelDark: { color: '#E9E3F7' },
  input: {
    minHeight: s(46),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
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
  textarea: { minHeight: vs(96), paddingTop: s(12) },
  reviewBtn: {
    alignSelf: 'flex-start',
    marginTop: vs(14),
    backgroundColor: '#2E1280',
    borderRadius: s(14),
    borderBottomWidth: 3,
    borderBottomColor: '#1B0A55',
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
  },
  footer: { fontSize: s(12), color: '#6B6485', marginTop: vs(8), lineHeight: s(18) },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#A9A0C0' },
});
