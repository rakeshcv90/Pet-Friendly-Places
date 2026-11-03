import { StyleSheet, Platform } from 'react-native';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../../theme';

export const styles = StyleSheet.create({
  /* outer shell carries the shadow + raised bottom edge; the clip view rounds the corners */
  shell: {
    marginVertical: vs(14),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE2F8',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCCFF3',
    ...Platform.select({
      ios: {
        shadowColor: '#3B108F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },
  shellDark: {
    backgroundColor: '#160D2E',
    borderColor: '#26134B',
    borderBottomColor: '#0B0518',
  },
  clip: {
    borderRadius: s(15),
    overflow: 'hidden',
  },
  headRow: {
    flexDirection: 'row',
  },
  headCell: {
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    justifyContent: 'center',
  },
  headText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFE8FB',
    backgroundColor: '#FFFFFF',
  },
  rowDark: {
    backgroundColor: '#160D2E',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowAlt: {
    backgroundColor: '#FAF7FF',
  },
  rowAltDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.07)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
  },
  cellText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: ms(19),
  },
  cellTextDark: {
    color: '#D1D5DB',
  },
  firstCellText: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#3B108F',
  },
  firstCellTextDark: {
    color: '#C4ADFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(6),
    paddingVertical: vs(4),
    paddingHorizontal: s(10),
    borderRadius: 999,
  },
  chipDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
  },
  chipText: {
    flexShrink: 1,
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: ms(16),
  },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: s(28),
  },
  hint: {
    alignSelf: 'center',
    marginTop: -vs(6),
    marginBottom: vs(10),
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#7B2CFF',
  },
  hintDark: {
    color: '#C4ADFF',
  },
});
