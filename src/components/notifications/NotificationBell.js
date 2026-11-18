import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import { navigate } from '../../navigation/navigationRef';
import {
  useUnreadCount,
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { headerStyles } from './bellStyles';

const { fontFamily } = theme.typography;
const POPUP_LIMIT = 6;


export const NotificationBell = ({ isDarkMode, onPress }) => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useUnreadCount();
  const {
    data: unread = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications({ unreadOnly: true, enabled: open });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const close = () => setOpen(false);
  const handleBellPress = () => (onPress ? onPress() : setOpen(true));
  const handleViewAll = () => {
    close();
    navigate('Notifications');
  };

  const shown = unread.slice(0, POPUP_LIMIT);
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <>
      <BouncyPressable
        testID="notification-bell"
        style={[headerStyles.btn, isDarkMode && headerStyles.btnDark]}
        activeScale={0.85}
        onPress={handleBellPress}>
        <Feather name="bell" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
        {unreadCount > 0 ? (
          <View style={headerStyles.badge} testID="notification-badge">
            <Text style={headerStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </BouncyPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} testID="notification-backdrop">
          <Pressable
            style={[
              styles.popup,
              isDarkMode && styles.popupDark,
              { top: Math.max(insets.top, s(12)) + vs(64) },
            ]}
            onPress={() => {}}>
            <View style={styles.head}>
              <Text style={[styles.headTitle, isDarkMode && styles.textLight]}>Notifications</Text>
              {unreadCount > 0 ? (
                <BouncyPressable
                  testID="notification-mark-all"
                  activeScale={0.92}
                  onPress={() => markAllRead.mutate()}>
                  <Text style={styles.markAll}>Mark all read</Text>
                </BouncyPressable>
              ) : null}
            </View>

            {isLoading ? (
              <View style={styles.state}>
                <ActivityIndicator color="#7C3AED" />
              </View>
            ) : isError ? (
              <View style={styles.state}>
                <Text style={[styles.stateText, isDarkMode && styles.textMuted]}>
                  Could not load notifications.
                </Text>
                <BouncyPressable activeScale={0.94} onPress={refetch}>
                  <Text style={styles.markAll}>Try again</Text>
                </BouncyPressable>
              </View>
            ) : shown.length === 0 ? (
              <View style={styles.state}>
                <Feather name="check-circle" size={ms(28)} color="#34D399" />
                <Text style={[styles.stateTitle, isDarkMode && styles.textLight]}>
                  You are all caught up
                </Text>
                <Text style={[styles.stateText, isDarkMode && styles.textMuted]}>
                  No unread notifications right now.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {shown.map(item => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    isDarkMode={isDarkMode}
                    testID={`notification-item-${item.id}`}
                    onPress={() => markRead.mutate([item.id])}
                  />
                ))}
              </ScrollView>
            )}

            <BouncyPressable
              testID="notification-view-all"
              style={styles.viewAll}
              activeScale={0.96}
              onPress={handleViewAll}>
              <Text style={styles.viewAllText}>View all</Text>
              <Feather name="arrow-right" size={ms(14)} color="#FFFFFF" />
            </BouncyPressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 7, 29, 0.45)' },
  popup: {
    position: 'absolute',
    left: s(15),
    right: s(15),
    maxHeight: '72%',
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(14),
    borderBottomWidth: 4,
    borderBottomColor: '#D4C8F3',
  },
  popupDark: { backgroundColor: '#1B0F2E', borderBottomColor: '#0B0316' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },
  headTitle: { fontSize: s(16), fontFamily: fontFamily.extraBold, color: '#1E1B4B' },
  markAll: { fontSize: s(12), fontFamily: fontFamily.bold, color: '#7C3AED' },
  list: { flexGrow: 0 },
  state: { alignItems: 'center', paddingVertical: vs(22), gap: vs(6) },
  stateTitle: { fontSize: s(14), fontFamily: fontFamily.bold, color: '#1E1B4B' },
  stateText: { fontSize: s(12), fontFamily: fontFamily.regular, color: '#7A6F8A' },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    marginTop: vs(6),
    backgroundColor: '#35128A',
    borderRadius: s(16),
    paddingVertical: vs(11),
  },
  viewAllText: { fontSize: s(13), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  textLight: { color: '#F3E8FF' },
  textMuted: { color: '#A99BC4' },
});
