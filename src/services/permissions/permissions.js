import { Platform, PermissionsAndroid } from 'react-native';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    // In a real app with react-native-permissions, we'd handle iOS here
    // For now, assume true or use standard API
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'PetFriendly needs access to your location to find nearby pets.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};
