import { StyleSheet, Platform } from 'react-native';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../../theme';

export const styles = StyleSheet.create({
  bodyContainer: {
    paddingHorizontal: s(16),
    paddingTop: vs(8),
  },
  statRow: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(16),
  },
  statRowDark: {},
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 3,
    borderBottomColor: '#DCDCE4',
    borderRadius: s(10),
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: vs(12),
    paddingHorizontal: s(6),
  },
  statItemDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    fontSize: ms(22),
    marginBottom: vs(3),
  },
  statValue: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#111111',
    textAlign: 'center',
  },
  statValueDark: {
    color: '#F3E8FF',
  },
  statLabel: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    marginTop: vs(2),
  },
  statLabelDark: {
    color: '#94A3B8',
  },
  h2: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A1A2E',
    marginTop: vs(28),
    marginBottom: vs(12),
    lineHeight: ms(26),
  },
  h2Dark: {
    color: '#EDE9FE',
  },
  h3: {
    fontSize: ms(17),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#1A1A2E',
    marginTop: vs(22),
    marginBottom: vs(8),
    lineHeight: ms(23),
  },
  h3Dark: {
    color: '#DDD6FE',
  },
  paragraph: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: s(22),
    marginBottom: vs(10),
  },
  paragraphDark: {
    color: '#D1D5DB',
  },
  paragraphIntro: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1F2937',
    lineHeight: s(23),
  },
  paragraphIntroDark: {
    color: '#E5E7EB',
  },
  strongLine: {
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderRadius: s(8),
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    marginBottom: vs(8),
  },
  strongLineDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  strongLineText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#5B21B6',
    lineHeight: s(18),
  },
  strongLineTextDark: {
    color: '#C084FC',
  },
  calloutBox: {
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 16, 143, 0.12)',
    borderRadius: s(12),
    paddingVertical: vs(14),
    paddingLeft: s(20),
    paddingRight: s(16),
    marginVertical: vs(10),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(59, 16, 143, 0.18)',
    ...Platform.select({
      ios: {
        shadowColor: '#3B108F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  calloutBoxDark: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  calloutTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: ms(20),
    marginBottom: vs(5),
  },
  calloutBody: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: ms(23),
  },
  runBold: {
    fontFamily: theme.typography.fontFamily.bold,
  },
  runMark: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#1A1A2E',
  },
  runLink: {
    color: '#3B108F',
    textDecorationLine: 'underline',
  },
  runLinkDark: {
    color: '#C084FC',
  },
  bulletList: {
    marginBottom: vs(12),
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(6),
    gap: s(8),
  },
  bulletDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#7C3AED',
    marginTop: s(7),
    flexShrink: 0,
  },
  bulletDotDark: {
    backgroundColor: '#C084FC',
  },
  bulletNumber: {
    width: s(22),
    flex: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: s(21),
  },
  bulletTextDark: {
    color: '#D1D5DB',
  },
  tipStrip: {
    flexDirection: 'row',
    backgroundColor: '#E6F1FB',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(24, 95, 165, 0.2)',
    borderRadius: s(10),
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    marginVertical: vs(10),
    gap: s(10),
    alignItems: 'flex-start',
  },
  tipStripDark: {
    backgroundColor: 'rgba(24, 95, 165, 0.25)',
  },
  tipStripIcon: {
    fontSize: ms(18),
    marginTop: vs(1),
  },
  tipStripText: {
    flex: 1,
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#185FA5',
    lineHeight: ms(21),
  },
  tipStripTextDark: {
    color: '#B5D4F4',
  },
  cityGrid: {
    gap: s(12),
    marginVertical: vs(10),
  },
  cityCard: {
    gap: s(4),
    paddingVertical: vs(13),
    paddingHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0D9F7',
    borderBottomWidth: 3.5,
    borderRadius: s(12),
  },
  cityCardDark: {
    backgroundColor: '#1A1530',
    borderColor: '#3D2F7A',
  },
  cityCardHonest: {
    backgroundColor: '#FFFBF0',
    borderColor: '#F0C97A',
  },
  cityCardHonestDark: {
    backgroundColor: '#1E1800',
    borderColor: '#7A5500',
  },
  cityName: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#3B108F',
  },
  cityNameDark: {
    color: '#C4ADFF',
  },
  cityNameHonest: {
    color: '#7A5500',
  },
  cityNameHonestDark: {
    color: '#F5D97A',
  },
  cityNote: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#666666',
    lineHeight: ms(17),
  },
  cityNoteDark: {
    color: '#9990B8',
  },
  listingEmbed: {
    backgroundColor: '#FAFAFA',
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginVertical: vs(10),
    borderBottomWidth: 3,
    borderBottomColor: '#E0D4F5',
  },
  listingEmbedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listingEmbedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  listingEmbedHeaderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  listingEmbedTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  listingEmbedName: {
    flexShrink: 1,
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111111',
    lineHeight: ms(18),
  },
  listingEmbedNameDark: {
    color: '#F3E8FF',
  },
  listingEmbedLink: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#7C3AED',
  },
  listingEmbedPhotos: {
    flexDirection: 'row',
    gap: s(4),
    paddingHorizontal: s(4),
    paddingTop: s(8),
  },
  listingEmbedPhoto: {
    flex: 1,
    aspectRatio: 1.45,
    borderRadius: s(6),
    backgroundColor: '#EDE9FE',
  },
  listingEmbedBody: {
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    gap: vs(6),
  },
  listingEmbedLocation: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
  },
  listingEmbedMetaDark: {
    color: '#94A3B8',
  },
  listingEmbedExcerpt: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: ms(18),
  },
  listingEmbedExcerptDark: {
    color: '#D1D5DB',
  },
  listingEmbedCharges: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
  },
  listingEmbedChargesLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111111',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(20),
    gap: s(10),
    opacity: 0.4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#7B2CFF',
  },
  dividerLineDark: {
    backgroundColor: '#A78BFA',
  },
  dividerPaw: {
    fontSize: ms(16),
  },
});
