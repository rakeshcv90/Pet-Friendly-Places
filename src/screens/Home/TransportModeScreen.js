/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, RefreshControl, Linking } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useTransportMode, resolveImageUrl } from '../../hooks/useDiscovery';
import { WEB_BASE_URL } from '../../services/api/apiList';
import FastImage from '../../components/common/FastImage';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from './components/AmbientBackground';

const decodeText = text =>
  text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();


const parseBody = html => {
  if (!html) {
    return [];
  }
  const prepared = html.replace(
    /<div class="brush-callout[^"]*">\s*<div class="brush-title">([\s\S]*?)<\/div>\s*<div class="brush-body">([\s\S]*?)<\/div>\s*<\/div>/gi,
    '<h3>$1</h3><p>$2</p>',
  );
  const blocks = [];
  const regex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = regex.exec(prepared);
  while (match !== null) {
    const text = decodeText(match[2]);
    if (text) {
      const tag = match[1].toLowerCase();
      blocks.push({ type: tag === 'li' ? 'bullet' : tag === 'p' ? 'paragraph' : 'heading', text });
    }
    match = regex.exec(prepared);
  }
  return blocks;
};

const BodyBlocks = ({ blocks, isDarkMode }) =>
  blocks.map((block, idx) => {
    if (block.type === 'heading') {
      return (
        <Text key={idx} style={[styles.bodyHeading, isDarkMode && styles.textLight]}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'bullet') {
      return (
        <View key={idx} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={[styles.bodyText, styles.bulletText, isDarkMode && styles.textMutedDark]}>
            {block.text}
          </Text>
        </View>
      );
    }
    return (
      <Text key={idx} style={[styles.bodyText, isDarkMode && styles.textMutedDark]}>
        {block.text}
      </Text>
    );
  });

const InfoRow = ({ label, value, isDarkMode }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, isDarkMode && styles.textMutedDark]}>{label}</Text>
      <Text style={[styles.infoValue, isDarkMode && styles.textLight]}>{value}</Text>
    </View>
  ) : null;

const SectionHeading = ({ overline, title, isDarkMode }) => (
  <View style={styles.sectionHead}>
    {overline ? (
      <Text style={[styles.overline, isDarkMode && styles.textMutedDark]}>{overline}</Text>
    ) : null}
    <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>{title}</Text>
  </View>
);

const VehicleCard = ({ vehicle, emoji, verifiedLabel, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const body = useMemo(() => (expanded ? parseBody(vehicle.body) : []), [expanded, vehicle.body]);
  const isVerified = vehicle.verification_tier === 'TAILS_VERIFIED';
  const cover = resolveImageUrl(vehicle.cover_image_url);
  const overline = [vehicle.vehicle_name, vehicle.vehicle_number].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={styles.vehicleTop}>
        <View style={[styles.vehicleIconBox, isDarkMode && styles.iconBoxDark]}>
          <Text style={styles.vehicleEmoji}>{emoji}</Text>
        </View>
        <View style={styles.vehicleHead}>
          <Text style={styles.vehicleOverline}>{overline.toUpperCase()}</Text>
          <Text style={[styles.vehicleTitle, isDarkMode && styles.textLight]}>{vehicle.title}</Text>
        </View>
      </View>

      <View style={[styles.tierPill, isVerified ? styles.tierVerified : styles.tierResearch]}>
        <Feather
          name={isVerified ? 'check-circle' : 'book-open'}
          size={ms(11)}
          color={isVerified ? '#047857' : '#B45309'}
        />
        <Text style={[styles.tierText, { color: isVerified ? '#047857' : '#B45309' }]}>
          {isVerified ? verifiedLabel || 'Tails Verified' : 'Research based'}
        </Text>
      </View>

      {cover ? (
        <FastImage
          source={{ uri: cover }}
          style={styles.cover}
          resizeMode={FastImage.resizeMode.cover}
          accessibilityLabel={vehicle.cover_image_alt || vehicle.title}
        />
      ) : null}

      <Text
        style={[styles.bodyText, isDarkMode && styles.textMutedDark]}
        numberOfLines={expanded ? undefined : 3}>
        {vehicle.excerpt}
      </Text>

      {vehicle.pet_verdict_note ? (
        <View style={[styles.noteBox, isDarkMode && styles.noteBoxDark]}>
          <Text style={[styles.noteText, isDarkMode && styles.noteTextDark]}>
            {vehicle.pet_verdict_note}
          </Text>
        </View>
      ) : null}

      {expanded ? (
        <>
          <InfoRow label="APPROX. COST" value={vehicle.approx_cost_note} isDarkMode={isDarkMode} />
          <InfoRow
            label="ONLINE BOOKING"
            value={
              vehicle.online_booking === true
                ? 'Yes'
                : vehicle.online_booking === false
                ? 'No'
                : null
            }
            isDarkMode={isDarkMode}
          />
          {vehicle.verified_note ? (
            <Text style={[styles.verifiedNote, isDarkMode && styles.textMutedDark]}>
              {vehicle.verified_note}
            </Text>
          ) : null}
          <View style={styles.expandedBody}>
            <BodyBlocks blocks={body} isDarkMode={isDarkMode} />
          </View>
        </>
      ) : null}

      <BouncyPressable
        style={styles.pillBtn}
        activeScale={0.96}
        onPress={() => setExpanded(prev => !prev)}
        testID={`transport-vehicle-toggle-${vehicle.slug}`}>
        <Text style={styles.pillBtnText}>{expanded ? 'Show less' : 'Read full story'}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={ms(14)} color="#FFFFFF" />
      </BouncyPressable>
    </View>
  );
};

export const TransportModeScreen = ({ navigation, route }) => {
  const card = route?.params?.card || {};
  console.log('TransportModeScreen card:', card);
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { data: modeData, isLoading, isError, refetch, isRefetching } = useTransportMode(card.mode);

  const hub = modeData?.hub;
  const guide = modeData?.guide_content;
  const vehicles = useMemo(() => modeData?.vehicles ?? [], [modeData?.vehicles]);
  const costs = guide?.approximate_costs ?? modeData?.approximate_costs ?? [];
  const documents = guide?.documents?.items ?? [];

  const primaryVehicle = useMemo(
    () => vehicles.find(v => v.verification_tier === 'TAILS_VERIFIED') || vehicles[0],
    [vehicles],
  );
  const heroImage = resolveImageUrl(primaryVehicle?.cover_image_url);
  const heroTitle = guide?.hero?.title || hub?.title;
  const quickText = guide?.quick_answer?.text || card.insight || hub?.excerpt;

  const textStrong = isDarkMode && styles.textLight;
  const textMuted = isDarkMode && styles.textMutedDark;

  const openGuide = () => {
    if (guide?.booking_guide?.href) {
      Linking.openURL(`${WEB_BASE_URL}${guide.booking_guide.href}`).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FFFFFF'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title={`${card.label || 'Transport'} travel guide`}
        subtitle="TRANSPORT WITH DOGS"
        onBack={() => navigation.goBack()}
        testID="transport-mode-back-btn"
      />

      {isLoading ? (
        <Loader
          fullScreen
          title={`Loading ${card.label || 'guide'}...`}
          subtitle="Fetching the verified guide..."
        />
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDarkMode ? '#A855F7' : '#7C3AED'}
              colors={['#7C3AED', '#EE2A7B']}
            />
          }>
          {isError || !hub ? (
            <View style={styles.stateBox}>
              <Text style={[styles.sectionTitle, textStrong]}>Could not load this guide</Text>
              <Text style={[styles.bodyText, textMuted]}>Check your connection and try again.</Text>
              <BouncyPressable style={styles.pillBtn} activeScale={0.94} onPress={refetch}>
                <Text style={styles.pillBtnText}>Try again</Text>
              </BouncyPressable>
            </View>
          ) : (
            <>
              {/* Hero */}
              <View style={styles.hero}>
                {heroImage ? (
                  <FastImage
                    source={{ uri: heroImage }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={FastImage.resizeMode.cover}
                    accessibilityLabel={primaryVehicle?.cover_image_alt || heroTitle}
                  />
                ) : null}
                <LinearGradient
                  colors={['rgba(30,10,69,0.1)', 'rgba(30,10,69,0.95)']}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                  style={styles.heroGloss}
                />
                {guide?.hero?.badge ? (
                  <View style={styles.heroBadge}>
                    <Feather name="check" size={ms(11)} color="#1E1035" />
                    <Text style={styles.heroBadgeText}>{guide.hero.badge}</Text>
                  </View>
                ) : null}
                <Text style={styles.heroTitle}>{heroTitle}</Text>
                {guide?.hero?.description ? (
                  <Text style={styles.heroDesc} numberOfLines={7}>
                    {guide.hero.description}
                  </Text>
                ) : null}
                {guide?.hero?.verification_label ? (
                  <View style={styles.heroVerify}>
                    <Feather name="award" size={ms(14)} color="#FDE047" />
                    <View style={styles.heroVerifyText}>
                      <Text style={styles.heroVerifyLabel}>{guide.hero.verification_label}</Text>
                      <Text style={styles.heroVerifyCaption} numberOfLines={2}>
                        {guide.hero.verification_caption}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Quick answer */}
              <LinearGradient
                colors={isDarkMode ? ['#24143F', '#1B0F2E'] : ['#FFFFFF', '#F4EEFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, styles.quickCard, isDarkMode && styles.quickCardDark]}>
                <View style={styles.quickIcon}>
                  <Text style={styles.quickEmoji}>{card.emoji}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.quickOverline}>
                    {(guide?.quick_answer?.heading || 'Quick answer').toUpperCase()}
                  </Text>
                  <Text style={[styles.quickBody, textStrong]}>{quickText}</Text>
                </View>
              </LinearGradient>

              {/* Travel options */}
              {guide?.travel_options?.items?.length ? (
                <>
                  <SectionHeading
                    overline="YOUR TWO OPTIONS"
                    title={guide.travel_options.heading}
                    isDarkMode={isDarkMode}
                  />
                  {guide.travel_options.items.map(option => {
                    const positive = option.tone === 'positive';
                    return (
                      <View
                        key={option.title}
                        style={[
                          styles.card,
                          positive ? styles.optionPositive : styles.optionCaution,
                          isDarkMode &&
                            (positive ? styles.optionPositiveDark : styles.optionCautionDark),
                        ]}>
                        <View style={styles.optionTop}>
                          <Text style={[styles.optionTitle, textStrong]}>{option.title}</Text>
                          {option.badge ? (
                            <View style={styles.optionBadge}>
                              <Text style={styles.optionBadgeText}>{option.badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.bodyText, textMuted]}>{option.description}</Text>
                        {option.items?.map(item => (
                          <View key={item} style={styles.optionRow}>
                            <Feather
                              name={positive ? 'check-circle' : 'alert-circle'}
                              size={ms(14)}
                              color={positive ? '#047857' : '#B45309'}
                            />
                            <Text style={[styles.optionText, textStrong]}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </>
              ) : null}

              {/* Booking steps */}
              {guide?.booking_steps?.steps?.length ? (
                <>
                  <SectionHeading
                    overline="FIRST AC PROCESS"
                    title={guide.booking_steps.heading}
                    isDarkMode={isDarkMode}
                  />
                  {guide.booking_steps.steps.map(step => (
                    <View
                      key={step.step}
                      style={[styles.card, styles.stepCard, isDarkMode && styles.cardDark]}>
                      <LinearGradient colors={['#6D28D9', '#4C1D95']} style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.step}</Text>
                      </LinearGradient>
                      <View style={styles.flex}>
                        <Text style={[styles.stepTitle, textStrong]}>{step.title}</Text>
                        <Text style={[styles.bodyText, textMuted]}>{step.body}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null}

              {/* NTES tip */}
              {guide?.ntes_tip ? (
                <View style={[styles.card, styles.tipCard, isDarkMode && styles.tipCardDark]}>
                  <View style={styles.tipTop}>
                    <View style={styles.tipIcon}>
                      <Text style={styles.tipEmoji}>{guide.ntes_tip.icon}</Text>
                    </View>
                    <Text style={[styles.tipHeading, isDarkMode && styles.tipHeadingDark]}>
                      {guide.ntes_tip.heading}
                    </Text>
                  </View>
                  {guide.ntes_tip.paragraphs?.map(text => (
                    <Text key={text} style={[styles.tipBody, isDarkMode && styles.tipBodyDark]}>
                      {text}
                    </Text>
                  ))}
                </View>
              ) : null}

              {/* Documents */}
              {documents.length > 0 ? (
                <>
                  <SectionHeading
                    overline="WHAT TO BRING"
                    title={guide.documents.heading}
                    isDarkMode={isDarkMode}
                  />
                  <View style={[styles.card, styles.docCard, isDarkMode && styles.cardDark]}>
                    {documents.map((doc, idx) => (
                      <View
                        key={doc.document}
                        style={[
                          styles.docRow,
                          doc.critical &&
                            (isDarkMode ? styles.docRowCriticalDark : styles.docRowCritical),
                          idx < documents.length - 1 &&
                            (isDarkMode ? styles.docDividerDark : styles.docDivider),
                        ]}>
                        {doc.critical ? (
                          <View style={styles.docIconCritical}>
                            <Text style={styles.docIconCriticalText}>!</Text>
                          </View>
                        ) : (
                          <View style={[styles.docIconInfo, isDarkMode && styles.docIconInfoDark]}>
                            <Text style={styles.docIconInfoText}>i</Text>
                          </View>
                        )}
                        <View style={styles.flex}>
                          <View style={styles.docTitleRow}>
                            <Text style={[styles.docTitle, textStrong]}>{doc.document}</Text>
                            {doc.critical ? (
                              <View style={styles.criticalPill}>
                                <Text style={styles.criticalText}>Required</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.docDetail, textMuted]}>{doc.detail}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {/* Allowed / not allowed */}
              {guide?.access ? (
                <>
                  <SectionHeading
                    overline="INDIAN RAILWAYS RULES"
                    title="Allowed and not allowed"
                    isDarkMode={isDarkMode}
                  />
                  <View style={styles.accessRow}>
                    {[
                      { data: guide.access.allowed, ok: true },
                      { data: guide.access.not_allowed, ok: false },
                    ].map(({ data, ok }) =>
                      data ? (
                        <View
                          key={data.heading}
                          style={[
                            styles.card,
                            styles.accessCard,
                            ok ? styles.optionPositive : styles.accessBad,
                            isDarkMode && (ok ? styles.optionPositiveDark : styles.accessBadDark),
                          ]}>
                          <Text
                            style={[styles.accessHeading, { color: ok ? '#047857' : '#B91C1C' }]}>
                            {data.heading}
                          </Text>
                          {data.items?.map(item => (
                            <View key={item} style={styles.accessItem}>
                              <Feather
                                name={ok ? 'check' : 'x'}
                                size={ms(12)}
                                color={ok ? '#047857' : '#B91C1C'}
                                style={styles.accessIcon}
                              />
                              <Text style={[styles.accessText, textStrong]}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null,
                    )}
                  </View>
                </>
              ) : null}

              {/* Costs */}
              {costs.length > 0 ? (
                <>
                  <SectionHeading
                    overline="PUNE TO DELHI EXAMPLE"
                    title={guide?.approximate_costs_heading || 'Approximate costs'}
                    isDarkMode={isDarkMode}
                  />
                  <View style={[styles.card, styles.costCard, isDarkMode && styles.cardDark]}>
                    {costs.map(entry => {
                      const isTotal = /^total/i.test(entry.item);
                      return (
                        <View
                          key={entry.item}
                          style={[styles.costRow, isTotal && styles.costTotal]}>
                          <Text
                            style={[styles.costItem, textStrong, isTotal && styles.costTotalText]}>
                            {entry.item}
                          </Text>
                          <Text style={[styles.costValue, isTotal && styles.costTotalValue]}>
                            {entry.cost}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {/* Specific train pages */}
              {vehicles.length > 0 ? (
                <>
                  <SectionHeading
                    overline="SPECIFIC TRAIN GUIDANCE"
                    title={guide?.vehicle_pages_heading || 'Know before booking'}
                    isDarkMode={isDarkMode}
                  />
                  {vehicles.map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      emoji={card.emoji}
                      verifiedLabel={guide?.vehicle_verified_badge}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </>
              ) : null}

              {/* Booking guide CTA */}
              {guide?.booking_guide ? (
                <LinearGradient
                  colors={['#2E1065', '#5B21B6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.card, styles.ctaCard]}>
                  <View style={styles.ctaCircle} />
                  <Text style={styles.ctaOverline}>BEFORE YOU LEAVE</Text>
                  <Text style={styles.ctaTitle}>{guide.booking_guide.title}</Text>
                  <Text style={styles.ctaDesc}>{guide.booking_guide.description}</Text>
                  <BouncyPressable
                    style={styles.ctaBtn}
                    activeScale={0.95}
                    onPress={openGuide}
                    testID="transport-booking-guide-btn">
                    <Text style={styles.ctaBtnText}>{guide.booking_guide.action_label}</Text>
                    <Feather name="arrow-right" size={ms(14)} color="#2E1065" />
                  </BouncyPressable>
                </LinearGradient>
              ) : null}
            </>
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  scrollContent: { paddingHorizontal: s(15), paddingTop: s(8), paddingBottom: s(40) },
  stateBox: { alignItems: 'center', paddingVertical: s(60) },
  flex: { flex: 1 },

  // Shared 3D slab: bright top lip, tinted sides, thick bottom edge and a deep shadow
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(16),
    marginBottom: s(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.14)',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: 'rgba(124, 58, 237, 0.22)',
    borderRightColor: 'rgba(124, 58, 237, 0.22)',
    borderBottomWidth: 6,
    borderBottomColor: '#B8A4EE',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  cardDark: {
    backgroundColor: '#1B0F2E',
    borderColor: '#2E1A4F',
    borderTopColor: '#3A2468',
    borderBottomColor: '#07020F',
    shadowColor: '#000000',
  },

  sectionHead: { marginTop: s(10), marginBottom: s(10) },
  overline: {
    color: '#7C6F91',
    fontSize: s(9.5),
    letterSpacing: 0.8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionTitle: {
    color: '#2A0E55',
    fontSize: s(19),
    lineHeight: s(24),
    marginTop: s(2),
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Hero
  hero: {
    minHeight: s(250),
    borderRadius: s(26),
    overflow: 'hidden',
    backgroundColor: '#3B1478',
    justifyContent: 'flex-end',
    padding: s(18),
    marginBottom: s(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 5,
    borderBottomColor: '#8B5CF6',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 9,
  },
  heroGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: s(90) },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FDE047',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    marginBottom: s(10),
  },
  heroBadgeText: {
    color: '#1E1035',
    fontSize: s(10.5),
    marginLeft: s(5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: s(23),
    lineHeight: s(28),
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: s(11.5),
    lineHeight: s(17),
    marginTop: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },
  heroVerify: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: s(14),
    padding: s(10),
    marginTop: s(12),
  },
  heroVerifyText: { flex: 1, marginLeft: s(10) },
  heroVerifyLabel: {
    color: '#FFFFFF',
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroVerifyCaption: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: s(10),
    marginTop: s(1),
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Quick answer
  quickCard: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderTopColor: '#C4B5FD',
    borderBottomWidth: 7,
    borderBottomColor: '#5B21B6',
    shadowColor: '#5B21B6',
    shadowOpacity: 0.35,
  },
  quickCardDark: { borderColor: '#8B5CF6', borderBottomColor: '#3B1478' },
  quickIcon: {
    width: s(50),
    height: s(50),
    borderRadius: s(15),
    backgroundColor: '#5B21B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    borderBottomWidth: 3,
    borderBottomColor: '#2E1065',
  },
  quickEmoji: { fontSize: ms(25) },
  quickOverline: {
    color: '#7C3AED',
    fontSize: s(9.5),
    letterSpacing: 0.9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  quickBody: {
    color: '#2A0E55',
    fontSize: s(12.5),
    lineHeight: s(19),
    marginTop: s(4),
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Options
  optionPositive: {
    backgroundColor: '#ECFBF4',
    borderColor: '#A7E8D0',
    borderBottomColor: '#7CD4B4',
  },
  optionPositiveDark: {
    backgroundColor: '#0F2A22',
    borderColor: '#14513E',
    borderBottomColor: '#06150F',
  },
  optionCaution: {
    backgroundColor: '#FFF9EA',
    borderColor: '#FDE2A0',
    borderBottomColor: '#EBC56A',
  },
  optionCautionDark: {
    backgroundColor: '#2A220F',
    borderColor: '#4A3A14',
    borderBottomColor: '#14100A',
  },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionTitle: {
    flex: 1,
    color: '#1E1035',
    fontSize: s(16),
    marginRight: s(8),
    fontFamily: theme.typography.fontFamily.bold,
  },
  optionBadge: {
    backgroundColor: '#047857',
    borderRadius: s(10),
    paddingHorizontal: s(9),
    paddingVertical: s(4),
  },
  optionBadgeText: {
    color: '#FFFFFF',
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  optionRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: s(8) },
  optionText: {
    flex: 1,
    color: '#2A0E55',
    fontSize: s(12),
    lineHeight: s(17),
    marginLeft: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Steps
  stepCard: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNumber: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    borderBottomWidth: 3,
    borderBottomColor: '#2E1065',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
  stepTitle: {
    color: '#2A0E55',
    fontSize: s(13.5),
    lineHeight: s(18),
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Tip
  tipCard: { backgroundColor: '#FEF3C7', borderColor: '#FDE9A9', borderBottomColor: '#EBC56A' },
  tipCardDark: { backgroundColor: '#2A220F', borderColor: '#4A3A14', borderBottomColor: '#14100A' },
  tipTop: { flexDirection: 'row', alignItems: 'center', marginBottom: s(6) },
  tipIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(13),
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    borderBottomWidth: 3,
    borderBottomColor: '#E0B93A',
  },
  tipEmoji: { fontSize: ms(20) },
  tipHeading: {
    flex: 1,
    color: '#78350F',
    fontSize: s(13.5),
    lineHeight: s(18),
    fontFamily: theme.typography.fontFamily.bold,
  },
  tipHeadingDark: { color: '#FDE68A' },
  tipBody: {
    color: '#92400E',
    fontSize: s(12),
    lineHeight: s(18),
    marginTop: s(6),
    fontFamily: theme.typography.fontFamily.regular,
  },
  tipBodyDark: { color: '#E8D5A0' },

  // Documents
  docCard: { padding: 0 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: s(12),
    paddingHorizontal: s(14),
  },
  docRowCritical: { backgroundColor: '#FFF8F2' },
  docRowCriticalDark: { backgroundColor: '#2A1A14' },
  docDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(124, 58, 237, 0.1)' },
  docDividerDark: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  docIconCritical: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    marginTop: s(1),
  },
  docIconCriticalText: {
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
  docIconInfo: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#E9E4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    marginTop: s(1),
  },
  docIconInfoDark: { backgroundColor: '#2E1A4F' },
  docIconInfoText: {
    color: '#7C6F91',
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
  },
  docTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  docTitle: {
    color: '#1E1035',
    fontSize: s(13.5),
    marginRight: s(8),
    fontFamily: theme.typography.fontFamily.bold,
  },
  docDetail: {
    color: '#8A7FA3',
    fontSize: s(11.5),
    lineHeight: s(16),
    marginTop: s(3),
    fontFamily: theme.typography.fontFamily.regular,
  },
  criticalPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: s(8),
    paddingHorizontal: s(8),
    paddingVertical: s(2),
  },
  criticalText: { color: '#EF4444', fontSize: s(10), fontFamily: theme.typography.fontFamily.bold },

  // Access
  accessRow: { flexDirection: 'row', marginHorizontal: -s(4) },
  accessCard: { flex: 1, marginHorizontal: s(4), padding: s(12) },
  accessBad: { backgroundColor: '#FFF1F1', borderColor: '#F7C6C6', borderBottomColor: '#EBA0A0' },
  accessBadDark: {
    backgroundColor: '#2A1212',
    borderColor: '#4A1C1C',
    borderBottomColor: '#150808',
  },
  accessHeading: {
    fontSize: s(13),
    marginBottom: s(4),
    fontFamily: theme.typography.fontFamily.bold,
  },
  accessItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: s(6) },
  accessIcon: { marginTop: s(2) },
  accessText: {
    flex: 1,
    color: '#2A0E55',
    fontSize: s(10.5),
    lineHeight: s(15),
    marginLeft: s(6),
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Costs
  costCard: { padding: 0 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: s(10),
    paddingHorizontal: s(14),
  },
  costItem: {
    flex: 1,
    color: '#2A0E55',
    fontSize: s(12),
    lineHeight: s(17),
    marginRight: s(12),
    fontFamily: theme.typography.fontFamily.regular,
  },
  costValue: {
    color: '#047857',
    fontSize: s(12),
    textAlign: 'right',
    fontFamily: theme.typography.fontFamily.bold,
  },
  costTotal: { backgroundColor: '#4C1D95' },
  costTotalText: { color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  costTotalValue: { color: '#FFFFFF', fontSize: s(14) },

  // Vehicles
  vehicleTop: { flexDirection: 'row', alignItems: 'center', marginBottom: s(10) },
  vehicleIconBox: {
    width: s(42),
    height: s(42),
    borderRadius: s(13),
    backgroundColor: '#F1EBFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
    borderBottomWidth: 3,
    borderBottomColor: '#DDD0F7',
  },
  iconBoxDark: { backgroundColor: '#2A1848', borderBottomColor: '#160A2A' },
  vehicleEmoji: { fontSize: ms(21) },
  vehicleHead: { flex: 1 },
  vehicleOverline: {
    color: '#7C6F91',
    fontSize: s(9),
    letterSpacing: 0.6,
    fontFamily: theme.typography.fontFamily.bold,
  },
  vehicleTitle: {
    color: '#2A0E55',
    fontSize: s(14),
    lineHeight: s(19),
    marginTop: s(1),
    fontFamily: theme.typography.fontFamily.bold,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: s(10),
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    marginBottom: s(10),
  },
  tierVerified: { backgroundColor: '#E8F8F3' },
  tierResearch: { backgroundColor: '#FFF8E8' },
  tierText: { fontSize: s(9.5), marginLeft: s(5), fontFamily: theme.typography.fontFamily.bold },
  cover: {
    width: '100%',
    height: s(150),
    borderRadius: s(14),
    marginBottom: s(10),
    backgroundColor: '#F1EBFC',
  },
  noteBox: {
    backgroundColor: '#FEF9E7',
    borderRadius: s(12),
    padding: s(10),
    marginTop: s(10),
    borderWidth: 1,
    borderColor: '#FDE9A9',
  },
  noteBoxDark: { backgroundColor: '#2A220F', borderColor: '#4A3A14' },
  noteText: {
    color: '#92400E',
    fontSize: s(12),
    lineHeight: s(18),
    fontFamily: theme.typography.fontFamily.regular,
  },
  noteTextDark: { color: '#E8D5A0' },
  infoRow: { marginTop: s(12) },
  infoLabel: {
    color: '#7C6F91',
    fontSize: s(9.5),
    letterSpacing: 0.7,
    fontFamily: theme.typography.fontFamily.bold,
  },
  infoValue: {
    color: '#2A0E55',
    fontSize: s(12.5),
    lineHeight: s(18),
    marginTop: s(3),
    fontFamily: theme.typography.fontFamily.regular,
  },
  verifiedNote: {
    color: '#7C6F91',
    fontSize: s(11),
    lineHeight: s(16),
    marginTop: s(12),
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily.regular,
  },
  expandedBody: {
    marginTop: s(10),
    paddingTop: s(6),
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.14)',
  },

  // Shared body text / bullets
  bodyHeading: {
    color: '#2A0E55',
    fontSize: s(15),
    marginTop: s(12),
    marginBottom: s(2),
    fontFamily: theme.typography.fontFamily.bold,
  },
  bodyText: {
    color: '#5E4F78',
    fontSize: s(12),
    lineHeight: s(19),
    marginTop: s(5),
    fontFamily: theme.typography.fontFamily.regular,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: s(4) },
  bulletDot: {
    width: s(5),
    height: s(5),
    borderRadius: s(3),
    backgroundColor: '#7C3AED',
    marginTop: s(10),
    marginRight: s(8),
  },
  bulletText: { flex: 1, marginTop: s(2) },

  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: s(14),
    backgroundColor: '#7C3AED',
    borderRadius: s(14),
    paddingHorizontal: s(16),
    paddingVertical: s(9),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  pillBtnText: {
    color: '#FFFFFF',
    fontSize: s(12),
    marginRight: s(6),
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Booking guide CTA
  ctaCard: {
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: '#1E0A45',
    shadowColor: '#2E1065',
    marginTop: s(6),
  },
  ctaCircle: {
    position: 'absolute',
    right: -s(30),
    top: -s(30),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaOverline: {
    color: '#FDE047',
    fontSize: s(9.5),
    letterSpacing: 0.9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: s(17),
    lineHeight: s(22),
    marginTop: s(4),
    fontFamily: theme.typography.fontFamily.bold,
  },
  ctaDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: s(11.5),
    lineHeight: s(17),
    marginTop: s(6),
    fontFamily: theme.typography.fontFamily.regular,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingHorizontal: s(16),
    paddingVertical: s(9),
    marginTop: s(14),
    borderBottomWidth: 3,
    borderBottomColor: '#DDD6FE',
  },
  ctaBtnText: {
    color: '#2E1065',
    fontSize: s(12),
    marginRight: s(6),
    fontFamily: theme.typography.fontFamily.bold,
  },

  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#B9A9D6' },
});
