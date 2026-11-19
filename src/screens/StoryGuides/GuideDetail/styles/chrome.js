import { StyleSheet, Platform } from 'react-native';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../../theme';

export const styles = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    zIndex: 20,
  },
  floatingActions: {
    flexDirection: 'row',
    gap: s(8),
  },
  floatingBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: 'rgba(15, 7, 29, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    backgroundColor: '#FAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#F1E8DC',
    zIndex: 10,
  },
  fallbackHeaderDark: {
    backgroundColor: '#0F071D',
    borderBottomColor: '#26134B',
  },
  fallbackTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
  },
  fallbackTitleDark: {
    color: '#FFFFFF',
  },
  headerCircleBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DEF8',
    ...Platform.select({
      ios: {
        shadowColor: '#1F0F3D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerCircleBtnDark: {
    backgroundColor: '#1E1035',
    borderColor: '#381E72',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  compactBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6DB',
    justifyContent: 'center',
    paddingHorizontal: s(64),
    ...Platform.select({
      ios: {
        shadowColor: '#1F0F3D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  compactBarDark: {
    backgroundColor: '#160D2E',
    borderBottomColor: '#26134B',
  },
  compactTitle: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A1A2E',
    textAlign: 'center',
    paddingTop: vs(6),
  },
  compactTitleDark: {
    color: '#F3E8FF',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    gap: vs(10),
  },
  emptyTitle: {
    fontSize: ms(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1F0F3D',
    textAlign: 'center',
  },
  emptyTitleDark: {
    color: '#EDE9FE',
  },
  emptySubtitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: s(20),
  },
  emptySubtitleDark: {
    color: '#9CA3AF',
  },
  emptyBackBtn: {
    marginTop: vs(6),
    backgroundColor: '#7C3AED',
    paddingHorizontal: s(24),
    paddingVertical: vs(12),
    borderRadius: s(12),
  },
  emptyBackBtnDark: {
    backgroundColor: '#5B21B6',
  },
  emptyBackBtnText: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
