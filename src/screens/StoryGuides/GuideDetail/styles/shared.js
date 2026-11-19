import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  card3D: {
    borderWidth: 1,
    borderColor: '#F1EAFB',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#E0D4F5',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  card3DDark: {
    borderColor: '#26134B',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: '#0B0518',
  },
  btn3D: {
    borderBottomWidth: 3.5,
    borderBottomColor: 'rgba(31, 15, 61, 0.28)',
  },
});
