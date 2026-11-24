import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import FastImage from '../../components/common/FastImage';
import { resolveImageUrl } from '../../hooks/useDiscovery';

const STAMPS_PER_PAGE = 4;
const GOLD = '#F5C842';
const SEAL = s(58);
const BOOK_HEIGHT = s(300);
const FLIP_MS = 650;

// Shapes and inks cycle across the stamps, like the website's mixed pages
const SHAPES = ['circle', 'square', 'oval', 'banner', 'hexagon'];
const INKS = ['#3B2BA8', '#A0602F', '#6B2FA8', '#3E8A5C', '#A8456E', '#3B6DB0'];

const stampDate = iso => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
};

// Outline hexagon drawn from six bars (no SVG in the project)
const Hexagon = ({ size, color, thickness = 2.5 }) => {
  const side = size / 2;
  const apothem = (side * Math.sqrt(3)) / 2;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i * 60 * Math.PI) / 180;
        const cx = size / 2 + apothem * Math.cos(angle);
        const cy = size / 2 + apothem * Math.sin(angle);
        const length = side + thickness;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: length,
              height: thickness,
              left: cx - length / 2,
              top: cy - thickness / 2,
              backgroundColor: color,
              transform: [{ rotate: `${i * 60 + 90}deg` }],
            }}
          />
        );
      })}
    </View>
  );
};

const TILTS = [-5, 3, -2, 6, -4, 2];

// Every stamp lands a little crooked, like it was pressed by hand
const Seal = props => (
  <View
    style={{ opacity: 0.92, transform: [{ rotate: `${TILTS[props.variant % TILTS.length]}deg` }] }}>
    <SealShape {...props} />
  </View>
);

const SealShape = ({ stamp, variant }) => {
  const shape = SHAPES[variant % SHAPES.length];
  const color = INKS[variant % INKS.length];
  const city = (stamp.listingCity || stamp.listingName || '').toUpperCase();
  const content = (
    <>
      <Text style={[styles.sealCity, { color }]} numberOfLines={2} adjustsFontSizeToFit>
        {city}
      </Text>
      <Ionicons name="car-sport-outline" size={ms(14)} color={color} />
      <Text style={[styles.sealDate, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {stampDate(stamp.awardedAt)}
      </Text>
    </>
  );

  if (shape === 'banner') {
    return (
      <View testID="seal-banner" style={styles.sealBanner}>
        <View style={[styles.bannerLine, { backgroundColor: color }]} />
        <View style={styles.sealInner}>{content}</View>
        <View style={[styles.bannerLine, { backgroundColor: color }]} />
      </View>
    );
  }
  if (shape === 'hexagon') {
    return (
      <View testID="seal-hexagon" style={styles.sealFrame}>
        <View style={StyleSheet.absoluteFill}>
          <Hexagon size={SEAL * 1.05} color={color} thickness={3} />
        </View>
        <View style={StyleSheet.absoluteFill}>
          <View style={{ margin: SEAL * 0.16 }}>
            <Hexagon size={SEAL * 0.73} color={color} thickness={1.5} />
          </View>
        </View>
        <View style={styles.sealInner}>{content}</View>
      </View>
    );
  }
  if (shape === 'square') {
    return (
      <View
        testID="seal-square"
        style={[
          styles.sealFrame,
          { borderWidth: 2, borderColor: color, borderRadius: 2, transform: [{ rotate: '-2deg' }] },
        ]}>
        <View style={styles.sealInner}>{content}</View>
      </View>
    );
  }
  const frame =
    shape === 'circle'
      ? { width: SEAL, height: SEAL, borderRadius: SEAL / 2 }
      : { width: SEAL * 1.12, height: SEAL * 0.82, borderRadius: SEAL / 2 };
  return (
    <View
      testID={`seal-${shape}`}
      style={[styles.sealFrame, frame, { borderWidth: 3.5, borderColor: color }]}>
      <View style={[styles.sealRing, { borderColor: color, borderRadius: SEAL }]}>{content}</View>
    </View>
  );
};

const Cover = ({ name, breed, photoUrl, emoji }) => (
  <LinearGradient colors={['#2F55AE', '#14295E']} style={styles.cover}>
    <View style={styles.spine} />
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.18)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View pointerEvents="none" style={styles.coverFrame} />
    {['TL', 'TR', 'BL', 'BR'].map(corner => (
      <View key={corner} pointerEvents="none" style={[styles.corner, styles[`corner${corner}`]]} />
    ))}
    <View style={styles.coverBody}>
      <Text style={styles.coverTop}>TRAVELLING TAILS · INDIA</Text>
      <View style={styles.emblem}>
        <Text style={styles.emblemEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.coverTitle}>PAWSPORT</Text>
      <Text style={styles.coverDoc} numberOfLines={1} adjustsFontSizeToFit>
        DOG TRAVEL DOCUMENT · पेट पासपोर्ट
      </Text>
      {photoUrl ? (
        <FastImage source={{ uri: resolveImageUrl(photoUrl) }} style={styles.coverPhoto} />
      ) : null}
      <Text style={styles.coverName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.coverBreed} numberOfLines={1}>
        {(breed || '').toUpperCase()}
      </Text>
      <Text style={styles.coverQuote}>
        “Nose to the window, paws on the road, home is wherever we go together.”
      </Text>
    </View>
  </LinearGradient>
);

// One page of four stamp slots. `stamps` is null for a page past the end of the book.
const StampPage = ({ stamps, number, firstIndex, side = 'right' }) => (
  <LinearGradient colors={['#FFFCF3', '#F8F1DD']} style={styles.page}>
    <View pointerEvents="none" style={styles.pageFrame} />
    <Text style={styles.pageLabel}>PLACES VISITED</Text>
    <View style={styles.slots}>
      {[0, 1, 2, 3].map(slot => {
        const stamp = stamps?.[slot];
        return (
          <View key={slot} style={styles.slot}>
            {stamp ? (
              <Seal stamp={stamp} variant={firstIndex + slot} />
            ) : stamps ? (
              <Ionicons name="paw" size={ms(22)} color="#EFE5C6" />
            ) : null}
          </View>
        );
      })}
    </View>
    {stamps ? (
      <View style={styles.pageNo}>
        <Text style={styles.pageNoText}>Page {number}</Text>
      </View>
    ) : null}
    {/* Shadow where the paper curves into the spine */}
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(110,80,30,0.22)', 'rgba(110,80,30,0)']}
      start={{ x: side === 'right' ? 0 : 1, y: 0 }}
      end={{ x: side === 'right' ? 1 : 0, y: 0 }}
      style={[styles.gutter, side === 'right' ? { left: 0 } : { right: 0 }]}
    />
    {side === 'right' && number === 1 ? <View pointerEvents="none" style={styles.ribbon} /> : null}
  </LinearGradient>
);

// Spread 0 is the cover and page 1. Every later spread shows two stamp pages: (2, 3), (4, 5)...
const leftPage = spread => 2 * spread;
const rightPage = spread => (spread === 0 ? 1 : 2 * spread + 1);

// The pet's Pawsport book. Next / Previous turn a leaf like a real book.
export const PawsportBook = ({ name, breed, photoUrl, emoji = '🐕', stamps = [], isDarkMode }) => {
  const [spread, setSpread] = useState(0);
  // { from, to } while a leaf is turning; null when the book is still
  const [turn, setTurn] = useState(null);
  const [bookWidth, setBookWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const pageCount = Math.max(1, Math.ceil(stamps.length / STAMPS_PER_PAGE));
  const spreadCount = 1 + Math.ceil((pageCount - 1) / 2);
  const half = bookWidth / 2;

  const pageStamps = number =>
    number >= 1 && number <= pageCount
      ? stamps.slice((number - 1) * STAMPS_PER_PAGE, number * STAMPS_PER_PAGE)
      : null;

  const renderLeft = index =>
    index === 0 ? (
      <Cover name={name} breed={breed} photoUrl={photoUrl} emoji={emoji} />
    ) : (
      <View style={styles.leftWithSpine}>
        <LinearGradient colors={['#2F55AE', '#14295E']} style={styles.pageSpine}>
          <Text style={styles.spineText}>PAWSPORT</Text>
        </LinearGradient>
        <StampPage
          stamps={pageStamps(leftPage(index))}
          number={leftPage(index)}
          side="left"
          firstIndex={(leftPage(index) - 1) * STAMPS_PER_PAGE}
        />
      </View>
    );
  const renderRight = index => (
    <StampPage
      stamps={pageStamps(rightPage(index))}
      number={rightPage(index)}
      firstIndex={(rightPage(index) - 1) * STAMPS_PER_PAGE}
    />
  );

  const goTo = target => {
    if (turn || target < 0 || target >= spreadCount || target === spread) {
      return;
    }
    progress.setValue(0);
    setTurn({ from: spread, to: target });
    Animated.timing(progress, {
      toValue: 1,
      duration: FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Settle the book on the new spread underneath the leaf first, so nothing remounts in view,
      // then lift the leaf away on the next frame.
      setSpread(target);
      setTurn(current => (current ? { ...current, done: true } : current));
      requestAnimationFrame(() => setTurn(null));
    });
  };

  const forward = !!turn && turn.to > turn.from;
  // While a leaf turns, the pages under it show the new spread's far side
  const baseLeft = turn && !turn.done ? (forward ? turn.from : turn.to) : spread;
  const baseRight = turn && !turn.done ? (forward ? turn.to : turn.from) : spread;

  const leafStyle = () => {
    const rotate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', forward ? '-180deg' : '180deg'],
    });
    return [
      styles.leaf,
      {
        width: half,
        left: forward ? half : 0,
        transform: [
          { perspective: 1400 },
          { translateX: forward ? -half / 2 : half / 2 },
          { rotateY: rotate },
          { translateX: forward ? half / 2 : -half / 2 },
        ],
      },
    ];
  };

  const atStart = spread === 0 && !turn;
  const atEnd = spread >= spreadCount - 1 && !turn;

  return (
    <View style={[styles.wrap, isDarkMode && styles.wrapDark]}>
      <Text style={styles.label}>PAWSPORT — PLACES VISITED</Text>
      <View style={styles.bookWrap}>
        <View pointerEvents="none" style={styles.pageEdgeB} />
        <View pointerEvents="none" style={styles.pageEdgeA} />
        <View
          testID="pawsport-book"
          style={styles.book}
          onLayout={e => setBookWidth(e.nativeEvent.layout.width)}>
          <View style={styles.half}>{renderLeft(baseLeft)}</View>
          <View style={[styles.half, styles.rightHalf]}>{renderRight(baseRight)}</View>

          {turn && half > 0 ? (
            <Animated.View testID="pawsport-leaf" style={leafStyle()}>
              <View style={[styles.face, styles.faceFront]}>
                {forward ? renderRight(turn.from) : renderLeft(turn.from)}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.leafShade,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.45, 0.45],
                      }),
                    },
                  ]}
                />
              </View>
              <View style={[styles.face, styles.faceBack]}>
                {forward ? renderLeft(turn.to) : renderRight(turn.to)}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.leafShade,
                    {
                      opacity: progress.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.45, 0.45, 0],
                      }),
                    },
                  ]}
                />
              </View>
            </Animated.View>
          ) : null}
        </View>
      </View>

      <View style={styles.nav}>
        <BouncyPressable
          testID="pawsport-prev"
          activeScale={0.94}
          disabled={atStart}
          onPress={() => goTo(spread - 1)}
          style={[styles.navBtn, atStart && styles.navOff]}>
          <Text style={[styles.navText, !atStart && styles.navTextOn]}>Previous</Text>
        </BouncyPressable>
        <BouncyPressable
          testID="pawsport-next"
          activeScale={0.94}
          disabled={atEnd}
          onPress={() => goTo(spread + 1)}
          style={[styles.navBtn, atEnd && styles.navOff]}>
          <Text style={[styles.navText, !atEnd && styles.navTextOn]}>Next</Text>
        </BouncyPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#EFE9DD',
    borderRadius: s(20),
    paddingVertical: s(16),
    paddingHorizontal: s(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3DAC6',
  },
  wrapDark: { backgroundColor: '#1A1230' },
  label: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(10),
    letterSpacing: 2,
    color: '#9A948C',
    marginBottom: s(10),
  },
  book: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    height: BOOK_HEIGHT,
    borderRadius: s(8),
    shadowColor: '#2A1A05',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  bookWrap: { alignSelf: 'stretch' },
  pageEdgeA: {
    position: 'absolute',
    left: s(3),
    right: -s(3),
    top: s(3),
    bottom: -s(3),
    borderRadius: s(8),
    backgroundColor: '#EDE5CC',
    borderWidth: 0.5,
    borderColor: '#D9CFB0',
  },
  pageEdgeB: {
    position: 'absolute',
    left: s(6),
    right: -s(6),
    top: s(6),
    bottom: -s(6),
    borderRadius: s(8),
    backgroundColor: '#E2D8BA',
    borderWidth: 0.5,
    borderColor: '#CFC3A0',
  },
  coverFrame: {
    position: 'absolute',
    top: s(10),
    bottom: s(10),
    left: s(16),
    right: s(8),
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.45)',
    borderRadius: s(3),
  },
  pageFrame: {
    position: 'absolute',
    top: s(5),
    bottom: s(5),
    left: s(5),
    right: s(5),
    borderWidth: 0.75,
    borderColor: '#E7DBB5',
    borderRadius: s(3),
  },
  gutter: { position: 'absolute', top: 0, bottom: 0, width: s(22) },
  ribbon: {
    position: 'absolute',
    top: 0,
    right: s(14),
    width: s(9),
    height: s(38),
    backgroundColor: '#B8323C',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  cast: { position: 'absolute', top: 0, bottom: 0 },
  corner: { position: 'absolute', width: s(9), height: s(9), borderColor: GOLD },
  cornerTL: { top: s(7), left: s(13), borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  cornerTR: { top: s(7), right: s(5), borderTopWidth: 1.5, borderRightWidth: 1.5 },
  cornerBL: { bottom: s(7), left: s(13), borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  cornerBR: { bottom: s(7), right: s(5), borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  leafShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#3A2710' },
  half: { flex: 1, overflow: 'hidden' },
  rightHalf: {
    borderLeftWidth: 1,
    borderLeftColor: '#E4DECB',
    borderTopRightRadius: s(8),
    borderBottomRightRadius: s(8),
  },
  leaf: { position: 'absolute', top: 0, bottom: 0 },
  face: { ...StyleSheet.absoluteFillObject, backfaceVisibility: 'hidden', overflow: 'hidden' },
  faceFront: {},
  faceBack: { transform: [{ rotateY: '180deg' }] },
  leftWithSpine: {
    flex: 1,
    flexDirection: 'row',
    borderTopLeftRadius: s(8),
    borderBottomLeftRadius: s(8),
    overflow: 'hidden',
  },
  pageSpine: { width: s(14), alignItems: 'center', justifyContent: 'center' },
  spineText: {
    width: s(80),
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(6),
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-90deg' }],
  },
  cover: { flex: 1, flexDirection: 'row', borderTopLeftRadius: s(8), borderBottomLeftRadius: s(8) },
  spine: { width: s(8), backgroundColor: 'rgba(10,20,60,0.55)' },
  coverBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(6) },
  coverTop: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(6.5),
    letterSpacing: 1.2,
    color: GOLD,
    textAlign: 'center',
  },
  emblem: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: 'rgba(245,200,66,0.1)',
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: s(8),
  },
  emblemEmoji: { fontSize: s(20) },
  coverTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    letterSpacing: 2.5,
    color: GOLD,
    textShadowColor: 'rgba(245,200,66,0.55)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  coverDoc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(5.5),
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.55)',
    marginTop: s(2),
    marginBottom: s(8),
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  coverPhoto: {
    width: s(36),
    height: s(42),
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 2,
    marginBottom: s(5),
  },
  coverName: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(11), color: '#FFFFFF' },
  coverBreed: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(6),
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.6)',
    marginTop: s(1),
  },
  coverQuote: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(7.5),
    lineHeight: s(11),
    fontStyle: 'italic',
    color: GOLD,
    textAlign: 'center',
    marginTop: s(10),
    paddingHorizontal: s(2),
  },

  page: { flex: 1, backgroundColor: '#FDFAF0' },
  pageLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(6.5),
    letterSpacing: 1.5,
    color: '#C4BEB2',
    paddingHorizontal: s(8),
    paddingVertical: s(8),
    borderBottomWidth: 0.75,
    borderBottomColor: '#E7DBB5',
    marginHorizontal: s(5),
    marginTop: s(5),
    textAlign: 'center',
  },
  slots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  slot: {
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#EFE5C6',
  },
  pageNo: {
    position: 'absolute',
    right: s(6),
    bottom: s(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEAD9',
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: s(3),
  },
  pageNoText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(6.5),
    fontStyle: 'italic',
    color: '#B8B2A6',
  },

  sealFrame: { width: SEAL, height: SEAL, alignItems: 'center', justifyContent: 'center' },
  sealRing: {
    width: '84%',
    height: '84%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(3),
  },
  sealInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
    maxWidth: SEAL,
  },
  sealCity: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(7.5),
    textAlign: 'center',
  },
  sealDate: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(5.5), opacity: 0.8 },
  sealBanner: { width: SEAL * 1.1, alignItems: 'center' },
  bannerLine: { alignSelf: 'stretch', height: 2, marginVertical: s(3) },

  nav: { flexDirection: 'row', gap: s(10), marginTop: s(12) },
  navBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingHorizontal: s(22),
    paddingVertical: s(9),
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navOff: { opacity: 0.55 },
  navText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12.5),
    color: '#9A948C',
  },
  navTextOn: { color: '#1A1A2E' },
});
