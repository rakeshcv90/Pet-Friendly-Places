import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { dayKey, monthDays, parseDateText } from '../urbaniaBooking';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_LABEL = { available: 'Open', partial: 'Partial', unavailable: 'Full' };
const LEGEND = [
  { id: 'available', label: 'Available', color: '#10B981' },
  { id: 'partial', label: 'Partially available', color: '#F59E0B' },
  { id: 'unavailable', label: 'Unavailable', color: '#EF4444' },
];
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = MONTH_NAMES.map(name => name.slice(0, 3));

// "Thu, 15 Jan" for the summary under the grid
const shortDay = date =>
  `${WEEKDAY_FULL[date.getDay()]}, ${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`;

// The month calendar from the website: every day shows whether the van is free, the pickup day and the
// return day are picked by tapping, and the days between them are tinted.
//  - month: a Date in the month shown; availability: { "2027-01-15": "available" | ... }
//  - start / end: the picked days as "DD/MM/YYYY" ('' when not picked)
export const UrbaniaCalendar = ({
  month,
  onMonthChange,
  availability = {},
  start,
  end,
  onPick,
  isDarkMode,
  today = new Date(),
}) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const startDate = parseDateText(start);
  const endDate = parseDateText(end);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisMonth = year === today.getFullYear() && monthIndex === today.getMonth();
  const cells = monthDays(year, monthIndex);
  const hasRange = !!startDate && !!endDate && endDate > startDate;

  // A change of month slides the days in from the side it came from
  const slide = useRef(new Animated.Value(1)).current;
  const lastMonth = useRef(year * 12 + monthIndex);
  const direction = useRef(1);
  useEffect(() => {
    const now = year * 12 + monthIndex;
    if (now === lastMonth.current) {
      return;
    }
    direction.current = now > lastMonth.current ? 1 : -1;
    lastMonth.current = now;
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [year, monthIndex, slide]);
  const gridMotion = {
    opacity: slide.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      {
        translateX: slide.interpolate({
          inputRange: [0, 1],
          outputRange: [direction.current * s(22), 0],
        }),
      },
    ],
  };

  return (
    <View testID="urbania-calendar" style={[styles.card, isDarkMode && styles.cardDark]}>
      <LinearGradient
        colors={isDarkMode ? ['#3B1B6E', '#4C1D95'] : ['#4C1D95', '#7B2CFF', '#C026D3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View pointerEvents="none" style={styles.decorBig} />
        <View pointerEvents="none" style={styles.decorSmall} />
        <BouncyPressable
          testID="urbania-cal-prev"
          accessibilityLabel="Previous month"
          disabled={thisMonth}
          activeScale={0.88}
          onPress={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          style={[styles.nav, thisMonth && styles.navOff]}>
          <Feather name="chevron-left" size={ms(20)} color="#FFFFFF" />
        </BouncyPressable>
        <View style={styles.titleBox}>
          <Text
            testID="urbania-cal-title"
            style={styles.title}>{`${MONTH_NAMES[monthIndex]} ${year}`}</Text>
          <Text style={styles.hint} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Tap your pickup day, then your drop day
          </Text>
        </View>
        <BouncyPressable
          testID="urbania-cal-next"
          accessibilityLabel="Next month"
          activeScale={0.88}
          onPress={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          style={styles.nav}>
          <Feather name="chevron-right" size={ms(20)} color="#FFFFFF" />
        </BouncyPressable>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map(day => (
            <Text key={day} style={[styles.weekday, isDarkMode && styles.mutedDark]}>
              {day.toUpperCase()}
            </Text>
          ))}
        </View>

        <Animated.View testID="urbania-cal-grid" style={[styles.grid, gridMotion]}>
          {cells.map((date, index) => {
            if (!date) {
              return <View key={`blank-${index}`} style={styles.cell} />;
            }
            const key = dayKey(date);
            const status = availability[key] || 'available';
            const past = date < todayStart;
            const blocked = past || status === 'unavailable';
            const isStart = !!startDate && date.getTime() === startDate.getTime();
            const isEnd = !!endDate && date.getTime() === endDate.getTime();
            const isEdge = isStart || isEnd;
            const inRange = hasRange && date > startDate && date < endDate;
            const column = index % 7;
            const isToday = date.getTime() === todayStart.getTime();
            const label = isStart && isEnd ? 'Trip' : isStart ? 'Pickup' : isEnd ? 'Drop' : '';
            const band = isDarkMode ? styles.bandDark : styles.band;
            return (
              <View key={key} style={styles.cell}>
                {inRange ? (
                  <View
                    testID={`urbania-day-${key}-range`}
                    style={[
                      styles.bandFull,
                      band,
                      column === 0 && styles.bandRoundLeft,
                      column === 6 && styles.bandRoundRight,
                    ]}
                  />
                ) : null}
                {hasRange && isStart ? <View style={[styles.bandHalfRight, band]} /> : null}
                {hasRange && isEnd ? <View style={[styles.bandHalfLeft, band]} /> : null}

                <BouncyPressable
                  testID={`urbania-day-${key}`}
                  accessibilityLabel={`${date.getDate()} ${MONTH_NAMES[monthIndex]}, ${
                    past ? 'past' : STATUS_LABEL[status]
                  }`}
                  accessibilityState={{ disabled: blocked, selected: isEdge }}
                  disabled={blocked}
                  activeScale={0.9}
                  onPress={() => onPick(date)}
                  style={styles.press}>
                  <View
                    testID={`urbania-day-${key}-circle`}
                    style={[
                      styles.circle,
                      isToday && !isEdge && (isDarkMode ? styles.todayDark : styles.today),
                      isEdge && styles.edgeShadow,
                    ]}>
                    {isEdge ? (
                      <LinearGradient
                        pointerEvents="none"
                        testID={`urbania-day-${key}-selected`}
                        colors={['#4C1D95', '#7B2CFF', '#C026D3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.edgeFill}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.dayNumber,
                        isDarkMode && styles.numberDark,
                        past && (isDarkMode ? styles.pastDark : styles.past),
                        !past && status === 'unavailable' && styles.fullText,
                        isEdge && styles.onEdge,
                      ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  <View style={styles.slot}>
                    {isEdge ? (
                      <Text style={styles.edgeLabel}>{label}</Text>
                    ) : past ? null : (
                      <View style={[styles.dot, styles[`${status}Dot`]]} />
                    )}
                  </View>
                </BouncyPressable>
              </View>
            );
          })}
        </Animated.View>

        <View style={styles.legend}>
          {LEGEND.map(item => (
            <View key={item.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, isDarkMode && styles.mutedDark]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View testID="urbania-cal-summary" style={styles.summary}>
          <View style={[styles.chip, isDarkMode && styles.chipDark]}>
            <Text style={[styles.chipLabel, isDarkMode && styles.mutedDark]}>PICKUP</Text>
            <Text
              testID="urbania-cal-pickup"
              style={[
                styles.chipValue,
                isDarkMode && styles.numberDark,
                !startDate && styles.chipEmpty,
              ]}>
              {startDate ? shortDay(startDate) : 'Pick a day'}
            </Text>
          </View>
          <Feather name="arrow-right" size={ms(16)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
          <View style={[styles.chip, isDarkMode && styles.chipDark]}>
            <Text style={[styles.chipLabel, isDarkMode && styles.mutedDark]}>DROP</Text>
            <Text
              testID="urbania-cal-return"
              style={[
                styles.chipValue,
                isDarkMode && styles.numberDark,
                !endDate && styles.chipEmpty,
              ]}>
              {endDate ? shortDay(endDate) : 'Pick a day'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const CELL = `${100 / 7}%`;
const CIRCLE = s(34);
const ROW = s(50);

const styles = StyleSheet.create({
  card: {
    borderRadius: s(22),
    borderWidth: 1,
    borderBottomWidth: s(4),
    borderColor: '#E9DFFB',
    borderBottomColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
    marginBottom: vs(14),
    overflow: 'hidden',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#3D1C73', borderBottomColor: '#4C1D95' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: s(16),
    overflow: 'hidden',
  },
  titleBox: { flex: 1, alignItems: 'center', paddingHorizontal: s(8) },
  nav: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navOff: { opacity: 0.35 },
  title: { fontSize: s(19), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.extraBold },
  hint: {
    fontSize: s(10),
    marginTop: s(2),
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  mutedDark: { color: '#A99BC4' },
  body: { paddingHorizontal: s(8), paddingTop: vs(12), paddingBottom: vs(12) },
  weekRow: { flexDirection: 'row', marginBottom: vs(6) },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontSize: s(9.5),
    letterSpacing: 0.8,
    color: '#8A7AA8',
    fontFamily: theme.typography.fontFamily.bold,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, height: ROW, justifyContent: 'flex-start', paddingTop: s(2) },
  press: { alignItems: 'center' },
  slot: { height: s(11), alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: '#F7F1FF' },
  todayDark: { borderWidth: 1.5, borderColor: '#A78BFA', backgroundColor: '#2E1654' },
  edgeShadow: {
    backgroundColor: '#7B2CFF',
    shadowColor: '#7B2CFF',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  edgeFill: { ...StyleSheet.absoluteFillObject, borderRadius: CIRCLE / 2 },
  dayNumber: { fontSize: s(14), color: '#2A1B4D', fontFamily: theme.typography.fontFamily.bold },
  numberDark: { color: '#FFFFFF' },
  past: { color: '#D2C9E3' },
  pastDark: { color: '#5A4A7A' },
  fullText: { color: '#B8ADC9', textDecorationLine: 'line-through' },
  onEdge: {
    color: '#FFFFFF',
    textDecorationLine: 'none',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  dot: { width: s(5), height: s(5), borderRadius: s(3) },
  availableDot: { backgroundColor: '#10B981' },
  partialDot: { backgroundColor: '#F59E0B' },
  unavailableDot: { backgroundColor: '#EF4444' },
  edgeLabel: {
    fontSize: s(7.5),
    letterSpacing: 0.3,
    color: '#6D28D9',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  band: { backgroundColor: '#EFE6FF' },
  bandDark: { backgroundColor: '#35195F' },
  bandFull: { position: 'absolute', left: 0, right: 0, top: s(2), height: CIRCLE },
  bandRoundLeft: { borderTopLeftRadius: CIRCLE / 2, borderBottomLeftRadius: CIRCLE / 2 },
  bandRoundRight: { borderTopRightRadius: CIRCLE / 2, borderBottomRightRadius: CIRCLE / 2 },
  bandHalfRight: { position: 'absolute', left: '50%', right: 0, top: s(2), height: CIRCLE },
  bandHalfLeft: { position: 'absolute', left: 0, right: '50%', top: s(2), height: CIRCLE },
  decorBig: {
    position: 'absolute',
    right: -s(30),
    top: -s(50),
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorSmall: {
    position: 'absolute',
    left: s(70),
    bottom: -s(44),
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(14),
    marginTop: vs(8),
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  legendDot: { width: s(7), height: s(7), borderRadius: s(4) },
  legendText: { fontSize: s(10), color: '#6B5B8A', fontFamily: theme.typography.fontFamily.medium },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
    marginTop: vs(12),
    paddingHorizontal: s(4),
  },
  chip: {
    flex: 1,
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    borderRadius: s(14),
    backgroundColor: '#F7F3FF',
    borderBottomWidth: s(2),
    borderBottomColor: '#DDD6FE',
  },
  chipDark: { backgroundColor: '#27104B', borderBottomColor: '#4C1D95' },
  chipLabel: {
    fontSize: s(8.5),
    letterSpacing: 0.8,
    color: '#8A7AA8',
    fontFamily: theme.typography.fontFamily.bold,
  },
  chipValue: {
    fontSize: s(13),
    marginTop: vs(1),
    color: '#3B108F',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  chipEmpty: { opacity: 0.5 },
});
