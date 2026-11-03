import { StyleSheet } from 'react-native';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../../theme';

export const styles = StyleSheet.create({
  tagsSection: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  tagsLabel: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: vs(8),
  },
  tagsLabelDark: {
    color: '#6B7280',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  tagPill: {
    backgroundColor: '#F3EEFF',
    borderWidth: 1,
    borderColor: '#C4ADFF',
    borderRadius: 100,
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
  },
  tagPillDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderColor: 'rgba(196, 173, 255, 0.35)',
  },
  tagPillText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#3B108F',
  },
  tagPillTextDark: {
    color: '#C4ADFF',
  },
  trustBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginTop: vs(8),
    marginBottom: vs(4),
    borderRadius: s(14),
    padding: s(14),
    gap: s(12),
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#EFE6DB',
  },
  trustBoxDark: {
    backgroundColor: '#160D2E',
    borderColor: '#26134B',
  },
  trustAvatar: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustContent: {
    flex: 1,
  },
  trustName: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111111',
    marginBottom: vs(3),
  },
  trustNameDark: {
    color: '#EDE9FE',
  },
  trustDesc: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(18),
    marginBottom: vs(5),
  },
  trustDescDark: {
    color: '#9CA3AF',
  },
  trustLink: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#3B108F',
  },
  trustLinkDark: {
    color: '#C4ADFF',
  },
  shareRow: {
    flexDirection: 'row',
    gap: s(10),
    marginHorizontal: s(16),
    marginTop: vs(16),
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    paddingVertical: vs(12),
    borderRadius: s(12),
    borderWidth: 1.5,
    borderColor: '#C4ADFF',
    backgroundColor: '#F3EEFF',
  },
  shareBtnDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderColor: 'rgba(196, 173, 255, 0.35)',
  },
  shareBtnText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#3B108F',
  },
  shareBtnTextDark: {
    color: '#C4ADFF',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    paddingVertical: vs(12),
    borderRadius: s(12),
    overflow: 'hidden',
    backgroundColor: '#5B1FC4',
  },
  doneBtnText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },
});
