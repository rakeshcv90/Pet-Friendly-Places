import { StyleSheet, Platform } from 'react-native';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../../theme';

export const styles = StyleSheet.create({
  heroContainer: {
    overflow: 'hidden',
    height: vs(260),
    backgroundColor: '#1F0F3D',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    // top dark band for header icons readability + bottom fade for overlay text
    backgroundColor: 'transparent',
    // Simple multi-stop via layered views workaround (no LinearGradient dependency)
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: s(16),
    paddingBottom: vs(14),
    paddingTop: vs(40),
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(5),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroCategoryPillDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  heroCategoryPillText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  articleHeader: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(16),
    marginTop: -vs(44),
    borderRadius: s(18),
    padding: s(16),
    marginBottom: vs(4),
    ...Platform.select({
      ios: {
        shadowColor: '#1F0F3D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  articleHeaderClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: s(18),
    overflow: 'hidden',
  },
  accentStrip: {
    height: s(4),
  },
  articleSheen: {
    position: 'absolute',
    top: -s(30),
    bottom: -s(30),
    width: s(90),
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: '#F5F3FF',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    marginBottom: vs(8),
    borderBottomWidth: 2,
    borderBottomColor: '#E5DDF7',
  },
  metaBarDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderBottomColor: 'rgba(0, 0, 0, 0.35)',
  },
  metaSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: s(4),
  },
  metaDivider: {
    width: 1,
    height: s(11),
    marginHorizontal: s(8),
    backgroundColor: '#D9CFF0',
  },
  metaDividerDark: {
    backgroundColor: 'rgba(196, 173, 255, 0.3)',
  },
  metaChip: {
    backgroundColor: '#F5F3FF',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderBottomWidth: 2,
    borderBottomColor: '#E5DDF7',
  },
  metaChipDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderBottomColor: 'rgba(0, 0, 0, 0.35)',
  },
  articleHeaderDark: {
    backgroundColor: '#160D2E',
  },
  articleTitle: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#0F072B',
    lineHeight: ms(28),
    letterSpacing: -0.4,
    marginBottom: vs(10),
  },
  articleTitleDark: {
    color: '#F3E8FF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    marginBottom: vs(6),
  },
  metaAuthor: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#374151',
    flexShrink: 1,
  },
  metaAuthorDark: {
    color: '#D1D5DB',
  },
  metaSubRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(8),
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  metaPillText: {
    flexShrink: 1,
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  metaPillTextDark: {
    color: '#94A3B8',
  },
  articleExcerpt: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(20),
    marginTop: vs(2),
  },
  articleExcerptDark: {
    color: '#9CA3AF',
  },
});
