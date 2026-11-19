import { StyleSheet } from 'react-native';
import { s } from 'react-native-size-matters';
import { theme } from '../../theme';

// Same button as the old header bell, plus the unread count badge.
export const headerStyles = StyleSheet.create({
  btn: {
    width: s(44),
    height: s(44),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#1D1238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginLeft: s(10),
  },
  btnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
  badge: {
    position: 'absolute',
    top: s(3),
    right: s(3),
    minWidth: s(17),
    height: s(17),
    paddingHorizontal: s(4),
    borderRadius: s(9),
    backgroundColor: '#FF2A7A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
});
