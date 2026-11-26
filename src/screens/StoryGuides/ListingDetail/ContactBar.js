import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms, vs } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { styles } from './styles';

export const BAR_HEIGHT = vs(46) + vs(20);

const digits = value => String(value || '').replace(/[^\d]/g, '');

/** Builds the available actions from the listing's contact details. */
export const contactActions = contact => {
  const actions = [];
  if (contact.phone) {
    actions.push({
      key: 'call',
      label: 'Call',
      icon: 'call',
      url: `tel:${contact.phone.replace(/\s/g, '')}`,
    });
  }
  const wa = digits(contact.whatsapp);
  if (wa) {
    actions.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'logo-whatsapp',
      url: `https://wa.me/${wa}`,
    });
  }
  if (contact.website) {
    actions.push({ key: 'website', label: 'Website', icon: 'globe-outline', url: contact.website });
  }
  if (contact.mapsUrl) {
    actions.push({
      key: 'directions',
      label: 'Directions',
      icon: 'navigate-outline',
      url: contact.mapsUrl,
    });
  }
  return actions;
};

/** Sticky bottom bar: the first action is the big button, the rest are icon buttons. */
export const ContactBar = ({ contact, bottomInset, palette }) => {
  const actions = contactActions(contact);
  if (!actions.length) {
    return null;
  }
  const [primary, ...rest] = actions;
  const open = url => Linking.openURL(url).catch(() => {});

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.bar,
          borderTopColor: palette.border,
          paddingBottom: bottomInset + vs(10),
        },
      ]}>
      <BouncyPressable
        testID={`listing-action-${primary.key}`}
        style={styles.primaryBtn}
        activeScale={0.96}
        onPress={() => open(primary.url)}>
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <Ionicons name={primary.icon} size={ms(17)} color="#FFFFFF" />
        <Text style={styles.primaryBtnText}>{primary.label}</Text>
      </BouncyPressable>

      {rest.map(action => (
        <BouncyPressable
          key={action.key}
          testID={`listing-action-${action.key}`}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={[styles.iconBtn, { backgroundColor: palette.soft, borderColor: palette.border }]}
          activeScale={0.9}
          onPress={() => open(action.url)}>
          <Ionicons name={action.icon} size={ms(19)} color={palette.accent} />
        </BouncyPressable>
      ))}
    </View>
  );
};
