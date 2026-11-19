import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { styles } from './styles/hero';
import { formatCount } from './format';
import { styles as shared } from './styles/shared';

/** Title card lifted over the hero: bevel, accent strip, sheen and tilt. */
export const ArticleHeaderCard = ({ guide, isDarkMode, motion }) => {
  const { entrance, cardEntranceY, cardEntranceRotate, cardTiltX, sheenX } = motion;
  const metaIconColor = isDarkMode ? '#94A3B8' : '#64748B';
  // read time · date · views, kept on one line inside a single pill
  const metaItems = [
    guide.readTime && { icon: 'time-outline', text: guide.readTime },
    guide.publishedDate && { icon: 'calendar-outline', text: guide.publishedDate },
    guide.viewCount && { icon: 'eye-outline', text: `${formatCount(guide.viewCount)} views` },
  ].filter(Boolean);

  return (
    <Animated.View
      style={[
        styles.articleHeader,
        shared.card3D,
        isDarkMode && styles.articleHeaderDark,
        isDarkMode && shared.card3DDark,
        {
          shadowColor: guide.accent.main,
          opacity: entrance,
          transform: [
            { perspective: 1000 },
            { translateY: cardEntranceY },
            { rotateX: cardEntranceRotate },
            { rotateX: cardTiltX },
          ],
        },
      ]}>
      <View style={styles.articleHeaderClip} pointerEvents="none">
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentStrip}
        />
        <Animated.View
          style={[styles.articleSheen, { transform: [{ translateX: sheenX }, { rotate: '25deg' }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      <Text style={[styles.articleTitle, isDarkMode && styles.articleTitleDark]}>{guide.title}</Text>

      {/* Author · readTime · views row */}
      <View style={styles.metaRow}>
        <Ionicons name="shield-checkmark" size={ms(13)} color="#059669" />
        <Text style={[styles.metaAuthor, isDarkMode && styles.metaAuthorDark]} numberOfLines={1}>
          {guide.author}
        </Text>
      </View>

      {metaItems.length > 0 ? (
        <View style={[styles.metaBar, isDarkMode && styles.metaBarDark]}>
          {metaItems.map((item, i) => (
            <React.Fragment key={item.icon}>
              {i > 0 ? <View style={[styles.metaDivider, isDarkMode && styles.metaDividerDark]} /> : null}
              <View style={styles.metaSegment}>
                <Ionicons name={item.icon} size={ms(11)} color={metaIconColor} />
                <Text
                  numberOfLines={1}
                  style={[styles.metaPillText, isDarkMode && styles.metaPillTextDark]}>
                  {item.text}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {guide.excerpt ? (
        <Text style={[styles.articleExcerpt, isDarkMode && styles.articleExcerptDark]}>
          {guide.excerpt}
        </Text>
      ) : null}
    </Animated.View>
  );
};
