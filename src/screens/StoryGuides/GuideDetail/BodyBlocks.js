import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CALLOUT_COLORS, CALLOUT_BODY, CALLOUT_BODY_DARK } from './constants';
import { InlineText } from './InlineText';
import { styles } from './styles/body';

export const StatRow = ({ stats, isDarkMode }) => (
  <View style={[styles.statRow, isDarkMode && styles.statRowDark]}>
    {stats.map((stat, i) => (
      <View key={i} style={[styles.statItem, isDarkMode && styles.statItemDark]}>
        <Text style={styles.statIcon}>{stat.icon}</Text>
        <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>{stat.value}</Text>
        <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>{stat.label}</Text>
      </View>
    ))}
  </View>
);


export const SectionHeading = ({ level, text, isDarkMode }) => (
  <Text
    style={[
      level === 2 ? styles.h2 : styles.h3,
      isDarkMode && (level === 2 ? styles.h2Dark : styles.h3Dark),
    ]}>
    {text}
  </Text>
);


export const Paragraph = ({ text, runs, isIntro, isDarkMode, onLinkPress }) => (
  <InlineText
    text={text}
    runs={runs}
    isDarkMode={isDarkMode}
    onLinkPress={onLinkPress}
    style={[
      styles.paragraph,
      isDarkMode && styles.paragraphDark,
      isIntro && styles.paragraphIntro,
      isIntro && isDarkMode && styles.paragraphIntroDark,
    ]}
  />
);


export const StrongLine = ({ text, isDarkMode }) => {
  // These are typically "✓ Team Verified · Tags" lines
  return (
    <View style={[styles.strongLine, isDarkMode && styles.strongLineDark]}>
      <Text style={[styles.strongLineText, isDarkMode && styles.strongLineTextDark]}>{text}</Text>
    </View>
  );
};


export const Callout = ({ color, title, body, runs, isDarkMode, onLinkPress }) => {
  const palette = CALLOUT_COLORS[color] || CALLOUT_COLORS.default;
  return (
    <View
      style={[
        styles.calloutBox,
        isDarkMode && styles.calloutBoxDark,
        {
          backgroundColor: isDarkMode ? palette.bgDark : palette.bg,
          borderLeftColor: palette.bar,
        },
      ]}>
      {title ? (
        <Text
          style={[styles.calloutTitle, { color: isDarkMode ? palette.titleDark : palette.title }]}>
          {title}
        </Text>
      ) : null}
      <InlineText
        text={body}
        runs={runs}
        isDarkMode={isDarkMode}
        onLinkPress={onLinkPress}
        style={[styles.calloutBody, { color: isDarkMode ? CALLOUT_BODY_DARK : CALLOUT_BODY }]}
      />
    </View>
  );
};


export const BulletList = ({ node, isDarkMode, onLinkPress }) => (
  <View style={styles.bulletList}>
    {node.items.map((item, i) => (
      <View key={i} style={styles.bulletItem}>
        {node.ordered ? (
          <Text style={[styles.bulletText, styles.bulletNumber, isDarkMode && styles.bulletTextDark]}>
            {i + 1}.
          </Text>
        ) : (
          <View style={[styles.bulletDot, isDarkMode && styles.bulletDotDark]} />
        )}
        <InlineText
          text={item}
          runs={node.itemRuns && node.itemRuns[i]}
          isDarkMode={isDarkMode}
          onLinkPress={onLinkPress}
          style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}
        />
      </View>
    ))}
  </View>
);


export const TipStrip = ({ node, isDarkMode, onLinkPress }) => (
  <View style={[styles.tipStrip, isDarkMode && styles.tipStripDark]}>
    <Text style={styles.tipStripIcon}>{node.icon || '🐾'}</Text>
    <InlineText
      text={node.text}
      runs={node.runs}
      isDarkMode={isDarkMode}
      onLinkPress={onLinkPress}
      style={[styles.tipStripText, isDarkMode && styles.tipStripTextDark]}
    />
  </View>
);


export const CityGrid = ({ cards, isDarkMode, onLinkPress }) => (
  <View style={styles.cityGrid}>
    {cards.map((card, i) => (
      <TouchableOpacity
        key={`${card.href}-${i}`}
        activeOpacity={0.8}
        onPress={() => onLinkPress && onLinkPress(card.href)}
        style={[
          styles.cityCard,
          isDarkMode && styles.cityCardDark,
          card.honest && styles.cityCardHonest,
          card.honest && isDarkMode && styles.cityCardHonestDark,
        ]}>
        <Text
          style={[
            styles.cityName,
            isDarkMode && styles.cityNameDark,
            card.honest && styles.cityNameHonest,
            card.honest && isDarkMode && styles.cityNameHonestDark,
          ]}>
          {card.name}
        </Text>
        {card.note ? (
          <Text style={[styles.cityNote, isDarkMode && styles.cityNoteDark]}>{card.note}</Text>
        ) : null}
      </TouchableOpacity>
    ))}
  </View>
);


export const SectionDivider = ({ isDarkMode }) => (
  <View style={styles.dividerRow}>
    <View style={[styles.dividerLine, isDarkMode && styles.dividerLineDark]} />
    <Text style={styles.dividerPaw}>🐾</Text>
    <View style={[styles.dividerLine, isDarkMode && styles.dividerLineDark]} />
  </View>
);
