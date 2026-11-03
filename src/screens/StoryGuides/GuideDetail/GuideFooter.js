import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { TRUST_BOX } from './constants';
import { styles } from './styles/footer';
import { styles as shared } from './styles/shared';

/** Tags, author box and the share / done row. */
export const GuideFooter = ({ guide, isDarkMode, onShare, onBack, onOpenGuideHub }) => (
  <>
    {guide.tags.length > 0 ? (
      <View style={styles.tagsSection}>
        <Text style={[styles.tagsLabel, isDarkMode && styles.tagsLabelDark]}>TAGS</Text>
        <View style={styles.tagsWrap}>
          {guide.tags.map((tag, i) => (
            <View key={i} style={[styles.tagPill, isDarkMode && styles.tagPillDark]}>
              <Text style={[styles.tagPillText, isDarkMode && styles.tagPillTextDark]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}

    {/* Author box, same copy as the website */}
    <View
      style={[
        styles.trustBox,
        shared.card3D,
        isDarkMode && styles.trustBoxDark,
        isDarkMode && shared.card3DDark,
      ]}>
      <LinearGradient
        colors={['#3B108F', '#7B2CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.trustAvatar}>
        <Ionicons name="paw" size={ms(18)} color="#1E0A4D" />
      </LinearGradient>
      <View style={styles.trustContent}>
        <Text style={[styles.trustName, isDarkMode && styles.trustNameDark]}>{TRUST_BOX.name}</Text>
        <Text style={[styles.trustDesc, isDarkMode && styles.trustDescDark]}>{TRUST_BOX.desc}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenGuideHub('stories')}>
          <Text style={[styles.trustLink, isDarkMode && styles.trustLinkDark]}>
            {TRUST_BOX.linkLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.shareRow}>
      <BouncyPressable
        testID="guide-share-bottom-button"
        style={[styles.shareBtn, shared.btn3D, isDarkMode && styles.shareBtnDark]}
        activeScale={0.94}
        onPress={onShare}>
        <Ionicons name="share-social" size={ms(15)} color={isDarkMode ? '#C4ADFF' : '#3B108F'} />
        <Text style={[styles.shareBtnText, isDarkMode && styles.shareBtnTextDark]}>
          Share this Guide
        </Text>
      </BouncyPressable>

      <BouncyPressable
        testID="guide-done-reading-button"
        style={[styles.doneBtn, shared.btn3D]}
        activeScale={0.94}
        onPress={onBack}>
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <Text style={styles.doneBtnText}>Done</Text>
        <Ionicons name="arrow-back" size={ms(14)} color="#FFFFFF" />
      </BouncyPressable>
    </View>
  </>
);
