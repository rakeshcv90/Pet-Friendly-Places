import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  Image,
  Animated,
  PermissionsAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { s, ms } from 'react-native-size-matters';
import { colors } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { useStore } from '../../../store';

const TOTAL_STEPS = 8;

const SAMPLE_PET_PHOTOS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
];

const ANIMALS = [
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { id: 'guinea_pig', label: 'Guinea pig', emoji: '🐹' },
  { id: 'hamster', label: 'Hamster', emoji: '🐭' },
  { id: 'bird', label: 'Bird', emoji: '🦜' },
];

const SEX_OPTIONS = ['Male', 'Female', 'Unknown'];
const SIZE_OPTIONS = ['Small', 'Medium', 'Large'];
const DROPDOWN_OPTIONS = ['Unknown', 'Yes', 'No'];

export const PostPetWizardModal = ({
  visible,
  onClose,
  onPostCreated,
  initialType = 'lost',
  defaultLocation = 'Delhi NCR',
}) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  const placeholderColor = isDarkMode ? '#64748B' : colors.reunite.textLightMuted;

  // Step Management (1 to 8)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: What happened?
  const [eventType, setEventType] = useState(initialType); // 'lost' | 'found' | 'rehome'

  // Step 2: Which animal?
  const [animal, setAnimal] = useState('dog');

  // Step 3: Photos
  const [photos, setPhotos] = useState([]);

  // Step 4: Tell us about the pet
  const [petName, setPetName] = useState('');
  const [breed, setBreed] = useState('');
  const [colour, setColour] = useState('');
  const [sex, setSex] = useState('Unknown');
  const [age, setAge] = useState('');
  const [size, setSize] = useState('Medium');
  const [hasCollar, setHasCollar] = useState(false);
  const [microchip, setMicrochip] = useState('Unknown');
  const [sterilised, setSterilised] = useState('Unknown');
  const [vaccinated, setVaccinated] = useState('Unknown');
  const [description, setDescription] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // 'microchip' | 'sterilised' | 'vaccinated' | null

  // Step 5: Where and when?
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState(defaultLocation);
  const [stateRegion, setStateRegion] = useState('');
  const [dateLost, setDateLost] = useState('22/10/2026');

  // Step 6: How can people reach you?
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showPhonePublicly, setShowPhonePublicly] = useState(false);

  // Step 7: A private detail
  const [privateDetail, setPrivateDetail] = useState('');

  // Step 8: Preview Active Photo Index
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

  // Form Validation Errors
  const [errors, setErrors] = useState({});

  const clearError = field => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ── Custom Ultra-Premium Alert Dialog State & Animations ──
  const [customAlert, setCustomAlert] = useState(null);
  const alertScale = useRef(new Animated.Value(0.85)).current;
  const alertOpacity = useRef(new Animated.Value(0)).current;

  const showCustomAlert = config => {
    Keyboard.dismiss();
    setCustomAlert(config);
    alertScale.setValue(0.85);
    alertOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(alertScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideCustomAlert = () => {
    Animated.parallel([
      Animated.timing(alertScale, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(alertOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const cb = customAlert && customAlert.onPrimaryPress;
      setCustomAlert(null);
      if (typeof cb === 'function') {
        cb();
      }
    });
  };

  // ── 3D Animations ──
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(1)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const ctaPulseAnim = useRef(new Animated.Value(0)).current;

  // Modal 3D Entrance Spring
  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setEventType(initialType || 'lost');
      if (!city) {
        setCity(defaultLocation);
      }
      setErrors({});
      setCustomAlert(null);
      setPreviewPhotoIndex(0);
      entranceAnim.setValue(0);
      Animated.spring(entranceAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialType]);

  // Step Transition 3D Flip
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.spring(stepAnim, {
      toValue: 1,
      tension: 75,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepAnim]);

  // Continuous Ambient 3D Floating Loop
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatingAnim]);

  // Continuous CTA Breathing Pulse
  useEffect(() => {
    const ctaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulseAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    ctaLoop.start();
    return () => ctaLoop.stop();
  }, [ctaPulseAnim]);

  // Interpolations
  const cardScale = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1],
  });
  const cardRotateX = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['6deg', '0deg'],
  });
  const cardTranslateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [35, 0],
  });
  const cardOpacity = entranceAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.85, 1],
  });

  const stepOpacity = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const stepTranslateY = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const stepRotateY = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['3.5deg', '0deg'],
  });
  const stepScale = stepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1],
  });

  const pinBounceY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const heartPulse = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const circlePulse = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const beaconRippleScale = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.30],
  });
  const beaconRippleOpacity = floatingAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.25, 0.60, 0.25],
  });
  const orbDrift1 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const orbDrift2 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  const ctaScale = ctaPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  const handlePickCamera = async () => {
    if (photos.length >= 5) {
      showCustomAlert({
        type: 'info',
        icon: 'images',
        iconFamily: 'Ionicons',
        iconGradient: ['#6366F1', '#4338CA'],
        badgeText: 'PHOTO LIMIT REACHED',
        badgeColor: '#EEF2FF',
        badgeTextColor: '#4338CA',
        title: 'Maximum Photos Added',
        message: 'You can upload up to 5 photos per pet post for optimal speed and clarity.',
        primaryButtonText: 'Understood',
        buttonGradient: ['#4338CA', '#6366F1'],
      });
      return;
    }
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'PetFriendly needs camera access so you can take a photo of the pet.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED && granted !== true) {
          showCustomAlert({
            type: 'warning',
            icon: 'camera',
            iconFamily: 'Ionicons',
            iconGradient: ['#F59E0B', '#B45309'],
            badgeText: 'PERMISSION NEEDED',
            badgeColor: '#FFFBEB',
            badgeTextColor: '#B45309',
            title: 'Camera Permission',
            message: 'Camera access is needed so you can take a clear photo of the pet.',
            primaryButtonText: 'Understood',
            buttonGradient: ['#B45309', '#F59E0B'],
          });
          return;
        }
      } catch (err) {
        console.warn('Camera permission request error:', err);
      }
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.85,
        maxWidth: 1200,
        maxHeight: 1200,
        saveToPhotos: false,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showCustomAlert({
            type: 'error',
            icon: 'alert-circle',
            iconFamily: 'Ionicons',
            iconGradient: ['#EF4444', '#DC2626'],
            badgeText: 'CAMERA ERROR',
            badgeColor: '#FEF2F2',
            badgeTextColor: '#DC2626',
            title: 'Camera Error',
            message: response.errorMessage || 'Unable to open camera. Please try again.',
            primaryButtonText: 'Dismiss',
            buttonGradient: ['#DC2626', '#EF4444'],
          });
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const newUris = response.assets.map(asset => asset.uri).filter(Boolean);
          setPhotos(prev => [...prev, ...newUris].slice(0, 5));
          clearError('photos');
        }
      },
    );
  };

  const handlePickGallery = () => {
    if (photos.length >= 5) {
      showCustomAlert({
        type: 'info',
        icon: 'images',
        iconFamily: 'Ionicons',
        iconGradient: ['#6366F1', '#4338CA'],
        badgeText: 'PHOTO LIMIT REACHED',
        badgeColor: '#EEF2FF',
        badgeTextColor: '#4338CA',
        title: 'Maximum Photos Added',
        message: 'You can upload up to 5 photos per pet post for optimal speed and clarity.',
        primaryButtonText: 'Understood',
        buttonGradient: ['#4338CA', '#6366F1'],
      });
      return;
    }
    const remaining = 5 - photos.length;
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.85,
        selectionLimit: remaining,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showCustomAlert({
            type: 'error',
            icon: 'alert-circle',
            iconFamily: 'Ionicons',
            iconGradient: ['#EF4444', '#DC2626'],
            badgeText: 'GALLERY ERROR',
            badgeColor: '#FEF2F2',
            badgeTextColor: '#DC2626',
            title: 'Gallery Error',
            message: response.errorMessage || 'Unable to open gallery. Please try again.',
            primaryButtonText: 'Dismiss',
            buttonGradient: ['#DC2626', '#EF4444'],
          });
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const newUris = response.assets.map(asset => asset.uri).filter(Boolean);
          setPhotos(prev => [...prev, ...newUris].slice(0, 5));
          clearError('photos');
        }
      },
    );
  };

  const handleRemovePhoto = indexToRemove => {
    setPhotos(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setErrors(errs => ({
          ...errs,
          photos: 'Please take or select at least one photo of the pet.',
        }));
      }
      return updated;
    });
    setPreviewPhotoIndex(0);
  };

  // Validation before proceeding to next step
  const handleContinue = () => {
    if (currentStep === 1) {
      if (!eventType) {
        showCustomAlert({
          type: 'warning',
          icon: 'help-circle-outline',
          iconFamily: 'Ionicons',
          iconGradient: ['#F59E0B', '#D97706'],
          badgeText: 'STEP 1 REQUIRED',
          badgeColor: '#FFFBEB',
          badgeTextColor: '#B45309',
          title: 'Select Situation',
          message: 'Please choose whether your pet is lost, you found a pet, or need to rehome/adopt to continue.',
          primaryButtonText: 'Select Option',
          buttonGradient: ['#D97706', '#F59E0B'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!animal) {
        showCustomAlert({
          type: 'warning',
          icon: 'paw',
          iconFamily: 'Ionicons',
          iconGradient: ['#8B5CF6', '#6D28D9'],
          badgeText: 'STEP 2 REQUIRED',
          badgeColor: '#F5F3FF',
          badgeTextColor: '#6D28D9',
          title: 'Select Animal',
          message: 'Please choose which animal this post is for to help category filtering.',
          primaryButtonText: 'Choose Animal',
          buttonGradient: ['#6D28D9', '#8B5CF6'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (photos.length === 0) {
        setErrors({ photos: 'Please take or select at least one photo of the pet.' });
        showCustomAlert({
          type: 'warning',
          icon: 'camera',
          iconFamily: 'Ionicons',
          iconGradient: ['#EC4899', '#BE185D'],
          badgeText: 'PHOTO REQUIRED',
          badgeColor: '#FDF2F8',
          badgeTextColor: '#BE185D',
          title: 'Photo Required',
          message: 'Please add at least one clear photo of the pet to continue. Photos dramatically increase reunion rates!',
          primaryButtonText: 'Add Photo Now',
          buttonGradient: ['#BE185D', '#EC4899'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const step4Errors = {};
      const missing = [];
      if (!petName.trim()) {
        step4Errors.petName = "Please enter pet's name";
        missing.push("Pet's Name");
      }
      if (!breed.trim()) {
        step4Errors.breed = 'Please enter pet breed';
        missing.push('Breed');
      }
      if (!colour.trim()) {
        step4Errors.colour = 'Please enter colour and markings';
        missing.push('Colour & Markings');
      }
      if (!age.trim()) {
        step4Errors.age = 'Please enter pet age (e.g. 2 years, 6 months)';
        missing.push('Age');
      }
      if (!description.trim()) {
        step4Errors.description = 'Please write a description of the pet';
        missing.push('Description');
      }

      if (Object.keys(step4Errors).length > 0) {
        setErrors(step4Errors);
        showCustomAlert({
          type: 'error',
          icon: 'document-text',
          iconFamily: 'Ionicons',
          iconGradient: ['#EF4444', '#DC2626'],
          badgeText: 'INCOMPLETE DETAILS',
          badgeColor: '#FEF2F2',
          badgeTextColor: '#DC2626',
          title: 'Required Information',
          message: 'Please complete all pet details marked in red to ensure accurate identification.',
          missingFields: missing,
          primaryButtonText: 'Fix Missing Details',
          buttonGradient: ['#DC2626', '#EF4444'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(5);
    } else if (currentStep === 5) {
      const step5Errors = {};
      const missing = [];
      if (!locality.trim()) {
        step5Errors.locality = 'Locality / landmark is required';
        missing.push('Locality / Landmark');
      }
      if (!city.trim()) {
        step5Errors.city = 'City is required';
        missing.push('City');
      }
      if (!stateRegion.trim()) {
        step5Errors.stateRegion = 'State is required';
        missing.push('State');
      }
      if (!dateLost.trim()) {
        step5Errors.dateLost = 'Date is required';
        missing.push('Date Lost/Found');
      }

      if (Object.keys(step5Errors).length > 0) {
        setErrors(step5Errors);
        showCustomAlert({
          type: 'error',
          icon: 'location',
          iconFamily: 'Ionicons',
          iconGradient: ['#F97316', '#C2410C'],
          badgeText: 'LOCATION NEEDED',
          badgeColor: '#FFF7ED',
          badgeTextColor: '#C2410C',
          title: 'Location & Date Required',
          message: 'Accurate location and date help community members know exactly where to search.',
          missingFields: missing,
          primaryButtonText: 'Complete Location',
          buttonGradient: ['#C2410C', '#EA580C'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(6);
    } else if (currentStep === 6) {
      const step6Errors = {};
      const missing = [];
      if (!contactName.trim()) {
        step6Errors.contactName = 'Contact name is required';
        missing.push('Contact Name');
      }
      const cleanDigits = contactPhone.replace(/[^0-9]/g, '');
      if (!contactPhone.trim() || cleanDigits.length < 7) {
        step6Errors.contactPhone = 'Valid contact phone number is required (at least 7-10 digits)';
        missing.push('Phone Number');
      }

      if (Object.keys(step6Errors).length > 0) {
        setErrors(step6Errors);
        showCustomAlert({
          type: 'error',
          icon: 'call',
          iconFamily: 'Ionicons',
          iconGradient: ['#3B82F6', '#1D4ED8'],
          badgeText: 'CONTACT DETAILS NEEDED',
          badgeColor: '#EFF6FF',
          badgeTextColor: '#1D4ED8',
          title: 'Contact Information Required',
          message: 'Please provide your name and a valid phone number so people can reach you immediately.',
          missingFields: missing,
          primaryButtonText: 'Enter Contact Info',
          buttonGradient: ['#1D4ED8', '#3B82F6'],
        });
        return;
      }
      setErrors({});
      setCurrentStep(7);
    } else if (currentStep === 7) {
      if (!privateDetail.trim()) {
        setErrors({ privateDetail: 'Private verification detail is required' });
        showCustomAlert({
          type: 'warning',
          icon: 'shield-checkmark',
          iconFamily: 'Ionicons',
          iconGradient: ['#7C3AED', '#5B21B6'],
          badgeText: 'OWNERSHIP PROTECTION',
          badgeColor: '#F5F3FF',
          badgeTextColor: '#6D28D9',
          title: 'Private Detail Required',
          message: 'Please provide a confidential identifier (e.g. unique collar marking, microchip prefix, hidden trait) to verify real ownership.',
          primaryButtonText: 'Add Secret Detail',
          buttonGradient: ['#5B21B6', '#7C3AED'],
        });
        return;
      }
      setErrors({});
      setPreviewPhotoIndex(0);
      setCurrentStep(8);
    } else if (currentStep === 8) {
      handleSubmitPost();
    }
  };

  const handleBack = () => {
    if (customAlert) {
      hideCustomAlert();
      return;
    }
    if (currentStep === 1) {
      onClose();
    } else {
      setOpenDropdown(null);
      setErrors({});
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitPost = () => {
    const displayName = petName.trim();

    const areaString = [locality.trim(), city.trim(), stateRegion.trim()]
      .filter(Boolean)
      .join(', ') || defaultLocation;

    // Structured post payload verified and ready for backend API integration
    const newPost = {
      id: `post-${Date.now()}`,
      type: eventType === 'rehome' ? 'adopt' : eventType,
      eventType,
      name: displayName,
      species: animal,
      breed: breed.trim(),
      colour: colour.trim(),
      sex,
      size,
      age: age.trim(),
      locality: locality.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      location: areaString,
      phone: contactPhone.trim(),
      contactName: contactName.trim(),
      showPhonePublicly,
      privateDetail: privateDetail.trim(),
      dateSeen: dateLost.trim(),
      timeAgo: 'Just now',
      image: photos[0] || SAMPLE_PET_PHOTOS[0],
      photos,
      description: description.trim(),
      hasCollar,
      microchip,
      sterilised,
      vaccinated,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    console.log('📦 [PostPetWizard] Verified Post Payload ready for API:', JSON.stringify(newPost, null, 2));

    if (onPostCreated) {
      onPostCreated(newPost);
    }

    showCustomAlert({
      type: 'success',
      icon: 'checkmark-circle',
      iconFamily: 'Ionicons',
      iconGradient: ['#10B981', '#059669'],
      badgeText: 'READY FOR API SYNC',
      badgeColor: '#ECFDF5',
      badgeTextColor: '#059669',
      title: 'Post Published! 🎉',
      message: 'All pet details have been verified and saved. Ready to sync with backend API.',
      primaryButtonText: 'Done',
      buttonGradient: ['#059669', '#10B981'],
      onPrimaryPress: () => {
        onClose();
      },
    });
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 1 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>What happened?</Text>
            <Text style={styles.stepSubtitle}>
              Select the option that best describes your situation to immediately notify the right community.
            </Text>

            <View style={styles.step1CardsRow}>
              {/* Option 1: I lost my pet */}
              <BouncyPressable
                containerStyle={styles.step1CardCol}
                style={[
                  styles.step1Card,
                  eventType === 'lost' && styles.step1CardActiveLost,
                ]}
                activeScale={0.96}
                onPress={() => setEventType('lost')}>
                {eventType === 'lost' && (
                  <View style={[styles.cardCheckCircle, styles.cardCheckCircleLost]}>
                    <Feather name="check" size={ms(9)} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.step1IconWrapper}>
                  {eventType === 'lost' && (
                    <Animated.View
                      style={[
                        styles.beaconRing,
                        {
                          transform: [{ scale: beaconRippleScale }],
                          opacity: beaconRippleOpacity,
                        },
                      ]}
                    />
                  )}
                  <View style={styles.medallionBackdrop}>
                    <Animated.View
                      style={
                        eventType === 'lost'
                          ? { transform: [{ scale: circlePulse }] }
                          : null
                      }>
                      <Ionicons
                        name="search"
                        size={ms(30)}
                        color={
                          eventType === 'lost'
                            ? (isDarkMode ? '#FB7185' : '#E11D48')
                            : (isDarkMode ? '#C4B5FD' : '#6B7280')
                        }
                      />
                    </Animated.View>
                  </View>
                </View>

                <View style={styles.cardTextWrapper}>
                  <Text
                    style={[
                      styles.step1CardText,
                      eventType === 'lost' && styles.step1CardTextActive,
                    ]}
                    numberOfLines={2}>
                    I lost my pet
                  </Text>
                  <View
                    style={[
                      styles.cardTypePill,
                      eventType === 'lost' ? styles.pillLostActive : styles.pillLostInactive,
                    ]}>
                    <Text
                      style={[
                        styles.cardTypePillText,
                        eventType === 'lost' ? styles.pillTextLostActive : styles.pillTextLostInactive,
                      ]}>
                      Lost Pet
                    </Text>
                  </View>
                </View>
              </BouncyPressable>

              {/* Option 2: I found a pet */}
              <BouncyPressable
                containerStyle={styles.step1CardCol}
                style={[
                  styles.step1Card,
                  eventType === 'found' && styles.step1CardActiveFound,
                ]}
                activeScale={0.96}
                onPress={() => setEventType('found')}>
                {eventType === 'found' && (
                  <View style={[styles.cardCheckCircle, styles.cardCheckCircleFound]}>
                    <Feather name="check" size={ms(9)} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.step1IconWrapper}>
                  <View style={styles.medallionBackdrop}>
                    <Animated.View
                      style={
                        eventType === 'found'
                          ? { transform: [{ translateY: pinBounceY }] }
                          : null
                      }>
                      <Ionicons
                        name="location-sharp"
                        size={ms(32)}
                        color={
                          eventType === 'found'
                            ? (isDarkMode ? '#C084FC' : '#7C3AED')
                            : (isDarkMode ? '#C4B5FD' : '#6B7280')
                        }
                      />
                    </Animated.View>
                  </View>
                </View>

                <View style={styles.cardTextWrapper}>
                  <Text
                    style={[
                      styles.step1CardText,
                      eventType === 'found' && styles.step1CardTextActive,
                    ]}
                    numberOfLines={2}>
                    I found a pet
                  </Text>
                  <View
                    style={[
                      styles.cardTypePill,
                      eventType === 'found' ? styles.pillFoundActive : styles.pillFoundInactive,
                    ]}>
                    <Text
                      style={[
                        styles.cardTypePillText,
                        eventType === 'found' ? styles.pillTextFoundActive : styles.pillTextFoundInactive,
                      ]}>
                      Sighting
                    </Text>
                  </View>
                </View>
              </BouncyPressable>

              {/* Option 3: I'm rehoming or my shelter has a pet */}
              <BouncyPressable
                containerStyle={styles.step1CardCol}
                style={[
                  styles.step1Card,
                  eventType === 'rehome' && styles.step1CardActiveAdopt,
                ]}
                activeScale={0.96}
                onPress={() => setEventType('rehome')}>
                {eventType === 'rehome' && (
                  <View style={[styles.cardCheckCircle, styles.cardCheckCircleAdopt]}>
                    <Feather name="check" size={ms(9)} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.step1IconWrapper}>
                  <View style={styles.medallionBackdrop}>
                    <Animated.View
                      style={
                        eventType === 'rehome'
                          ? { transform: [{ scale: heartPulse }] }
                          : null
                      }>
                      <Ionicons
                        name="heart"
                        size={ms(32)}
                        color={
                          eventType === 'rehome'
                            ? (isDarkMode ? '#34D399' : '#059669')
                            : (isDarkMode ? '#C4B5FD' : '#6B7280')
                        }
                      />
                    </Animated.View>
                  </View>
                </View>

                <View style={styles.cardTextWrapper}>
                  <Text
                    style={[
                      styles.step1CardText,
                      eventType === 'rehome' && styles.step1CardTextActive,
                    ]}
                    numberOfLines={3}>
                    I'm rehoming or shelter
                  </Text>
                  <View
                    style={[
                      styles.cardTypePill,
                      eventType === 'rehome' ? styles.pillAdoptActive : styles.pillAdoptInactive,
                    ]}>
                    <Text
                      style={[
                        styles.cardTypePillText,
                        eventType === 'rehome' ? styles.pillTextAdoptActive : styles.pillTextAdoptInactive,
                      ]}>
                      Adoption
                    </Text>
                  </View>
                </View>
              </BouncyPressable>
            </View>

            {/* Luxury Community Pledge Banner */}
            <View style={styles.luxuryPledgeBanner}>
              <View style={styles.pledgeShieldIconSquircle}>
                <Ionicons name="shield-checkmark" size={ms(16)} color="#7C3AED" />
              </View>
              <View style={styles.pledgeTextCol}>
                <Text style={styles.pledgeTitle}>Safe & Verified Network</Text>
                <Text style={styles.pledgeSubtitle}>
                  Every report is verified and instantly broadcasted to 10,000+ local pet owners.
                </Text>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 2 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>Which animal?</Text>
            <Text style={styles.stepSubtitle}>
              Select the species so nearby owners and rescue groups can filter accurately.
            </Text>

            <View style={styles.animalsGrid}>
              {ANIMALS.map(item => {
                const isSelected = animal === item.id;
                return (
                  <BouncyPressable
                    key={item.id}
                    containerStyle={styles.animalCardCol}
                    style={[
                      styles.animalCard,
                      isSelected && styles.animalCardActive,
                    ]}
                    activeScale={0.96}
                    onPress={() => setAnimal(item.id)}>
                    <Text style={styles.animalEmoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.animalCardText,
                        isSelected && styles.animalCardTextActive,
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.animalCheckBadge}>
                        <Feather name="check" size={ms(9)} color="#FFFFFF" />
                      </View>
                    )}
                  </BouncyPressable>
                );
              })}
            </View>
          </View>
        );

      case 3:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 3 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSubtitle}>
              Clear photos of the face and markings dramatically increase reunion rates.
            </Text>

            {/* Dual Photo Source Cards: Camera & Gallery */}
            <View style={styles.photoSourceRow}>
              {/* Option A: Take Photo with Camera */}
              <BouncyPressable
                containerStyle={styles.photoSourceCol}
                style={styles.photoSourceCardCamera}
                activeScale={0.96}
                onPress={handlePickCamera}>
                <View style={styles.photoSourceIconSquircleCamera}>
                  <Ionicons name="camera" size={ms(22)} color="#7C3AED" />
                </View>
                <View style={styles.photoSourceTextGroup}>
                  <Text style={styles.photoSourceTitle}>Take Photo</Text>
                  <Text style={styles.photoSourceSubtitle}>Open camera</Text>
                </View>
              </BouncyPressable>

              {/* Option B: Choose from Gallery */}
              <BouncyPressable
                containerStyle={styles.photoSourceCol}
                style={styles.photoSourceCardGallery}
                activeScale={0.96}
                onPress={handlePickGallery}>
                <View style={styles.photoSourceIconSquircleGallery}>
                  <Ionicons name="images" size={ms(22)} color="#0D9488" />
                </View>
                <View style={styles.photoSourceTextGroup}>
                  <Text style={styles.photoSourceTitle}>From Gallery</Text>
                  <Text style={styles.photoSourceSubtitle}>Choose files</Text>
                </View>
              </BouncyPressable>
            </View>

            {errors.photos && (
              <View style={styles.photoErrorCard}>
                <Ionicons name="alert-circle" size={ms(14)} color="#DC2626" />
                <Text style={styles.photoErrorText}>{errors.photos}</Text>
              </View>
            )}

            {photos.length === 0 && (
              <View style={styles.photoEmptyCard}>
                <View style={styles.photoEmptyIconRow}>
                  <View style={styles.photoEmptyIconBubble}>
                    <Ionicons name="camera" size={ms(18)} color="#7C3AED" />
                  </View>
                  <Text style={styles.photoEmptyDivider}>or</Text>
                  <View style={styles.photoEmptyIconBubbleMint}>
                    <Ionicons name="images" size={ms(18)} color="#0D9488" />
                  </View>
                </View>
                <Text style={styles.photoEmptyTitle}>No photos selected yet</Text>
                <Text style={styles.photoEmptySubtitle}>
                  Tap "Take Photo" to capture with camera, or "From Gallery" to select up to 5 photos from your device.
                </Text>
              </View>
            )}

            {photos.length > 0 && (
              <View style={styles.photosPreviewSection}>
                <View style={styles.photosCountHeader}>
                  <View style={styles.photosCountLeft}>
                    <Text style={styles.photosCountText}>
                      {photos.length} of 5 photos added
                    </Text>
                  </View>
                  <View style={styles.photosCountRight}>
                    <BouncyPressable
                      style={styles.photosClearAllBtn}
                      activeScale={0.88}
                      onPress={() => {
                        setPhotos([]);
                        setPreviewPhotoIndex(0);
                        setErrors(errs => ({
                          ...errs,
                          photos: 'Please take or select at least one photo of the pet.',
                        }));
                      }}>
                      <Feather name="trash-2" size={ms(12)} color="#EF4444" />
                      <Text style={styles.photosClearAllText}>Delete all</Text>
                    </BouncyPressable>
                    {photos.length < 5 && (
                      <Pressable onPress={handlePickGallery} style={styles.photosAddMoreBtn}>
                        <Text style={styles.photosAddMoreLink}>+ Add more</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                <View style={styles.photosPreviewRow}>
                  {photos.map((uri, index) => (
                    <View
                      key={`photo-${index}`}
                      style={styles.photoThumbWrapper}>
                      <View style={styles.photoThumbContainer}>
                        <Image source={{ uri }} style={styles.photoThumbImage} />
                        {index === 0 && (
                          <LinearGradient
                            colors={['#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryPhotoBadge}>
                            <Ionicons name="star" size={ms(8)} color="#FFFFFF" style={styles.primaryPhotoStar} />
                            <Text style={styles.primaryPhotoBadgeText}>Main</Text>
                          </LinearGradient>
                        )}
                      </View>

                      {/* Prominent High-Contrast Floating Red Trash / Delete Button */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.photoDeleteFloatingBtn,
                          pressed && styles.photoDeleteFloatingBtnPressed,
                        ]}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        onPress={() => handleRemovePhoto(index)}>
                        <LinearGradient
                          colors={['#EF4444', '#DC2626']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.photoDeleteFloatingGradient}>
                          <Ionicons name="trash" size={ms(13)} color="#FFFFFF" />
                        </LinearGradient>
                      </Pressable>
                    </View>
                  ))}

                  {/* Add more slot button */}
                  {photos.length < 5 && (
                    <BouncyPressable
                      style={styles.photoAddSlotBtn}
                      activeScale={0.92}
                      onPress={handlePickGallery}>
                      <View style={styles.photoAddSlotInner}>
                        <View style={styles.photoAddSlotIconCircle}>
                          <Feather name="plus" size={ms(18)} color="#7C3AED" />
                        </View>
                        <Text style={styles.photoAddSlotText}>Add more</Text>
                      </View>
                    </BouncyPressable>
                  )}
                </View>

                {/* Helpful Instruction Banner */}
                <View style={styles.photosDeleteHintRow}>
                  <View style={styles.photosDeleteHintIconCircle}>
                    <Ionicons name="trash-outline" size={ms(12)} color="#DC2626" />
                  </View>
                  <Text style={styles.photosDeleteHintText}>
                    Tap the red trash button to delete any photo. The first photo is set as the main display.
                  </Text>
                </View>
              </View>
            )}
          </View>
        );

      case 4:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 4 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>Tell us about the pet</Text>

            {/* Pet Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Pet's name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.petName && styles.textInputError]}
                placeholder="e.g. Milo, Bella, Bruno"
                placeholderTextColor={placeholderColor}
                value={petName}
                onChangeText={val => {
                  setPetName(val);
                  if (errors.petName) clearError('petName');
                }}
              />
              {errors.petName && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.petName}</Text>
                </View>
              )}
            </View>

            {/* Breed */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Breed <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.breed && styles.textInputError]}
                placeholder="e.g. Golden Retriever, Labrador, Indie"
                placeholderTextColor={placeholderColor}
                value={breed}
                onChangeText={val => {
                  setBreed(val);
                  if (errors.breed) clearError('breed');
                }}
              />
              {errors.breed && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.breed}</Text>
                </View>
              )}
            </View>

            {/* Colour and markings */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Colour and markings <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.colour && styles.textInputError]}
                placeholder="e.g. Golden brown with white patch on chest"
                placeholderTextColor={placeholderColor}
                value={colour}
                onChangeText={val => {
                  setColour(val);
                  if (errors.colour) clearError('colour');
                }}
              />
              {errors.colour && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.colour}</Text>
                </View>
              )}
            </View>

            {/* Sex */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Sex <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.segmentRow}>
                {SEX_OPTIONS.map(opt => {
                  const isSelected = sex === opt;
                  return (
                    <BouncyPressable
                      key={opt}
                      containerStyle={styles.segmentBtnCol}
                      style={[
                        styles.segmentBtn,
                        isSelected && styles.segmentBtnActive,
                      ]}
                      activeScale={0.96}
                      onPress={() => setSex(opt)}>
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isSelected && styles.segmentBtnTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Age <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.age && styles.textInputError]}
                placeholder="e.g. 2 years, 6 months"
                placeholderTextColor={placeholderColor}
                value={age}
                onChangeText={val => {
                  setAge(val);
                  if (errors.age) clearError('age');
                }}
              />
              {errors.age && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.age}</Text>
                </View>
              )}
            </View>

            {/* Size */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Size <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.segmentRow}>
                {SIZE_OPTIONS.map(opt => {
                  const isSelected = size === opt;
                  return (
                    <BouncyPressable
                      key={opt}
                      containerStyle={styles.segmentBtnCol}
                      style={[
                        styles.segmentBtn,
                        isSelected && styles.segmentBtnActive,
                      ]}
                      activeScale={0.96}
                      onPress={() => setSize(opt)}>
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isSelected && styles.segmentBtnTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </View>
            </View>

            {/* Collar Checkbox */}
            <BouncyPressable
              style={styles.checkboxRow}
              activeScale={0.96}
              onPress={() => setHasCollar(prev => !prev)}>
              <View
                style={[
                  styles.checkboxSquare,
                  hasCollar && styles.checkboxSquareActive,
                ]}>
                {hasCollar && <Feather name="check" size={ms(12)} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Collar</Text>
            </BouncyPressable>

            {/* Microchip Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Microchip</Text>
              <BouncyPressable
                style={styles.dropdownSelector}
                activeScale={0.98}
                onPress={() =>
                  setOpenDropdown(prev => (prev === 'microchip' ? null : 'microchip'))
                }>
                <Text style={styles.dropdownSelectorText}>{microchip}</Text>
                <Feather
                  name={openDropdown === 'microchip' ? 'chevron-up' : 'chevron-down'}
                  size={ms(18)}
                  color={isDarkMode ? '#CBD5E1' : '#1F2937'}
                />
              </BouncyPressable>
              {openDropdown === 'microchip' && (
                <View style={styles.dropdownMenu}>
                  {DROPDOWN_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      style={[
                        styles.dropdownMenuItem,
                        microchip === opt && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setMicrochip(opt);
                        setOpenDropdown(null);
                      }}>
                      <Text
                        style={[
                          styles.dropdownMenuText,
                          microchip === opt && styles.dropdownMenuTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Sterilised Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sterilised</Text>
              <BouncyPressable
                style={styles.dropdownSelector}
                activeScale={0.98}
                onPress={() =>
                  setOpenDropdown(prev => (prev === 'sterilised' ? null : 'sterilised'))
                }>
                <Text style={styles.dropdownSelectorText}>{sterilised}</Text>
                <Feather
                  name={openDropdown === 'sterilised' ? 'chevron-up' : 'chevron-down'}
                  size={ms(18)}
                  color={isDarkMode ? '#CBD5E1' : '#1F2937'}
                />
              </BouncyPressable>
              {openDropdown === 'sterilised' && (
                <View style={styles.dropdownMenu}>
                  {DROPDOWN_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      style={[
                        styles.dropdownMenuItem,
                        sterilised === opt && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setSterilised(opt);
                        setOpenDropdown(null);
                      }}>
                      <Text
                        style={[
                          styles.dropdownMenuText,
                          sterilised === opt && styles.dropdownMenuTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Vaccinated Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vaccinated</Text>
              <BouncyPressable
                style={styles.dropdownSelector}
                activeScale={0.98}
                onPress={() =>
                  setOpenDropdown(prev => (prev === 'vaccinated' ? null : 'vaccinated'))
                }>
                <Text style={styles.dropdownSelectorText}>{vaccinated}</Text>
                <Feather
                  name={openDropdown === 'vaccinated' ? 'chevron-up' : 'chevron-down'}
                  size={ms(18)}
                  color={isDarkMode ? '#CBD5E1' : '#1F2937'}
                />
              </BouncyPressable>
              {openDropdown === 'vaccinated' && (
                <View style={styles.dropdownMenu}>
                  {DROPDOWN_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      style={[
                        styles.dropdownMenuItem,
                        vaccinated === opt && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setVaccinated(opt);
                        setOpenDropdown(null);
                      }}>
                      <Text
                        style={[
                          styles.dropdownMenuText,
                          vaccinated === opt && styles.dropdownMenuTextActive,
                        ]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Description Textarea */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Description <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.textareaWrapper,
                  errors.description && styles.textareaWrapperError,
                ]}>
                <TextInput
                  style={styles.textareaInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe temperament, distinct markings, circumstances, or collar tag details..."
                  placeholderTextColor={placeholderColor}
                  value={description}
                  onChangeText={val => {
                    setDescription(val);
                    if (errors.description) clearError('description');
                  }}
                  textAlignVertical="top"
                />
                <View style={styles.textareaResizeCorner}>
                  <Feather name="corner-down-right" size={ms(10)} color="#9CA3AF" />
                </View>
              </View>
              {errors.description && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.description}</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 5:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 5 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>Where and when?</Text>

            {/* Locality */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Locality / Landmark <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.locality && styles.textInputError]}
                placeholder="e.g. Sector 18, near Central Park"
                placeholderTextColor={placeholderColor}
                value={locality}
                onChangeText={val => {
                  setLocality(val);
                  if (errors.locality) clearError('locality');
                }}
              />
              {errors.locality && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.locality}</Text>
                </View>
              )}
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                City <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.city && styles.textInputError]}
                placeholder="e.g. Gurgaon, Delhi, Bengaluru"
                placeholderTextColor={placeholderColor}
                value={city}
                onChangeText={val => {
                  setCity(val);
                  if (errors.city) clearError('city');
                }}
              />
              {errors.city && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.city}</Text>
                </View>
              )}
            </View>

            {/* State */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                State <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.stateRegion && styles.textInputError]}
                placeholder="e.g. Haryana, Delhi NCR, Karnataka"
                placeholderTextColor={placeholderColor}
                value={stateRegion}
                onChangeText={val => {
                  setStateRegion(val);
                  if (errors.stateRegion) clearError('stateRegion');
                }}
              />
              {errors.stateRegion && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.stateRegion}</Text>
                </View>
              )}
            </View>

            {/* Date lost */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {eventType === 'found' ? 'Date found' : eventType === 'rehome' ? 'Date available' : 'Date lost'}{' '}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.dateInputWrapper,
                  errors.dateLost && styles.textInputError,
                ]}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={placeholderColor}
                  value={dateLost}
                  onChangeText={val => {
                    setDateLost(val);
                    if (errors.dateLost) clearError('dateLost');
                  }}
                />
                <Feather
                  name="calendar"
                  size={ms(18)}
                  color={isDarkMode ? '#CBD5E1' : '#1F2937'}
                  style={styles.dateCalendarIcon}
                />
              </View>
              {errors.dateLost && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.dateLost}</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 6:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 6 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>How can people reach you?</Text>

            {/* Contact name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Contact name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.contactName && styles.textInputError]}
                placeholder="e.g. Rajesh Kumar"
                placeholderTextColor={placeholderColor}
                value={contactName}
                onChangeText={val => {
                  setContactName(val);
                  if (errors.contactName) clearError('contactName');
                }}
              />
              {errors.contactName && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.contactName}</Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Phone number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.contactPhone && styles.textInputError]}
                placeholder="e.g. 9876543210"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
                value={contactPhone}
                onChangeText={val => {
                  setContactPhone(val);
                  if (errors.contactPhone) clearError('contactPhone');
                }}
              />
              {errors.contactPhone && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.contactPhone}</Text>
                </View>
              )}
            </View>

            {/* Show number publicly checkbox */}
            <BouncyPressable
              style={styles.checkboxRow}
              activeScale={0.96}
              onPress={() => setShowPhonePublicly(prev => !prev)}>
              <View
                style={[
                  styles.checkboxSquare,
                  showPhonePublicly && styles.checkboxSquareActive,
                ]}>
                {showPhonePublicly && <Feather name="check" size={ms(12)} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Show this number publicly on my post. People can tap to see it and call me.
              </Text>
            </BouncyPressable>
          </View>
        );

      case 7:
        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 7 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>A private detail</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Private detail (Confidential verification) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.textareaWrapper,
                  errors.privateDetail && styles.textareaWrapperError,
                ]}>
                <TextInput
                  style={styles.privateTextareaInput}
                  multiline
                  numberOfLines={6}
                  placeholder="e.g. Small black spot behind the left ear, or inner collar has '987-PET' engraved..."
                  placeholderTextColor={placeholderColor}
                  value={privateDetail}
                  onChangeText={val => {
                    setPrivateDetail(val);
                    if (errors.privateDetail) clearError('privateDetail');
                  }}
                  textAlignVertical="top"
                />
                <View style={styles.textareaResizeCorner}>
                  <Feather name="corner-down-right" size={ms(10)} color="#9CA3AF" />
                </View>
              </View>
              {errors.privateDetail && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={ms(13)} color="#DC2626" />
                  <Text style={styles.errorText}>{errors.privateDetail}</Text>
                </View>
              )}
            </View>

            <Text style={styles.privateHelperText}>
              🔒 Strictly Private. Never shown publicly. When someone contacts you claiming they found or own this pet, ask them to describe this detail first.
            </Text>
          </View>
        );

      case 8: {
        const animalObj = ANIMALS.find(a => a.id === animal) || {
          label: animal.charAt(0).toUpperCase() + animal.slice(1),
          emoji: '🐾',
        };
        const currentHeroPhoto = photos[previewPhotoIndex] || photos[0] || SAMPLE_PET_PHOTOS[0];

        const eventBadgeConfig = {
          lost: {
            label: '🚨 LOST PET',
            bg: '#FFE4E6',
            text: '#E11D48',
            border: '#FDA4AF',
          },
          found: {
            label: '💚 FOUND PET',
            bg: '#CCFBF1',
            text: '#0D9488',
            border: '#5EEAD4',
          },
          rehome: {
            label: '💜 REHOME / ADOPT',
            bg: '#EDE9FE',
            text: '#7C3AED',
            border: '#C4B5FD',
          },
        }[eventType] || {
          label: 'PET POST',
          bg: '#F3F4F6',
          text: '#4B5563',
          border: '#E5E7EB',
        };

        const fullLocationText = [locality.trim(), city.trim(), stateRegion.trim()]
          .filter(Boolean)
          .join(', ');

        return (
          <View>
            <View style={styles.stepHeaderRow}>
              <View style={styles.sparkleIconBadge}>
                <Ionicons name="sparkles" size={ms(12)} color="#7C3AED" />
              </View>
              <Text style={styles.stepOverline}>STEP 8 OF {TOTAL_STEPS}</Text>
            </View>

            <Text style={styles.stepTitle}>Preview your post</Text>
            <Text style={styles.stepSubtitle}>
              Please verify all pet and contact details below before submitting.
            </Text>

            {/* ── 1. Hero Preview Card ── */}
            <View style={styles.previewHeroCard}>
              {/* Event Badge & Pet Name Header */}
              <View style={styles.previewHeroHeader}>
                <View
                  style={[
                    styles.previewEventPill,
                    {
                      backgroundColor: eventBadgeConfig.bg,
                      borderColor: eventBadgeConfig.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.previewEventPillText,
                      { color: eventBadgeConfig.text },
                    ]}>
                    {eventBadgeConfig.label}
                  </Text>
                </View>
                <View style={styles.previewDateBadge}>
                  <Feather name="calendar" size={ms(11)} color="#6B7280" />
                  <Text style={styles.previewDateText}>{dateLost}</Text>
                </View>
              </View>

              <Text style={styles.previewPetName}>
                {petName.trim() || 'Unnamed Pet'}
              </Text>
              <Text style={styles.previewPetSubtitle}>
                {animalObj.emoji} {animalObj.label} • {breed.trim()} • {sex} • {age.trim()}
              </Text>

              {/* Cover Photo */}
              <View style={styles.previewHeroImageWrapper}>
                <Image
                  source={{ uri: currentHeroPhoto }}
                  style={styles.previewHeroImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.7)']}
                  style={styles.previewHeroGradient}>
                  <View style={styles.previewHeroPhotoCounter}>
                    <Ionicons name="images" size={ms(12)} color="#FFFFFF" />
                    <Text style={styles.previewHeroPhotoCounterText}>
                      Photo {previewPhotoIndex + 1} of {Math.max(photos.length, 1)}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Photo Thumbnails Selector (if more than 1 photo) */}
              {photos.length > 1 && (
                <View style={styles.previewThumbRow}>
                  {photos.map((uri, idx) => {
                    const isSelected = idx === previewPhotoIndex;
                    return (
                      <Pressable
                        key={`thumb-${idx}`}
                        style={[
                          styles.previewThumbItem,
                          isSelected && styles.previewThumbItemActive,
                        ]}
                        onPress={() => setPreviewPhotoIndex(idx)}>
                        <Image source={{ uri }} style={styles.previewThumbImg} />
                        {idx === 0 && (
                          <View style={styles.previewThumbMainTag}>
                            <Text style={styles.previewThumbMainTagText}>Main</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── 2. Pet Profile & Physical Characteristics ── */}
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <View style={styles.previewCardHeaderIconBubble}>
                  <Ionicons name="paw" size={ms(14)} color="#7C3AED" />
                </View>
                <Text style={styles.previewCardTitle}>Pet Information</Text>
              </View>

              <View style={styles.previewGrid}>
                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>SPECIES</Text>
                  <Text style={styles.previewGridValue}>
                    {animalObj.emoji} {animalObj.label}
                  </Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>BREED</Text>
                  <Text style={styles.previewGridValue}>{breed.trim()}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>COLOUR & MARKINGS</Text>
                  <Text style={styles.previewGridValue}>{colour.trim()}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>SEX</Text>
                  <Text style={styles.previewGridValue}>{sex}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>AGE</Text>
                  <Text style={styles.previewGridValue}>{age.trim()}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>SIZE</Text>
                  <Text style={styles.previewGridValue}>{size}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>COLLAR</Text>
                  <Text style={styles.previewGridValue}>
                    {hasCollar ? '✓ Wearing Collar' : '✗ No Collar'}
                  </Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>MICROCHIP</Text>
                  <Text style={styles.previewGridValue}>{microchip}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>STERILISED</Text>
                  <Text style={styles.previewGridValue}>{sterilised}</Text>
                </View>

                <View style={styles.previewGridCol}>
                  <Text style={styles.previewGridLabel}>VACCINATED</Text>
                  <Text style={styles.previewGridValue}>{vaccinated}</Text>
                </View>
              </View>
            </View>

            {/* ── 3. Incident Location & Date ── */}
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <View style={styles.previewCardHeaderIconBubbleMint}>
                  <Ionicons name="location" size={ms(14)} color="#0D9488" />
                </View>
                <Text style={styles.previewCardTitle}>Location & Timeline</Text>
              </View>

              <View style={styles.previewLocationRow}>
                <Feather name="map-pin" size={ms(15)} color="#7C3AED" style={styles.previewMapPinIcon} />
                <View style={styles.flex1}>
                  <Text style={styles.previewLocationAddress}>
                    {fullLocationText || 'Location provided'}
                  </Text>
                  <Text style={styles.previewLocationDetail}>
                    Locality: {locality.trim()} • City: {city.trim()} • State: {stateRegion.trim()}
                  </Text>
                </View>
              </View>

              <View style={styles.previewDateRow}>
                <Feather name="clock" size={ms(14)} color="#6B7280" />
                <Text style={styles.previewDateRowText}>
                  {eventType === 'found' ? 'Found on:' : eventType === 'rehome' ? 'Available since:' : 'Lost on:'}{' '}
                  <Text style={styles.previewDateBold}>{dateLost}</Text>
                </Text>
              </View>
            </View>

            {/* ── 4. Pet Story / Description ── */}
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <View style={styles.previewCardHeaderIconBubbleAmber}>
                  <Ionicons name="document-text" size={ms(14)} color="#D97706" />
                </View>
                <Text style={styles.previewCardTitle}>Pet Description</Text>
              </View>

              <Text style={styles.previewDescriptionText}>
                {description.trim()}
              </Text>
            </View>

            {/* ── 5. Contact Information ── */}
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <View style={styles.previewCardHeaderIconBubbleBlue}>
                  <Ionicons name="call" size={ms(14)} color="#2563EB" />
                </View>
                <Text style={styles.previewCardTitle}>Contact Details</Text>
              </View>

              <View style={styles.previewContactItem}>
                <Text style={styles.previewContactLabel}>CONTACT PERSON</Text>
                <Text style={styles.previewContactValue}>{contactName.trim()}</Text>
              </View>

              <View style={styles.previewContactItem}>
                <Text style={styles.previewContactLabel}>PHONE NUMBER</Text>
                <Text style={styles.previewContactValue}>{contactPhone.trim()}</Text>
              </View>

              <View
                style={[
                  styles.previewPhoneVisibilityPill,
                  showPhonePublicly
                    ? styles.previewPhoneVisibilityPublic
                    : styles.previewPhoneVisibilityProtected,
                ]}>
                <Feather
                  name={showPhonePublicly ? 'eye' : 'lock'}
                  size={ms(12)}
                  color={showPhonePublicly ? '#059669' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.previewPhoneVisibilityText,
                    showPhonePublicly
                      ? styles.previewPhonePublicText
                      : styles.previewPhoneProtectedText,
                  ]}>
                  {showPhonePublicly
                    ? 'Publicly visible: Anyone can tap to call immediately'
                    : 'Protected: Hidden on post, only shared via verified app contact'}
                </Text>
              </View>
            </View>

            {/* ── 6. Confidential Private Detail ── */}
            <View style={styles.previewPrivateCard}>
              <View style={styles.previewPrivateHeader}>
                <View style={styles.previewPrivateLockBubble}>
                  <Feather name="lock" size={ms(13)} color="#FFFFFF" />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.previewPrivateTitle}>
                    Confidential Ownership Detail
                  </Text>
                  <Text style={styles.previewPrivateSubtitle}>
                    Secret • Never published on public post
                  </Text>
                </View>
              </View>

              <View style={styles.previewPrivateContentBox}>
                <Text style={styles.previewPrivateContentText}>
                  "{privateDetail.trim()}"
                </Text>
              </View>
            </View>

            {/* ── 7. Ready for API Sync Notice ── */}
            <View style={styles.previewApiBanner}>
              <View style={styles.previewApiCheckBubble}>
                <Feather name="check-circle" size={ms(18)} color="#0D9488" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.previewApiTitle}>All details verified!</Text>
                <Text style={styles.previewApiSubtitle}>
                  Data has been structured and validated. Tap 'Submit post' to post locally and prepare API sync.
                </Text>
              </View>
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  // ── Render Ultra-Premium Custom Alert / Warning Dialog ──
  const renderCustomAlert = () => {
    if (!customAlert) return null;

    const {
      type = 'warning',
      icon = 'alert-circle',
      iconFamily = 'Ionicons',
      iconGradient = ['#EF4444', '#DC2626'],
      badgeText = 'ATTENTION REQUIRED',
      badgeColor = '#FEF2F2',
      badgeTextColor = '#DC2626',
      title = 'Required Information',
      message = '',
      missingFields = [],
      primaryButtonText = 'Got It',
      buttonGradient = ['#2E008B', '#5B21B6', '#7C3AED'],
    } = customAlert;

    const IconComp = iconFamily === 'Feather' ? Feather : Ionicons;

    return (
      <View style={styles.alertOverlay}>
        <Pressable
          style={styles.alertBackdropPressable}
          onPress={() => hideCustomAlert()}
        />

        <Animated.View
          style={[
            styles.alertCardContainer,
            {
              opacity: alertOpacity,
              transform: [{ scale: alertScale }],
            },
          ]}>
          {/* Top Decorative Color Bar */}
          <LinearGradient
            colors={iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.alertTopBar}
          />

          {/* Close button (top right) */}
          <Pressable
            style={styles.alertCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => hideCustomAlert()}>
            <Feather name="x" size={ms(15)} color="#94A3B8" />
          </Pressable>

          <View style={styles.alertInnerContent}>
            {/* 3D Glowing Floating Icon */}
            <View style={styles.alertIconRingsWrapper}>
              <View
                style={[
                  styles.alertIconOuterRing,
                  { backgroundColor: `${iconGradient[0]}18` },
                ]}>
                <View
                  style={[
                    styles.alertIconMiddleRing,
                    { backgroundColor: `${iconGradient[0]}28` },
                  ]}>
                  <LinearGradient
                    colors={iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.alertIconCore}>
                    <IconComp name={icon} size={ms(26)} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </View>
            </View>

            {/* Badge chip */}
            <View style={[styles.alertBadgeChip, { backgroundColor: badgeColor }]}>
              <Text style={[styles.alertBadgeText, { color: badgeTextColor }]}>
                {badgeText}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.alertTitle}>{title}</Text>

            {/* Message */}
            <Text style={styles.alertMessage}>{message}</Text>

            {/* Missing Fields list chips */}
            {missingFields && missingFields.length > 0 && (
              <View style={styles.alertMissingList}>
                {missingFields.map((field, idx) => (
                  <View key={`missing-${idx}`} style={styles.alertFieldChip}>
                    <Ionicons name="alert-circle" size={ms(12)} color="#DC2626" />
                    <Text style={styles.alertFieldChipText}>{field}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action CTA Button */}
            <BouncyPressable
              style={styles.alertCtaWrapper}
              activeScale={0.94}
              onPress={() => hideCustomAlert()}>
              <LinearGradient
                colors={buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.alertCtaGradient}>
                <Text style={styles.alertCtaText}>{primaryButtonText}</Text>
                <Feather
                  name={type === 'success' ? 'check' : 'arrow-right'}
                  size={ms(15)}
                  color="#FFFFFF"
                  style={styles.alertCtaIcon}
                />
              </LinearGradient>
            </BouncyPressable>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBack}>
      <View style={styles.modalBackdrop}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
        />

        {/* 3D Floating Ambient Glowing Orbs */}
        <Animated.View
          style={[
            styles.ambientOrbTop,
            { transform: [{ translateY: orbDrift1 }] },
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.ambientOrbBottom,
            { transform: [{ translateY: orbDrift2 }] },
          ]}
          pointerEvents="none"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, s(12)),
                paddingBottom: Math.max(insets.bottom, s(20)),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Top Navigation & Status Bar */}
            <View style={styles.topHeaderBar}>
              <BouncyPressable
                style={styles.navRoundBtn}
                activeScale={0.88}
                onPress={handleBack}>
                <Feather name="arrow-left" size={ms(16)} color={isDarkMode ? '#FFFFFF' : '#1E0A3C'} />
              </BouncyPressable>

              <View style={styles.topBadgeChip}>
                <Text style={styles.topBadgeText}>COMMUNITY ALERT</Text>
              </View>

              <View style={styles.stepCounterPill}>
                <Text style={styles.stepCounterText}>
                  {currentStep} / {TOTAL_STEPS}
                </Text>
              </View>
            </View>

            {/* 8-Segment Symmetrical Progress Bar */}
            <View style={styles.progressBarWrapper}>
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
                const stepNum = index + 1;
                const isFilled = stepNum <= currentStep;
                return (
                  <View
                    key={`segment-${stepNum}`}
                    style={styles.segmentTrack}>
                    {isFilled ? (
                      <LinearGradient
                        colors={['#2E008B', '#6D28D9', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.segmentFilledGradient}
                      />
                    ) : (
                      <View style={styles.segmentEmpty} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* 3D Animated White Luxury Card Container */}
            <Animated.View
              style={[
                styles.wizardCard,
                {
                  opacity: cardOpacity,
                  transform: [
                    { perspective: 1200 },
                    { translateY: cardTranslateY },
                    { scale: cardScale },
                    { rotateX: cardRotateX },
                  ],
                },
              ]}>
              <Animated.View
                style={[
                  styles.cardContent,
                  {
                    opacity: stepOpacity,
                    transform: [
                      { perspective: 1000 },
                      { translateY: stepTranslateY },
                      { rotateY: stepRotateY },
                      { scale: stepScale },
                    ],
                  },
                ]}>
                {renderStepContent()}
              </Animated.View>

              {/* Bottom Navigation Buttons */}
              <View style={styles.cardBottomNav}>
                <BouncyPressable
                  style={styles.backButton}
                  activeScale={0.92}
                  onPress={handleBack}>
                  <Feather name="arrow-left" size={ms(14)} color={isDarkMode ? '#C4B5FD' : '#4B5563'} style={styles.backBtnIcon} />
                  <Text style={styles.backButtonText}>Back</Text>
                </BouncyPressable>

                <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                  <BouncyPressable
                    style={styles.continueButtonWrapper}
                    activeScale={0.95}
                    onPress={handleContinue}>
                    <LinearGradient
                      colors={['#2E008B', '#5B21B6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueButtonGradient}>
                      <Text style={styles.continueButtonText}>
                        {currentStep === TOTAL_STEPS ? 'Submit post' : 'Continue'}
                      </Text>
                      <Feather
                        name={currentStep === TOTAL_STEPS ? 'check' : 'arrow-right'}
                        size={ms(14)}
                        color="#FFFFFF"
                        style={styles.continueBtnIcon}
                      />
                    </LinearGradient>
                  </BouncyPressable>
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Ultra-Premium Custom Alert / Warning Dialog */}
        {renderCustomAlert()}
      </View>
    </Modal>
  );
};

const getStyles = isDarkMode =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0F071D' : '#FAF7F2',
    },
    ambientOrbTop: {
      position: 'absolute',
      top: -s(40),
      right: -s(40),
      width: s(240),
      height: s(240),
      borderRadius: s(120),
      backgroundColor: isDarkMode
        ? 'rgba(124, 58, 237, 0.20)'
        : 'rgba(224, 215, 254, 0.45)',
    },
    ambientOrbBottom: {
      position: 'absolute',
      bottom: s(60),
      left: -s(50),
      width: s(260),
      height: s(260),
      borderRadius: s(130),
      backgroundColor: isDarkMode
        ? 'rgba(237, 93, 39, 0.15)'
        : 'rgba(254, 235, 200, 0.40)',
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: s(16),
      flexGrow: 1,
    },

    // ── Top Bar with Status Counter ──
    topHeaderBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s(12),
    },
    navRoundBtn: {
      width: s(36),
      height: s(36),
      borderRadius: s(18),
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#3D1A6E' : '#ECE6DA',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    topBadgeChip: {
      backgroundColor: isDarkMode ? '#2B1252' : '#F3E8FF',
      paddingHorizontal: s(12),
      paddingVertical: s(5),
      borderRadius: s(12),
      borderWidth: 1,
      borderColor: isDarkMode ? '#6D28D9' : '#E9D5FF',
    },
    topBadgeText: {
      fontSize: ms(10),
      fontWeight: '800',
      color: isDarkMode ? '#E9D5FF' : '#6D28D9',
      letterSpacing: 0.8,
    },
    stepCounterPill: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      paddingHorizontal: s(12),
      paddingVertical: s(5),
      borderRadius: s(12),
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#3D1A6E' : '#ECE6DA',
    },
    stepCounterText: {
      fontSize: ms(11),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#4B5563',
    },

    // ── Progress Bar ──
    progressBarWrapper: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(5),
      marginBottom: s(14),
    },
    segmentTrack: {
      flex: 1,
      height: s(6),
      borderRadius: s(3),
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#250E45' : '#E4DEFC',
    },
    segmentFilledGradient: {
      flex: 1,
      borderRadius: s(3),
    },
    segmentEmpty: {
      flex: 1,
      backgroundColor: isDarkMode ? '#250E45' : '#E4DEFC',
    },

    // ── Main Wizard Card ──
    wizardCard: {
      backgroundColor: isDarkMode ? '#180B33' : '#FFFFFF',
      borderRadius: s(24),
      paddingHorizontal: s(18),
      paddingTop: s(22),
      paddingBottom: s(18),
      shadowColor: '#1E0054',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDarkMode ? 0.45 : 0.12,
      shadowRadius: 28,
      elevation: 9,
      borderWidth: 1,
      borderColor: isDarkMode ? '#33175E' : '#F0EBE3',
      borderTopWidth: 1.5,
      borderTopColor: isDarkMode ? '#6B21A8' : '#FFFFFF',
      borderBottomColor: isDarkMode ? '#100522' : '#DCD4C6',
      overflow: 'hidden',
      minHeight: s(490),
      justifyContent: 'space-between',
    },
    cardContent: {
      flex: 1,
    },
    stepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      marginBottom: s(6),
    },
    sparkleIconBadge: {
      width: s(20),
      height: s(20),
      borderRadius: s(10),
      backgroundColor: isDarkMode ? '#2B1252' : '#FAF5FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#6D28D9' : '#E9D5FF',
    },
    stepOverline: {
      fontSize: ms(11),
      fontWeight: '800',
      color: isDarkMode ? '#C084FC' : '#7C3AED',
      letterSpacing: 1.2,
    },
    stepTitle: {
      fontSize: ms(25),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1E0A3C',
      letterSpacing: -0.4,
      marginBottom: s(4),
    },
    stepSubtitle: {
      fontSize: ms(12.5),
      color: isDarkMode ? '#CBD5E1' : '#6B7280',
      lineHeight: ms(17),
      marginBottom: s(18),
    },

    // ── Step 1: What happened? ──
    step1CardsRow: {
      flexDirection: 'row',
      gap: s(6),
      marginBottom: s(16),
      width: '100%',
    },
    step1CardCol: {
      flex: 1,
      minWidth: 0,
    },
    step1Card: {
      width: '100%',
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderRadius: s(16),
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#381A6E' : '#E8E3DA',
      paddingVertical: s(14),
      paddingHorizontal: s(4),
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: s(175),
      position: 'relative',
    },
    step1CardActiveLost: {
      backgroundColor: isDarkMode ? '#2D0E23' : '#FFF1F2',
      borderColor: isDarkMode ? '#F43F5E' : '#E11D48',
      borderWidth: 2,
      borderBottomWidth: 3.5,
      borderBottomColor: isDarkMode ? '#E11D48' : '#BE123C',
      shadowColor: '#F43F5E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.35 : 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    step1CardActiveFound: {
      backgroundColor: isDarkMode ? '#260E47' : '#FAF5FF',
      borderColor: isDarkMode ? '#A855F7' : '#7C3AED',
      borderWidth: 2,
      borderBottomWidth: 3.5,
      borderBottomColor: isDarkMode ? '#7C3AED' : '#5B21B6',
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.35 : 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    step1CardActiveAdopt: {
      backgroundColor: isDarkMode ? '#0E281F' : '#F0FDF4',
      borderColor: isDarkMode ? '#10B981' : '#059669',
      borderWidth: 2,
      borderBottomWidth: 3.5,
      borderBottomColor: isDarkMode ? '#059669' : '#047857',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.35 : 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    step1CardActive: {
      backgroundColor: isDarkMode ? '#260E47' : '#FAF5FF',
      borderColor: '#7C3AED',
      borderWidth: 2,
      borderBottomWidth: 3.5,
      borderBottomColor: isDarkMode ? '#A78BFA' : '#5B21B6',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    cardCheckCircle: {
      position: 'absolute',
      top: s(5),
      right: s(5),
      width: s(16),
      height: s(16),
      borderRadius: s(8),
      backgroundColor: '#7C3AED',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    cardCheckCircleLost: {
      backgroundColor: '#E11D48',
    },
    cardCheckCircleFound: {
      backgroundColor: '#7C3AED',
    },
    cardCheckCircleAdopt: {
      backgroundColor: '#059669',
    },
    step1IconWrapper: {
      height: s(64),
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    medallionBackdrop: {
      width: s(52),
      height: s(52),
      borderRadius: s(26),
      backgroundColor: isDarkMode ? '#29124E' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#472183' : '#EDE7DC',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    circleSilhouette: {
      width: s(34),
      height: s(34),
      borderRadius: s(17),
      backgroundColor: isDarkMode ? '#C4B5FD' : '#1E0A3C',
    },
    beaconRing: {
      position: 'absolute',
      width: s(62),
      height: s(62),
      borderRadius: s(31),
      borderWidth: 2,
      borderColor: isDarkMode ? '#F43F5E' : '#E11D48',
    },
    cardTextWrapper: {
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: s(2),
    },
    step1CardText: {
      fontSize: ms(11),
      fontWeight: '700',
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
      textAlign: 'center',
      lineHeight: ms(15),
      marginBottom: s(6),
    },
    step1CardTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    cardTypePill: {
      paddingHorizontal: s(7),
      paddingVertical: s(3),
      borderRadius: s(6),
    },
    pillLostActive: {
      backgroundColor: '#E11D48',
    },
    pillLostInactive: {
      backgroundColor: isDarkMode ? '#301320' : '#F3F4F6',
    },
    pillTextLostActive: {
      fontSize: ms(9),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pillTextLostInactive: {
      fontSize: ms(9),
      fontWeight: '700',
      color: isDarkMode ? '#FDA4AF' : '#6B7280',
    },
    pillFoundActive: {
      backgroundColor: '#7C3AED',
    },
    pillFoundInactive: {
      backgroundColor: isDarkMode ? '#29134A' : '#F3F4F6',
    },
    pillTextFoundActive: {
      fontSize: ms(9),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pillTextFoundInactive: {
      fontSize: ms(9),
      fontWeight: '700',
      color: isDarkMode ? '#DDD6FE' : '#6B7280',
    },
    pillAdoptActive: {
      backgroundColor: '#059669',
    },
    pillAdoptInactive: {
      backgroundColor: isDarkMode ? '#132C23' : '#F3F4F6',
    },
    pillTextAdoptActive: {
      fontSize: ms(9),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pillTextAdoptInactive: {
      fontSize: ms(9),
      fontWeight: '700',
      color: isDarkMode ? '#A7F3D0' : '#6B7280',
    },

    // ── Luxury Trust Banner ──
    luxuryPledgeBanner: {
      backgroundColor: isDarkMode ? '#200D42' : '#FAF5FF',
      borderRadius: s(14),
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#3D1D75' : '#E9D5FF',
      padding: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
      marginTop: s(4),
    },
    pledgeShieldIconSquircle: {
      width: s(34),
      height: s(34),
      borderRadius: s(11),
      backgroundColor: isDarkMode ? '#2E125B' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode ? '#5B21B6' : '#DDD6FE',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pledgeTextCol: {
      flex: 1,
    },
    pledgeTitle: {
      fontSize: ms(12.5),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#4C1D95',
      marginBottom: s(1),
    },
    pledgeSubtitle: {
      fontSize: ms(11),
      color: isDarkMode ? '#C4B5FD' : '#6D28D9',
    },

    // ── Step 2: Which animal? ──
    animalsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: s(10),
      marginBottom: s(20),
    },
    animalCardCol: {
      width: '48.5%',
    },
    animalCard: {
      width: '100%',
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderRadius: s(16),
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E8E3DA',
      paddingVertical: s(16),
      paddingHorizontal: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      position: 'relative',
    },
    animalCardActive: {
      backgroundColor: isDarkMode ? '#2D1054' : '#FAF5FF',
      borderColor: '#7C3AED',
      borderWidth: 2,
      borderBottomWidth: 3,
      borderBottomColor: isDarkMode ? '#A78BFA' : '#5B21B6',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    animalEmoji: {
      fontSize: ms(20),
    },
    animalCardText: {
      fontSize: ms(14),
      fontWeight: '700',
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
      flex: 1,
    },
    animalCardTextActive: {
      color: isDarkMode ? '#FFFFFF' : '#1E0A3C',
      fontWeight: '800',
    },
    animalCheckBadge: {
      width: s(16),
      height: s(16),
      borderRadius: s(8),
      backgroundColor: '#7C3AED',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ── Step 3: Photos ──
    photoSourceRow: {
      flexDirection: 'row',
      gap: s(12),
      marginBottom: s(16),
      width: '100%',
    },
    photoSourceCol: {
      flex: 1,
      minWidth: 0,
    },
    photoSourceCardCamera: {
      width: '100%',
      minHeight: s(128),
      backgroundColor: isDarkMode ? '#261047' : '#FAF5FF',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#3B1D6E' : '#E9D5FF',
      borderRadius: s(18),
      paddingVertical: s(18),
      paddingHorizontal: s(10),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    photoSourceCardGallery: {
      width: '100%',
      minHeight: s(128),
      backgroundColor: isDarkMode ? '#132824' : '#F0FDF4',
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#065F46' : '#BBF7D0',
      borderRadius: s(18),
      paddingVertical: s(18),
      paddingHorizontal: s(10),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    photoSourceIconSquircleCamera: {
      width: s(50),
      height: s(50),
      borderRadius: s(16),
      backgroundColor: isDarkMode ? '#341561' : '#EDE9FE',
      borderWidth: 1,
      borderColor: isDarkMode ? '#4C1D95' : '#DDD6FE',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: s(10),
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2,
    },
    photoSourceIconSquircleGallery: {
      width: s(50),
      height: s(50),
      borderRadius: s(16),
      backgroundColor: isDarkMode ? '#1B3D34' : '#DCFCE7',
      borderWidth: 1,
      borderColor: isDarkMode ? '#059669' : '#BBF7D0',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: s(10),
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2,
    },
    photoSourceTextGroup: {
      alignItems: 'center',
    },
    photoSourceTitle: {
      fontSize: ms(13.5),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
      textAlign: 'center',
      lineHeight: ms(18),
    },
    photoSourceSubtitle: {
      fontSize: ms(11),
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      fontWeight: '600',
      marginTop: s(2),
      textAlign: 'center',
    },
    photoEmptyCard: {
      backgroundColor: isDarkMode ? '#200D42' : '#FAF8F5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#EFEBE4',
      borderRadius: s(16),
      paddingVertical: s(24),
      paddingHorizontal: s(16),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: s(16),
    },
    photoEmptyIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
      marginBottom: s(10),
    },
    photoEmptyIconBubble: {
      width: s(38),
      height: s(38),
      borderRadius: s(19),
      backgroundColor: isDarkMode ? '#2A1254' : '#F3E8FF',
      borderWidth: 1,
      borderColor: isDarkMode ? '#4C1D95' : '#E9D5FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoEmptyIconBubbleMint: {
      width: s(38),
      height: s(38),
      borderRadius: s(19),
      backgroundColor: isDarkMode ? '#16332B' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#059669' : '#A7F3D0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoEmptyDivider: {
      fontSize: ms(12),
      color: isDarkMode ? '#64748B' : '#9CA3AF',
      fontWeight: '600',
    },
    photoEmptyTitle: {
      fontSize: ms(14),
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
      marginBottom: s(4),
    },
    photoEmptySubtitle: {
      fontSize: ms(12),
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      textAlign: 'center',
      lineHeight: ms(16),
      maxWidth: '90%',
    },
    photosPreviewSection: {
      marginBottom: s(16),
    },
    photosCountHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: s(8),
    },
    photosCountText: {
      fontSize: ms(12),
      fontWeight: '700',
      color: isDarkMode ? '#C4B5FD' : '#4B5563',
    },
    photosAddMoreLink: {
      fontSize: ms(12),
      fontWeight: '700',
      color: isDarkMode ? '#A78BFA' : '#7C3AED',
    },
    photosCountLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    photosCountRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
    },
    photosClearAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      backgroundColor: isDarkMode ? '#3B1219' : '#FEF2F2',
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      borderRadius: s(8),
      borderWidth: 1,
      borderColor: isDarkMode ? '#881337' : '#FEE2E2',
    },
    photosClearAllText: {
      fontSize: ms(11),
      fontWeight: '700',
      color: '#EF4444',
    },
    photosAddMoreBtn: {
      paddingVertical: s(4),
    },
    photosPreviewRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    photoThumbWrapper: {
      width: s(84),
      height: s(84),
      position: 'relative',
      marginRight: s(12),
      marginBottom: s(12),
      overflow: 'visible',
    },
    photoThumbContainer: {
      width: '100%',
      height: '100%',
      borderRadius: s(16),
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 2,
      borderColor: isDarkMode ? '#3B1D6E' : '#FFFFFF',
      backgroundColor: isDarkMode ? '#200D42' : '#F1F5F9',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    photoThumbImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    primaryPhotoBadge: {
      position: 'absolute',
      bottom: s(4),
      left: s(4),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(6),
      paddingVertical: s(2),
      borderRadius: s(6),
    },
    primaryPhotoStar: {
      marginRight: s(2),
    },
    primaryPhotoBadgeText: {
      color: '#FFFFFF',
      fontSize: ms(8),
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    photoDeleteFloatingBtn: {
      position: 'absolute',
      top: -s(7),
      right: -s(7),
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      borderWidth: 2,
      borderColor: isDarkMode ? '#170A2E' : '#FFFFFF',
      zIndex: 50,
      elevation: 12,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 6,
      overflow: 'hidden',
    },
    photoDeleteFloatingBtnPressed: {
      transform: [{ scale: 0.88 }],
    },
    photoDeleteFloatingGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoAddSlotBtn: {
      width: s(84),
      height: s(84),
      borderRadius: s(16),
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#4C1D95' : '#DDD6FE',
      backgroundColor: isDarkMode ? '#261047' : '#FAF5FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: s(12),
    },
    photoAddSlotInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoAddSlotIconCircle: {
      width: s(28),
      height: s(28),
      borderRadius: s(14),
      backgroundColor: isDarkMode ? '#341561' : '#EDE9FE',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: s(2),
    },
    photoAddSlotText: {
      fontSize: ms(10),
      fontWeight: '700',
      color: isDarkMode ? '#C4B5FD' : '#7C3AED',
    },
    photosDeleteHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2D1217' : '#FEF2F2',
      borderRadius: s(10),
      borderWidth: 1,
      borderColor: isDarkMode ? '#5B1522' : '#FEE2E2',
      paddingHorizontal: s(10),
      paddingVertical: s(7),
      marginTop: s(4),
      gap: s(6),
    },
    photosDeleteHintIconCircle: {
      width: s(22),
      height: s(22),
      borderRadius: s(11),
      backgroundColor: isDarkMode ? '#3F1820' : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photosDeleteHintText: {
      fontSize: ms(11),
      color: isDarkMode ? '#FCA5A5' : '#991B1B',
      fontWeight: '600',
      flex: 1,
      lineHeight: ms(15),
    },

    // ── Step 4 & 5 Common Input Groups ──
    inputGroup: {
      marginBottom: s(16),
    },
    inputLabel: {
      fontSize: ms(13),
      fontWeight: '700',
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
      marginBottom: s(8),
    },
    textInput: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      fontSize: ms(14),
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    segmentRow: {
      flexDirection: 'row',
      gap: s(8),
      width: '100%',
    },
    segmentBtnCol: {
      flex: 1,
      minWidth: 0,
    },
    segmentBtn: {
      width: '100%',
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E8E3DA',
      borderRadius: s(14),
      paddingVertical: s(13),
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentBtnActive: {
      backgroundColor: isDarkMode ? '#2D1054' : '#FAF5FF',
      borderColor: '#7C3AED',
      borderWidth: 2,
      borderBottomWidth: 3,
      borderBottomColor: isDarkMode ? '#A78BFA' : '#5B21B6',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 3,
    },
    segmentBtnText: {
      fontSize: ms(14),
      fontWeight: '700',
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
    },
    segmentBtnTextActive: {
      color: isDarkMode ? '#FFFFFF' : '#1E0A3C',
      fontWeight: '800',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: s(16),
      marginTop: s(6),
    },
    checkboxSquare: {
      width: s(20),
      height: s(20),
      borderRadius: s(5),
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#6D28D9' : '#9CA3AF',
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: s(10),
      marginTop: s(1),
    },
    checkboxSquareActive: {
      backgroundColor: isDarkMode ? '#7C3AED' : '#2E008B',
      borderColor: isDarkMode ? '#7C3AED' : '#2E008B',
    },
    checkboxLabel: {
      flex: 1,
      fontSize: ms(13),
      color: isDarkMode ? '#E2E8F0' : '#1F2937',
      fontWeight: '600',
      lineHeight: ms(18),
    },
    dropdownSelector: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownSelectorText: {
      fontSize: ms(14),
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
      fontWeight: '500',
    },
    dropdownMenu: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      marginTop: s(4),
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 3,
    },
    dropdownMenuItem: {
      paddingVertical: s(11),
      paddingHorizontal: s(14),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#2F135B' : '#F3F4F6',
    },
    dropdownMenuItemActive: {
      backgroundColor: isDarkMode ? '#2D1054' : '#FAF5FF',
    },
    dropdownMenuText: {
      fontSize: ms(13),
      color: isDarkMode ? '#CBD5E1' : '#374151',
      fontWeight: '500',
    },
    dropdownMenuTextActive: {
      color: isDarkMode ? '#C4B5FD' : '#2E008B',
      fontWeight: '700',
    },
    textareaWrapper: {
      position: 'relative',
    },
    textareaInput: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      minHeight: s(100),
      fontSize: ms(14),
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    textareaResizeCorner: {
      position: 'absolute',
      bottom: s(6),
      right: s(6),
      opacity: 0.5,
    },

    // ── Step 5: Where and When ──
    dateInputWrapper: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(14),
    },
    dateInput: {
      flex: 1,
      paddingVertical: s(12),
      fontSize: ms(14),
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    dateCalendarIcon: {
      marginLeft: s(8),
    },

    // ── Step 7: A private detail ──
    privateTextareaInput: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFDF9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#E5E7EB',
      borderRadius: s(12),
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      minHeight: s(130),
      fontSize: ms(14),
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    privateHelperText: {
      fontSize: ms(13),
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      lineHeight: ms(18),
      marginTop: s(10),
      marginBottom: s(12),
    },

    // ── Validation Error Styles ──
    requiredStar: {
      color: '#DC2626',
      fontWeight: '800',
      fontSize: ms(13),
    },
    textInputError: {
      borderColor: '#EF4444',
      borderWidth: 1.5,
      backgroundColor: isDarkMode ? '#2D1217' : '#FEF2F2',
    },
    textareaWrapperError: {
      borderColor: '#EF4444',
      borderWidth: 1.5,
      borderRadius: s(12),
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(5),
      marginTop: s(5),
      paddingHorizontal: s(2),
    },
    errorText: {
      fontSize: ms(11.5),
      fontWeight: '700',
      color: '#DC2626',
    },
    photoErrorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      backgroundColor: isDarkMode ? '#2D1217' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#5B1522' : '#FCA5A5',
      borderRadius: s(12),
      paddingHorizontal: s(12),
      paddingVertical: s(10),
      marginBottom: s(14),
    },
    photoErrorText: {
      flex: 1,
      fontSize: ms(12),
      fontWeight: '700',
      color: '#B91C1C',
    },

    // ── Step 8: Rich Preview Section Styles ──
    previewHeroCard: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      borderRadius: s(18),
      padding: s(14),
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#EFEBE4',
      marginBottom: s(12),
      shadowColor: '#1E0A3C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    previewHeroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: s(8),
    },
    previewEventPill: {
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(8),
      borderWidth: 1,
    },
    previewEventPillText: {
      fontSize: ms(10),
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    previewDateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      backgroundColor: isDarkMode ? '#261047' : '#F3F4F6',
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      borderRadius: s(6),
    },
    previewDateText: {
      fontSize: ms(10.5),
      fontWeight: '600',
      color: isDarkMode ? '#CBD5E1' : '#4B5563',
    },
    previewPetName: {
      fontSize: ms(20),
      fontWeight: '900',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      letterSpacing: -0.3,
      marginBottom: s(2),
    },
    previewPetSubtitle: {
      fontSize: ms(12.5),
      fontWeight: '600',
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      marginBottom: s(12),
    },
    previewHeroImageWrapper: {
      width: '100%',
      height: s(180),
      borderRadius: s(14),
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: isDarkMode ? '#261047' : '#FAF5FF',
    },
    previewHeroImage: {
      width: '100%',
      height: '100%',
    },
    previewHeroGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: s(50),
      justifyContent: 'flex-end',
      padding: s(8),
    },
    previewHeroPhotoCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      alignSelf: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      paddingHorizontal: s(8),
      paddingVertical: s(3),
      borderRadius: s(6),
    },
    previewHeroPhotoCounterText: {
      fontSize: ms(10),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    previewThumbRow: {
      flexDirection: 'row',
      gap: s(8),
      marginTop: s(10),
    },
    previewThumbItem: {
      width: s(52),
      height: s(52),
      borderRadius: s(10),
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    previewThumbItemActive: {
      borderColor: '#7C3AED',
    },
    previewThumbImg: {
      width: '100%',
      height: '100%',
    },
    previewThumbMainTag: {
      position: 'absolute',
      bottom: s(1),
      left: s(1),
      backgroundColor: '#7C3AED',
      paddingHorizontal: s(3),
      borderRadius: s(3),
    },
    previewThumbMainTagText: {
      fontSize: ms(7.5),
      fontWeight: '800',
      color: '#FFFFFF',
    },

    previewCard: {
      backgroundColor: isDarkMode ? '#200D42' : '#FFFFFF',
      borderRadius: s(16),
      padding: s(14),
      borderWidth: 1,
      borderColor: isDarkMode ? '#381A6E' : '#EFEBE4',
      marginBottom: s(12),
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    previewCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      marginBottom: s(12),
      paddingBottom: s(8),
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#261047' : '#F3F4F6',
    },
    previewCardHeaderIconBubble: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: isDarkMode ? '#261047' : '#F3E8FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCardHeaderIconBubbleMint: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: isDarkMode ? '#132824' : '#ECFDF5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCardHeaderIconBubbleAmber: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: isDarkMode ? '#2E2211' : '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCardHeaderIconBubbleBlue: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: isDarkMode ? '#12203A' : '#EFF6FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewCardTitle: {
      fontSize: ms(13.5),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },

    previewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: s(10),
      columnGap: s(10),
    },
    previewGridCol: {
      width: '47.5%',
      backgroundColor: isDarkMode ? '#170A2E' : '#FAF8F5',
      borderRadius: s(10),
      paddingVertical: s(8),
      paddingHorizontal: s(10),
      borderWidth: 1,
      borderColor: isDarkMode ? '#261047' : '#F0ECE4',
    },
    previewGridLabel: {
      fontSize: ms(9),
      fontWeight: '700',
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      letterSpacing: 0.6,
      marginBottom: s(2),
    },
    previewGridValue: {
      fontSize: ms(12.5),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },

    previewLocationRow: {
      flexDirection: 'row',
      gap: s(8),
      marginBottom: s(10),
    },
    previewLocationAddress: {
      fontSize: ms(13.5),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
      lineHeight: ms(18),
    },
    previewLocationDetail: {
      fontSize: ms(11.5),
      fontWeight: '500',
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      marginTop: s(2),
    },
    previewDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      backgroundColor: isDarkMode ? '#170A2E' : '#F9FAFB',
      borderRadius: s(8),
      paddingHorizontal: s(10),
      paddingVertical: s(6),
    },
    previewDateRowText: {
      fontSize: ms(12),
      color: isDarkMode ? '#CBD5E1' : '#4B5563',
    },

    previewDescriptionText: {
      fontSize: ms(13),
      lineHeight: ms(19),
      color: isDarkMode ? '#E2E8F0' : '#374151',
      backgroundColor: isDarkMode ? '#170A2E' : '#FAF8F5',
      borderRadius: s(10),
      padding: s(10),
      borderWidth: 1,
      borderColor: isDarkMode ? '#261047' : '#F0ECE4',
      fontStyle: 'italic',
    },

    previewContactItem: {
      marginBottom: s(8),
    },
    previewContactLabel: {
      fontSize: ms(9),
      fontWeight: '700',
      color: isDarkMode ? '#94A3B8' : '#6B7280',
      letterSpacing: 0.6,
      marginBottom: s(2),
    },
    previewContactValue: {
      fontSize: ms(14),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    previewPhoneVisibilityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
      paddingHorizontal: s(10),
      paddingVertical: s(7),
      borderRadius: s(8),
      marginTop: s(4),
    },
    previewPhoneVisibilityPublic: {
      backgroundColor: isDarkMode ? '#132824' : '#ECFDF5',
      borderWidth: 1,
      borderColor: isDarkMode ? '#065F46' : '#A7F3D0',
    },
    previewPhoneVisibilityProtected: {
      backgroundColor: isDarkMode ? '#170A2E' : '#F3F4F6',
      borderWidth: 1,
      borderColor: isDarkMode ? '#261047' : '#E5E7EB',
    },
    previewPhoneVisibilityText: {
      fontSize: ms(11),
      fontWeight: '700',
      flex: 1,
    },

    previewPrivateCard: {
      backgroundColor: isDarkMode ? '#1A0B36' : '#1E1B4B',
      borderRadius: s(16),
      padding: s(14),
      marginBottom: s(12),
      shadowColor: '#1E1B4B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? '#3D1A6E' : 'transparent',
    },
    previewPrivateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      marginBottom: s(10),
    },
    previewPrivateLockBubble: {
      width: s(26),
      height: s(26),
      borderRadius: s(13),
      backgroundColor: isDarkMode ? '#341561' : '#4338CA',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewPrivateTitle: {
      fontSize: ms(13),
      fontWeight: '800',
      color: '#FFFFFF',
    },
    previewPrivateSubtitle: {
      fontSize: ms(10),
      fontWeight: '600',
      color: '#A5B4FC',
    },
    previewPrivateContentBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: s(10),
      padding: s(10),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    previewPrivateContentText: {
      fontSize: ms(12.5),
      color: '#E0E7FF',
      fontStyle: 'italic',
      lineHeight: ms(17),
    },

    previewApiBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
      backgroundColor: isDarkMode ? '#0F261E' : '#F0FDF4',
      borderWidth: 1,
      borderColor: isDarkMode ? '#059669' : '#BBF7D0',
      borderRadius: s(14),
      padding: s(12),
      marginBottom: s(6),
    },
    previewApiCheckBubble: {
      width: s(32),
      height: s(32),
      borderRadius: s(16),
      backgroundColor: isDarkMode ? '#164E3D' : '#DCFCE7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewApiTitle: {
      fontSize: ms(12.5),
      fontWeight: '800',
      color: isDarkMode ? '#34D399' : '#15803D',
      marginBottom: s(1),
    },
    previewApiSubtitle: {
      fontSize: ms(11),
      fontWeight: '500',
      color: isDarkMode ? '#A7F3D0' : '#166534',
      lineHeight: ms(15),
    },

    // ── Bottom Navigation ──
    cardBottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: s(20),
      paddingTop: s(8),
      borderTopWidth: 0,
      borderTopColor: 'transparent',
    },
    backButton: {
      paddingVertical: s(10),
      paddingHorizontal: s(10),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
    },
    backBtnIcon: {
      marginRight: s(2),
    },
    backButtonText: {
      fontSize: ms(15),
      fontWeight: '700',
      color: isDarkMode ? '#CBD5E1' : '#4B5563',
    },
    continueButtonWrapper: {
      borderRadius: s(22),
      overflow: 'hidden',
      shadowColor: '#2E008B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    continueButtonGradient: {
      paddingHorizontal: s(24),
      paddingVertical: s(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    continueButtonText: {
      fontSize: ms(14),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    continueBtnIcon: {
      marginLeft: s(2),
    },
    flex1: {
      flex: 1,
    },
    previewMapPinIcon: {
      marginTop: s(2),
    },
    previewDateBold: {
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#1F2937',
    },
    previewPhonePublicText: {
      color: '#059669',
    },
    previewPhoneProtectedText: {
      color: isDarkMode ? '#94A3B8' : '#4B5563',
    },

    // ── Ultra-Premium Custom Alert Styles ──
    alertOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99999,
      elevation: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertBackdropPressable: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
    },
    alertCardContainer: {
      width: '88%',
      maxWidth: s(340),
      backgroundColor: isDarkMode ? '#180B33' : '#FFFFFF',
      borderRadius: s(26),
      overflow: 'hidden',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.28,
      shadowRadius: 28,
      elevation: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#3D1A6E' : 'rgba(255, 255, 255, 0.95)',
    },
    alertTopBar: {
      height: s(5),
      width: '100%',
    },
    alertCloseBtn: {
      position: 'absolute',
      top: s(12),
      right: s(12),
      width: s(30),
      height: s(30),
      borderRadius: s(15),
      backgroundColor: isDarkMode ? '#200D42' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    alertInnerContent: {
      paddingTop: s(22),
      paddingBottom: s(22),
      paddingHorizontal: s(22),
      alignItems: 'center',
    },
    alertIconRingsWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: s(14),
    },
    alertIconOuterRing: {
      width: s(76),
      height: s(76),
      borderRadius: s(38),
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertIconMiddleRing: {
      width: s(62),
      height: s(62),
      borderRadius: s(31),
      alignItems: 'center',
      justifyContent: 'center',
    },
    alertIconCore: {
      width: s(50),
      height: s(50),
      borderRadius: s(25),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
    alertBadgeChip: {
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(16),
      marginBottom: s(10),
    },
    alertBadgeText: {
      fontSize: ms(10),
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    alertTitle: {
      fontSize: ms(18),
      fontWeight: '800',
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: s(6),
    },
    alertMessage: {
      fontSize: ms(13),
      fontWeight: '500',
      color: isDarkMode ? '#94A3B8' : '#64748B',
      textAlign: 'center',
      lineHeight: ms(18),
      paddingHorizontal: s(4),
    },
    alertMissingList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: s(6),
      marginTop: s(12),
      width: '100%',
    },
    alertFieldChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      backgroundColor: isDarkMode ? '#2D1217' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#5B1522' : '#FECACA',
      borderRadius: s(8),
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    alertFieldChipText: {
      fontSize: ms(11),
      fontWeight: '700',
      color: '#B91C1C',
    },
    alertCtaWrapper: {
      width: '100%',
      borderRadius: s(16),
      overflow: 'hidden',
      marginTop: s(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    alertCtaGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: s(13),
      paddingHorizontal: s(16),
      gap: s(6),
    },
    alertCtaText: {
      fontSize: ms(14),
      fontWeight: '700',
      color: '#FFFFFF',
    },
    alertCtaIcon: {
      marginLeft: s(2),
    },
  });
