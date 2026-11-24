import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from './BouncyPressable';
import { PRICING, formatRupees, MAX_HOURS, MAX_STARTED_DAYS } from '../urbaniaBooking';
import { fitSize } from '../photoFit';

const PURPLE = '#7C3AED';

const HERO_HEIGHT = s(330);

const PHOTO_RATIO = 0.58;

// ── What the page says ──────────────────────────────────────────────────────────────────────────

export const HERO_CHIPS = [
  { icon: 'person-outline', label: '12 seats' },
  { icon: 'paw-outline', label: 'All breeds' },
  { icon: 'pricetag-outline', label: '10% off' },
];

export const FEATURES = [
  {
    icon: 'people-outline',
    colors: ['#8B5CF6', '#6D28D9'],
    title: '12 passenger seats',
    text: 'Separate driver seat · normal reclining seats',
  },
  {
    icon: 'paw-outline',
    colors: ['#F472B6', '#DB2777'],
    title: 'All breeds welcome',
    text: 'No fixed pet-count limit; safe space required',
  },
  {
    icon: 'time-outline',
    colors: ['#FBBF24', '#EA580C'],
    title: `Up to ${MAX_HOURS} hours`,
    text: `Maximum ${MAX_STARTED_DAYS} started days and 2 nights`,
  },
  {
    icon: 'shield-checkmark-outline',
    colors: ['#34D399', '#059669'],
    title: 'Driver & fuel included',
    text: 'Sonu’s regular driver costs included',
  },
];

export const AGREEMENT = [
  {
    title: 'Room for your group',
    text: 'Up to 12 passengers. All breeds and no fixed pet-count limit, as long as passenger, pet and luggage space stays safe and every exit remains clear.',
  },
  {
    title: 'Local NCR or short outstation',
    text: `Trips must finish within ${MAX_STARTED_DAYS} started booking days, 2 nights and ${MAX_HOURS} hours. Outstation minimum is 250 km per started 24-hour day.`,
  },
  {
    title: 'Pay only what is explained',
    text: `Customer cancellation: the ${
      PRICING.advancePercent
    }% advance is non-refundable. Remaining quoted fare and the ${formatRupees(
      PRICING.depositRefundable,
    )} refundable damage deposit are due at pickup. Tolls and parking are at actuals. Akash must complete operator-cancellation, duplicate-payment, verification and rescheduling terms before payment is enabled.`,
  },
];

export const BOOKING_STEPS = [
  {
    title: 'Share your route',
    text: 'Enter trip dates, route, group and contact details. We return a server route/fare result or offer a manual quote if routing is unavailable.',
  },
  {
    title: 'Akash reviews it',
    text: 'Your request stays provisional while route details and vehicle availability are checked. An operator-prepared quote may need your acceptance.',
  },
  {
    title: 'Advance, then confirmation',
    text: 'Only use payment details after the private status shows an advance is due. Payment is verified before booking confirmation.',
  },
];

export const FAQS = [
  {
    question: 'Can I bring multiple pets or any breed?',
    answer:
      'All breeds are welcome and there is no fixed pet-count cap. The group and luggage must fit safely and exits must remain clear.',
  },
  {
    question: 'Is this a camper or sleeper vehicle?',
    answer:
      'No. It is a private road-trip vehicle: a Force Urbania with 12 passenger seats, one separate driver seat, normal reclining seats and AC. It is not a camper, sofa van or sleeper, and we do not claim unverified amenities.',
  },
  {
    question: 'What happens to the deposit?',
    answer: `The ${formatRupees(
      PRICING.depositRefundable,
    )} damage deposit is refundable. It is due at pickup, along with the remaining quoted fare.`,
  },
  {
    question: 'Are tolls and parking included?',
    answer:
      'No. Tolls and parking are charged at actuals. The estimate does not calculate a separate GST amount, and a request is provisional until Akash confirms it.',
  },
];

// ── Pieces ──────────────────────────────────────────────────────────────────────────────────────

export const SectionHeading = ({ eyebrow, title, isDarkMode }) => (
  <View style={styles.heading}>
    <LinearGradient
      testID="urbania-heading-accent"
      colors={['#7B2CFF', '#EC4899', '#FF7A00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headingAccent}
    />
    <Text style={[styles.eyebrow, isDarkMode && styles.mutedDark]}>{eyebrow}</Text>
    <Text style={[styles.headingTitle, isDarkMode && styles.headingTitleDark]}>{title}</Text>
  </View>
);

export const GALLERY_LABELS = [
  'Side of the Urbania with the Travel With Tails and Rubicon sticker',
  'Front three-quarter view of the Urbania beside a lake',
  'Inside the Urbania: the aisle and the seats',
  'Inside the Urbania: reclining seats with blue stitching',
  'Inside the Urbania: seats and the step at the door',
];

export const GALLERY_RATIOS = [1774 / 887, 1672 / 941, 750 / 1000, 1672 / 941, 1672 / 941];
export const isPortrait = index => GALLERY_RATIOS[index] < 1;

// Starts loading every gallery photo, so they are ready by the time the booking screen opens. In a
// development build the photos come from the Metro server over the network, which is slow the first
// time; in a release build they come from the phone itself. It is only a speed-up, so any failure is
// ignored.
export const prefetchGallery = () => {
  theme.images.urbaniaGallery.forEach(source => {
    try {
      const uri = Image.resolveAssetSource(source)?.uri;
      if (uri) {
        Promise.resolve(Image.prefetch(uri)).catch(() => {});
      }
    } catch (e) {
      // nothing to do: the photo just loads when it is first drawn
    }
  });
};

// How long a photo may take before it is shown anyway, in case the "loaded" signal never comes
const SHOW_ANYWAY_MS = 1500;

// Fades a photo in when it has loaded, instead of it popping in late
const FadeIn = ({ photoKey, style, children, nativeDriver = true }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const shown = useRef(false);

  const show = useCallback(() => {
    if (shown.current) {
      return;
    }
    shown.current = true;
    Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: nativeDriver }).start();
  }, [opacity, nativeDriver]);

  useEffect(() => {
    shown.current = false;
    opacity.setValue(0);
    const timer = setTimeout(show, SHOW_ANYWAY_MS);
    return () => clearTimeout(timer);
  }, [photoKey, opacity, show]);

  return (
    <Animated.View style={[style, { opacity }]} testID="urbania-photo-fade">
      {children(show)}
    </Animated.View>
  );
};

const HeroPhoto = ({ index, photoId, width, height, motion, zIndex, nativeDriver }) => {
  const source = theme.images.urbaniaGallery[index];
  const ratio = GALLERY_RATIOS[index];
  const frame = [
    styles.heroPhoto,
    {
      height,
      zIndex,
      opacity: motion.fade,
      transform: [{ translateX: motion.x }, { scale: motion.scale }],
    },
  ];
  const filled = fitSize(ratio, width, height, 'cover');

  if (!isPortrait(index)) {
    return (
      <Animated.View testID={`${photoId}-frame`} style={frame}>
        <FadeIn photoKey={index} style={StyleSheet.absoluteFill} nativeDriver={nativeDriver}>
          {show => (
            <Image
              testID={photoId}
              source={source}
              style={[styles.heroImage, filled]}
              resizeMode="stretch"
              fadeDuration={0}
              onLoad={show}
              onError={show}
              accessibilityLabel={GALLERY_LABELS[index]}
            />
          )}
        </FadeIn>
      </Animated.View>
    );
  }

  const whole = fitSize(ratio, width, height, 'contain');
  return (
    <Animated.View testID={`${photoId}-frame`} style={frame}>
      <FadeIn photoKey={index} style={StyleSheet.absoluteFill} nativeDriver={nativeDriver}>
        {show => (
          <>
            <Image
              source={source}
              style={[styles.heroImage, filled]}
              resizeMode="stretch"
              fadeDuration={0}
              blurRadius={22}
            />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.heroBlurTint]} />
            <Image
              testID={photoId}
              source={source}
              style={[styles.heroImage, whole]}
              resizeMode="stretch"
              fadeDuration={0}
              onLoad={show}
              onError={show}
              accessibilityLabel={GALLERY_LABELS[index]}
            />
          </>
        )}
      </FadeIn>
    </Animated.View>
  );
};

export const SWIPE_MS = 1000;
const SWIPE_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const LEAVE_SHIFT = 0.28; // how far the old photo drifts, as a share of the width
const ARRIVE_ZOOM = 1.12;
const LEAVE_DIM = 0.35;
const LEAVE_SCALE = 0.96;

export const UrbaniaHero = ({
  photoIndex = 0,
  topInset = 0,
  onPressPhoto,
  onBack,
  nativeDriver = true,
}) => {
  const { width } = useWindowDimensions();
  const slots = useRef(
    [0, 1].map(i => ({
      x: new Animated.Value(i === 0 ? 0 : width),
      scale: new Animated.Value(1),
      fade: new Animated.Value(1),
    })),
  ).current;
  const [view, setView] = useState({ photos: [photoIndex, photoIndex], front: 0 });
  const active = useRef(0); // the slot at rest on screen
  const target = useRef(photoIndex); // the photo that is, or is about to be, on screen
  const pending = useRef(null); // { animation, from, to } while a change is running

  // Put the finished (or interrupted) change in its final place: new photo at rest, old one parked
  const settle = useCallback(() => {
    if (!pending.current) {
      return;
    }
    const { animation, from, to } = pending.current;
    pending.current = null;
    animation.stop();
    slots[to].x.setValue(0);
    slots[to].scale.setValue(1);
    slots[to].fade.setValue(1);
    slots[from].x.setValue(width);
    slots[from].scale.setValue(1);
    slots[from].fade.setValue(1);
    active.current = to;
  }, [slots, width]);

  useEffect(() => {
    if (photoIndex === target.current) {
      return;
    }
    settle(); // a change still running is finished first, so this one starts from a clean picture
    target.current = photoIndex;
    const from = active.current;
    const to = 1 - from;
    setView(current => ({
      photos: current.photos.map((photo, i) => (i === to ? photoIndex : photo)),
      front: to,
    }));

    const arriving = slots[to];
    const leaving = slots[from];
    arriving.x.setValue(width);
    arriving.scale.setValue(ARRIVE_ZOOM);
    arriving.fade.setValue(1);

    const move = (value, toValue) =>
      Animated.timing(value, {
        toValue,
        duration: SWIPE_MS,
        easing: SWIPE_EASE,
        useNativeDriver: nativeDriver,
      });
    const animation = Animated.parallel([
      move(arriving.x, 0),
      move(arriving.scale, 1),
      move(leaving.x, -width * LEAVE_SHIFT),
      move(leaving.fade, LEAVE_DIM),
      move(leaving.scale, LEAVE_SCALE),
    ]);
    pending.current = { animation, from, to };
    animation.start(({ finished }) => {
      if (finished) {
        settle();
      }
    });
  }, [photoIndex, slots, width, nativeDriver, settle]);

  useEffect(
    () => () => {
      pending.current?.animation.stop();
    },
    [],
  );

  const photoHeight = Math.round(width * PHOTO_RATIO) + topInset;
  const idFor = slot => (slot === view.front ? 'urbania-hero-photo' : 'urbania-hero-photo-other');

  return (
    <BouncyPressable
      testID="urbania-hero"
      accessibilityRole="button"
      accessibilityLabel="Open the photos full screen"
      activeScale={1}
      onPress={onPressPhoto}
      style={[styles.hero, { height: HERO_HEIGHT + topInset }]}>
      <View
        pointerEvents="none"
        testID="urbania-hero-photos"
        style={[styles.heroPhotos, { height: photoHeight }]}>
        {[0, 1].map(slot => (
          <HeroPhoto
            key={slot}
            index={view.photos[slot]}
            photoId={idFor(slot)}
            width={width}
            height={photoHeight}
            motion={slots[slot]}
            zIndex={slot === view.front ? 2 : 1}
            nativeDriver={nativeDriver}
          />
        ))}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(30,16,53,0)', 'rgba(30,16,53,0.15)', 'rgba(30,16,53,0.78)', '#1E1035']}
        locations={[0, 0.45, 0.8, 1]}
        style={[styles.heroFade, { height: photoHeight }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(20,8,40,0.6)', 'rgba(20,8,40,0)']}
        style={[styles.heroTopScrim, { height: topInset + s(110) }]}
      />

      <BouncyPressable
        testID="urbania-back-btn"
        accessibilityLabel="Back"
        activeScale={0.9}
        onPress={onBack}
        style={[styles.heroBack, { top: topInset + s(8) }]}>
        <Ionicons name="chevron-back" size={ms(21)} color="#FFFFFF" />
      </BouncyPressable>
      <View style={[styles.heroHeader, { top: topInset + s(10) }]} testID="urbania-hero-header">
        <Text style={styles.heroHeaderEyebrow}>PRIVATE ROAD TRIP</Text>
        <Text style={styles.heroHeaderTitle}>Book the Urbania</Text>
      </View>
      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>PET-FRIENDLY · GURUGRAM</Text>
        <Text style={styles.heroTitle}>Bring the whole pack.</Text>
        <Text style={styles.heroText}>
          A private 12-seat Force Urbania with driver, fuel and a warm welcome for every breed.
        </Text>
        <View style={styles.heroChips}>
          {HERO_CHIPS.map(chip => (
            <View key={chip.label} style={styles.heroChip}>
              <Ionicons name={chip.icon} size={ms(12)} color="#FFFFFF" />
              <Text style={styles.heroChipText}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View pointerEvents="none" style={[styles.expand, { top: topInset + s(12) }]}>
        <Ionicons name="expand-outline" size={ms(16)} color="#FFFFFF" />
      </View>
    </BouncyPressable>
  );
};

export const FeatureCards = ({ isDarkMode }) => (
  <View style={styles.featureList}>
    {FEATURES.map(item => (
      <View key={item.title} style={[styles.featureCard, isDarkMode && styles.cardDark]}>
        <LinearGradient
          testID={`urbania-feature-icon-${FEATURES.indexOf(item)}`}
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureIcon}>
          <Ionicons name={item.icon} size={ms(17)} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.featureText}>
          <Text style={[styles.featureTitle, isDarkMode && styles.textWhite]}>{item.title}</Text>
          <Text style={[styles.featureDesc, isDarkMode && styles.mutedDark]}>{item.text}</Text>
        </View>
      </View>
    ))}
  </View>
);

export const VehicleNote = ({ isDarkMode }) => (
  <View style={[styles.noteCard, isDarkMode && styles.cardDark]}>
    <Text style={[styles.noteTitle, isDarkMode && styles.textWhite]}>
      A private road-trip vehicle, not a camper
    </Text>
    <Text style={[styles.cardText, styles.noteBody, isDarkMode && styles.mutedDark]}>
      Force Urbania with 12 passenger seats and one separate driver seat. Normal reclining seats and
      AC. Driver and fuel are included. Sonu’s regular driver costs, food and overnight arrangements
      are included with no separate customer charge. Normal hair and paw cleaning is included. This
      is not a camper, sofa van or sleeper, and we do not claim unverified amenities.
    </Text>
  </View>
);

const NumberedCards = ({ items, isDarkMode, idPrefix }) => (
  <View style={styles.numberedList}>
    {items.map((item, index) => (
      <View
        key={item.title}
        testID={`${idPrefix}-card-${index}`}
        style={[styles.numberedCard, isDarkMode && styles.cardDark]}>
        <LinearGradient
          colors={['#4C1D95', '#7B2CFF', '#C026D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </LinearGradient>
        <View style={styles.featureText}>
          <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>{item.title}</Text>
          <Text style={[styles.cardText, isDarkMode && styles.mutedDark]}>{item.text}</Text>
        </View>
      </View>
    ))}
  </View>
);

// The small print about costs, in three clear rows (the same words as before, split up)
export const COST_NOTES = [
  {
    icon: 'car-outline',
    colors: ['#FBBF24', '#EA580C'],
    title: 'Tolls and parking',
    text: 'Charged at actuals.',
  },
  {
    icon: 'receipt-outline',
    colors: ['#8B5CF6', '#6D28D9'],
    title: 'GST',
    text: 'This estimate does not calculate a separate GST amount.',
  },
  {
    icon: 'checkmark-done-outline',
    colors: ['#34D399', '#059669'],
    title: 'Confirmation',
    text: 'A request is provisional until Akash confirms it.',
  },
];

const CostNotes = ({ isDarkMode }) => (
  <View style={[styles.costCard, isDarkMode && styles.cardDark]} testID="urbania-tolls">
    <LinearGradient
      pointerEvents="none"
      colors={['#FBBF24', '#EC4899', '#7B2CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.costAccent}
    />
    <View style={styles.costHeader}>
      <LinearGradient
        colors={['#FBBF24', '#EA580C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.costBadge}>
        <Ionicons name="wallet-outline" size={ms(19)} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.costHeaderText}>
        <Text style={[styles.costEyebrow, isDarkMode && styles.mutedDark]}>GOOD TO KNOW</Text>
        <Text style={[styles.costTitle, isDarkMode && styles.textWhite]}>Before you request</Text>
      </View>
    </View>

    {COST_NOTES.map((note, index) => (
      <View
        key={note.title}
        testID={`urbania-cost-row-${index}`}
        style={[styles.costRow, isDarkMode && styles.costRowDark]}>
        <LinearGradient
          colors={note.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.costIcon}>
          <Ionicons name={note.icon} size={ms(15)} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.featureText}>
          <Text style={[styles.costRowTitle, isDarkMode && styles.textWhite]}>{note.title}</Text>
          <Text style={[styles.costRowText, isDarkMode && styles.mutedDark]}>{note.text}</Text>
        </View>
      </View>
    ))}
  </View>
);

export const AgreementSection = ({ isDarkMode }) => (
  <View>
    <SectionHeading
      eyebrow="A CLEAR AGREEMENT BEFORE YOU REQUEST"
      title="Space, time and trip costs"
      isDarkMode={isDarkMode}
    />
    <NumberedCards items={AGREEMENT} isDarkMode={isDarkMode} idPrefix="urbania-agreement" />
    <CostNotes isDarkMode={isDarkMode} />
  </View>
);

// The shadow sits on a plain outer view with a solid colour, and the gradient is clipped inside it.
// A shadow (elevation) put straight on the gradient makes Android draw only a ghost box and none of
// the gradient or the text inside.
export const PricingCard = () => (
  <View style={styles.pricingShadow} testID="urbania-pricing-shadow">
    <LinearGradient
      colors={['#2A0A6B', '#5B21B6', '#C026D3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pricing}
      testID="urbania-pricing">
      <View pointerEvents="none" style={styles.pricingGlow} />
      <View testID="urbania-discount" style={styles.discount}>
        <Text style={styles.discountStrong}>10%</Text>
        <Text style={styles.discountText}> Discount Applied</Text>
      </View>
      <Text testID="urbania-pricing-eyebrow" style={styles.pricingEyebrow}>
        SIMPLE, TRANSPARENT PRICING
      </Text>
      <Text style={styles.pricingTitle}>Know the rules before the road</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Local NCR · 8h / 80 km</Text>
        <Text style={styles.priceValue}>{formatRupees(PRICING.localBase)}</Text>
      </View>
      <View style={[styles.priceRow, styles.priceRowLast]}>
        <Text style={styles.priceLabel}>Outstation · per day minimum</Text>
        <Text style={styles.priceValue}>{formatRupees(PRICING.outstationPerDay)}</Text>
      </View>
      <Text style={styles.priceFine}>
        Discounted extra local distance ₹{PRICING.extraLocalKm.toFixed(2)}/km · discounted extra
        time {formatRupees(PRICING.extraHour)} per started hour · included driver cost{' '}
        {formatRupees(PRICING.driverPerDay)}/day · night driving{' '}
        {formatRupees(PRICING.nightDriving)} per affected night (10pm–6am).
      </Text>
    </LinearGradient>
  </View>
);

export const BookingSteps = ({ isDarkMode }) => (
  <View>
    <SectionHeading
      eyebrow="FROM IDEA TO CONFIRMED TRIP"
      title="How a booking works"
      isDarkMode={isDarkMode}
    />
    <NumberedCards items={BOOKING_STEPS} isDarkMode={isDarkMode} idPrefix="urbania-booking" />
  </View>
);

export const FaqSection = ({ isDarkMode }) => {
  const [open, setOpen] = useState(0);

  return (
    <View>
      <SectionHeading eyebrow="FAQS" title="Frequently asked questions" isDarkMode={isDarkMode} />
      <View testID="urbania-faq-card" style={[styles.faqCard, isDarkMode && styles.cardDark]}>
        {FAQS.map((faq, index) => {
          const isOpen = open === index;
          return (
            <View
              key={faq.question}
              style={[
                styles.faqItem,
                index > 0 && styles.faqBorder,
                isDarkMode && styles.faqBorderDark,
              ]}>
              <BouncyPressable
                testID={`urbania-faq-${index}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                activeScale={0.99}
                onPress={() => setOpen(isOpen ? -1 : index)}
                style={styles.faqHead}>
                <Text style={[styles.faqQuestion, isDarkMode && styles.textWhite]}>
                  {faq.question}
                </Text>
                <Ionicons
                  name={isOpen ? 'caret-up' : 'caret-down'}
                  size={ms(18)}
                  color={isDarkMode ? '#FFFFFF' : '#16081F'}
                />
              </BouncyPressable>
              {isOpen ? (
                <Text
                  testID={`urbania-faq-answer-${index}`}
                  style={[styles.cardText, styles.faqAnswer, isDarkMode && styles.mutedDark]}>
                  {faq.answer}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { marginHorizontal: s(16), marginTop: vs(22), marginBottom: vs(10) },
  headingAccent: { width: s(34), height: s(4), borderRadius: s(2), marginBottom: s(8) },
  eyebrow: {
    fontSize: s(10.5),
    letterSpacing: 0.8,
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  headingTitle: {
    marginTop: 2,
    fontSize: s(21),
    letterSpacing: -0.4,
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  headingTitleDark: { color: '#FFFFFF' },

  hero: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#1E1035',
  },
  heroBack: {
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
  heroTopScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Sits to the right of the floating back button
  heroHeader: {
    position: 'absolute',
    left: s(15) + s(44) + s(12),
    right: s(15) + s(34) + s(10),
  },
  heroHeaderEyebrow: {
    fontSize: s(10.5),
    letterSpacing: 0.9,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  heroHeaderTitle: {
    marginTop: 1,
    fontSize: s(17),
    letterSpacing: -0.3,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  // The layer that holds both photo slots, behind the fade and the text
  heroPhotos: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden', zIndex: 0 },
  // The frame for one hero photo: it clips the picture, which is drawn at its own exact size inside
  heroPhoto: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  heroImage: { position: 'absolute' },
  // Ends fully dark exactly where the photo ends, so there is no visible edge
  heroFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroBlurTint: { backgroundColor: 'rgba(30,16,53,0.45)' },
  expand: {
    position: 'absolute',
    right: s(15),
    width: s(34),
    height: s(34),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,8,40,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroContent: { padding: s(16) },
  heroEyebrow: {
    fontSize: s(10.5),
    letterSpacing: 1,
    color: '#FDE68A',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  heroTitle: {
    marginTop: s(4),
    fontSize: s(29),
    lineHeight: s(33),
    letterSpacing: -0.7,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  heroText: {
    marginTop: s(6),
    fontSize: s(13),
    lineHeight: s(19),
    color: 'rgba(255,255,255,0.88)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(14) },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    paddingHorizontal: s(10),
    paddingVertical: s(6),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroChipText: {
    fontSize: s(11.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },

  featureList: { marginHorizontal: s(15), marginTop: vs(12), gap: s(8) },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: s(9),
    paddingHorizontal: s(11),
    borderRadius: s(15),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DDD6FE',
  },
  featureIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: s(13), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  featureDesc: {
    marginTop: 1,
    fontSize: s(11),
    lineHeight: s(15),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  featureText: { flex: 1 },
  cardTitle: { fontSize: s(14), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  cardText: {
    marginTop: 2,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },

  noteCard: {
    marginHorizontal: s(15),
    marginTop: vs(14),
    padding: s(16),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  noteTitle: {
    fontSize: s(16.5),
    letterSpacing: -0.3,
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  noteBody: { marginTop: s(8), fontSize: s(13), lineHeight: s(20) },

  numberedList: { marginHorizontal: s(15), gap: s(10) },
  numberedCard: {
    flexDirection: 'row',
    gap: s(12),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    // The raised bottom edge the other cards in the app have
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD6FE',
  },
  badge: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: s(12),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },

  costCard: {
    marginHorizontal: s(15),
    marginTop: vs(14),
    padding: s(16),
    paddingTop: s(20),
    borderRadius: s(22),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  costAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: s(5) },
  costHeader: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginBottom: s(6) },
  costBadge: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  costHeaderText: { flex: 1 },
  costEyebrow: {
    fontSize: s(10),
    letterSpacing: 0.8,
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  costTitle: {
    marginTop: 1,
    fontSize: s(17),
    letterSpacing: -0.3,
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: s(12),
    borderTopWidth: 1,
    borderTopColor: '#F1EEF8',
  },
  costRowDark: { borderTopColor: '#2E1654' },
  costIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  costRowTitle: {
    fontSize: s(13.5),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  costRowText: {
    marginTop: 1,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },

  pricingShadow: {
    marginHorizontal: s(15),
    marginTop: vs(22),
    borderRadius: s(24),
    // The darker colour shows below the gradient as a raised lip, the 3D edge
    paddingBottom: s(4),
    backgroundColor: '#2A0A6B',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pricing: {
    padding: s(18),
    borderRadius: s(24),
    overflow: 'hidden',
  },
  pricingGlow: {
    position: 'absolute',
    top: -s(50),
    right: -s(40),
    width: s(170),
    height: s(170),
    borderRadius: s(85),
    backgroundColor: 'rgba(236,72,153,0.28)',
  },
  // On its own line above the heading, so it can never sit on top of the text
  discount: {
    alignSelf: 'flex-start',
    marginBottom: s(10),
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    borderRadius: s(12),
    backgroundColor: '#FDF0C8',
  },
  discountStrong: {
    fontSize: s(12),
    color: '#92400E',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  discountText: {
    fontSize: s(9.5),
    color: '#92400E',
    fontFamily: theme.typography.fontFamily.medium,
  },
  pricingEyebrow: {
    marginTop: s(2),
    fontSize: s(10.5),
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  pricingTitle: {
    marginTop: s(4),
    marginBottom: s(14),
    fontSize: s(20),
    lineHeight: s(24),
    letterSpacing: -0.4,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  priceRowLast: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.18)' },
  priceLabel: {
    fontSize: s(13.5),
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  priceValue: {
    fontSize: s(17),
    color: '#FDE68A',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  priceFine: {
    marginTop: s(12),
    fontSize: s(11.5),
    lineHeight: s(17),
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontFamily.medium,
  },

  faqCard: {
    marginHorizontal: s(15),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
    overflow: 'hidden',
  },
  faqItem: { paddingHorizontal: s(14) },
  faqBorder: { borderTopWidth: 1, borderTopColor: '#F1EEF8' },
  faqBorderDark: { borderTopColor: '#2E1654' },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
    paddingVertical: s(15),
  },
  faqQuestion: {
    flex: 1,
    fontSize: s(13.5),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  faqAnswer: { marginTop: 0, marginBottom: s(14) },

  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
