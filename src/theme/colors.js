export const colors = {
  primary: '#7B2CFF', // Purple (rgb(123, 44, 255))
  primaryDark: 'rgb(59, 16, 143)', // Deep Purple (#3B108F)
  primaryLight: '#A26BFF', // Light Purple
  primaryGradient: ['rgb(59, 16, 143)', 'rgb(123, 44, 255)'],
  secondary: '#ED5D27', // Bright Orange
  secondaryDark: '#C94717', // Darker Orange
  secondaryLight: '#F58A62',
  background: '#FAF7F2', // Warm Cream (Home screen standard)
  surface: '#FFFFFF', // White
  text: '#1C1C1C',
  textSecondary: '#6A6A6A',
  border: '#E8E5DF',
  error: '#D63031',
  success: '#00B894',
  warning: '#FDCB6E',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.55)',

  // ── Obsidian & Midnight Luxury Dark Palette (Matching Profile) ──
  dark: {
    background: '#0F071D',
    backgroundElevated: '#17092E',
    surface: '#1E0E38',
    surfaceSubtle: '#170A2E',
    border: '#2E1654',
    borderSubtle: '#260F45',
    borderBottom: '#180B2E',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    accent: '#7C3AED',
    accentLight: '#A855F7',
    cardShadow: '#000000',
  },

  // ── 3D Card Shadows & Borders ──
  card3D: {
    borderTop: '#FFFFFF',
    borderSides: '#F3EFE6',
    borderBottom: '#DCD4C6',
    shadow: '#2B1A4A',
    shadowLight: 'rgba(43, 26, 74, 0.08)',
  },

  // ── Ambient Background Glows & Watermarks ──
  ambient: {
    glowPurple: 'rgba(233, 213, 255, 0.45)',
    glowPeach: 'rgba(254, 240, 215, 0.40)',
    glowMagenta: 'rgba(252, 231, 243, 0.45)',
    glowLavender: 'rgba(245, 230, 255, 0.45)',
    pawWatermark: 'rgba(220, 38, 103, 0.035)',
    pawWatermarkPurple: 'rgba(123, 44, 255, 0.035)',
    sheenGradient: [
      'rgba(255, 255, 255, 0)',
      'rgba(255, 255, 255, 0.22)',
      'rgba(255, 255, 255, 0)',
    ],
  },

  // ── Reunite & Community Care Palette ──
  reunite: {
    // Navigation & Common Typography
    navBarBg: '#FFFFFF',
    navBtnBg: '#F8F5EE',
    navBtnBorder: '#ECE6DA',
    navBtnIcon: '#1E1035',
    overline: '#8E8299',
    titleDark: '#1E1035',
    textMuted: '#6B7280',
    textLightMuted: '#9CA3AF',
    heartInactive: '#6B7280',
    heartActive: '#E11D48',

    // Hero Banner Card (Vibrant Magenta to Royal Purple matching reference)
    heroGradient: ['#E11D48', '#C026D3', '#7C3AED'],
    heroBevelTop: 'rgba(255, 255, 255, 0.40)',
    heroBevelBottom: '#5B17C4',
    heroShadow: '#E11D48',
    heroRings: 'rgba(255, 255, 255, 0.12)',
    heroGlassHeartBg: 'rgba(255, 255, 255, 0.18)',
    heroGlassHeartBorder: 'rgba(255, 255, 255, 0.35)',
    heroSparkleBadgeBg: '#FBBF24',
    heroSparkleBadgeBorder: '#BE185D',
    heroSparkleIcon: '#78350F',
    heroOverline: 'rgba(255, 255, 255, 0.85)',
    heroTitle: '#FFFFFF',
    heroSubtitle: 'rgba(255, 255, 255, 0.90)',
    heroPillBg: 'rgba(255, 255, 255, 0.18)',
    heroPillBorder: 'rgba(255, 255, 255, 0.28)',
    heroPillText: '#FFFFFF',

    // Card 1: Lost Pet
    lostGradient: ['#E11D48', '#BE185D'],
    lostBevelTop: 'rgba(255, 255, 255, 0.40)',
    lostBevelBottom: '#881337',
    lostShadow: '#BE185D',
    lostIconBg: '#FFFFFF',
    lostIconColor: '#E11D48',
    lostTitle: '#FFFFFF',
    lostSubtitle: 'rgba(255, 255, 255, 0.92)',
    lostArrowBg: 'rgba(255, 255, 255, 0.90)',
    lostArrowIcon: '#E11D48',

    // Card 2: Found Pet
    foundBg: '#F5F3FF',
    foundBevelTop: '#FFFFFF',
    foundBorder: '#DDD6FE',
    foundBevelBottom: '#C4B5FD',
    foundShadow: '#7C3AED',
    foundIconBg: '#FFFFFF',
    foundIconColor: '#6D28D9',
    foundTitle: '#4C1D95',
    foundSubtitle: '#6D28D9',
    foundArrowBg: '#FFFFFF',
    foundArrowIcon: '#6D28D9',

    // Card 3: Adopt or Rehome
    adoptBg: '#E8F8F0',
    adoptBevelTop: '#FFFFFF',
    adoptBorder: '#BBF7D0',
    adoptBevelBottom: '#86EFAC',
    adoptShadow: '#059669',
    adoptIconBg: '#FFFFFF',
    adoptIconColor: '#059669',
    adoptTitle: '#065F46',
    adoptSubtitle: '#047857',
    adoptArrowBg: '#FFFFFF',
    adoptArrowIcon: '#059669',

    // Filter Tabs & Location Row
    locationChange: '#E11D48',
    tabTrack: '#F1ECE5',
    tabActiveBg: '#FFFFFF',
    tabActiveText: '#E11D48',
    tabInactiveText: '#6B7280',
    allPetsPillBg: '#FFFFFF',
    allPetsPillBorder: '#E8E2D8',
    allPetsPillText: '#1E1035',
    allPetsPillIcon: '#6B7280',
    sortText: '#9CA3AF',

    // Polaroid Fan Empty State
    emptyCardBg: '#FFFFFF',
    emptyCardBorder: '#E5DFD5',
    polaroidBg: '#FFFFFF',
    polaroidBorder: '#E8E2D8',
    polaroidTape: '#FDE68A',
    polaroidImgBox: '#F9FAFB',
    polaroidPawLost: '#9CA3AF',
    polaroidPawFound: '#7B2CFF',
    polaroidPawAdopt: '#059669',
    badgeLostBg: '#FFE4E6',
    badgeLostText: '#E11D48',
    badgeFoundBg: '#F3E8FF',
    badgeFoundText: '#6D28D9',
    badgeAdoptBg: '#DCFCE7',
    badgeAdoptText: '#059669',
    emptyOverline: '#E11D48',
    emptyTitle: '#1E1035',
    emptyDesc: '#6B7280',
    postPetBtnBg: '#E11D48',
    postPetBtnBevelBottom: '#9F1239',
    postPetBtnShadow: '#E11D48',
    postPetBtnText: '#FFFFFF',

    // Alerts Card (Royal Purple)
    alertBg: '#4C1D95',
    alertBevelTop: 'rgba(255, 255, 255, 0.30)',
    alertBevelBottom: '#2E1065',
    alertShadow: '#4C1D95',
    alertBellBg: '#FBBF24',
    alertBellIcon: '#1E1035',
    alertOverline: '#DDD6FE',
    alertTitle: '#FFFFFF',
    alertSubtitle: 'rgba(255, 255, 255, 0.85)',
    alertBtnBg: '#FFFFFF',
    alertBtnText: '#4C1D95',
    alertBtnBevelBottom: '#DDD6FE',

    // Safety Card (Warm Cream / Amber)
    safetyBg: '#FFFBEB',
    safetyBevelTop: '#FFFFFF',
    safetyBorder: '#FDE68A',
    safetyBevelBottom: '#FCD34D',
    safetyShadow: '#B45309',
    safetyIconBg: '#FDE68A',
    safetyIconColor: '#92400E',
    safetyOverline: '#B45309',
    safetyTitle: '#78350F',
    safetyDesc: '#92400E',
    safetyLink: '#B45309',

    // Steps: How Reunite Works
    stepCardBg: '#FFFFFF',
    stepCardBorder: '#F3EFE6',
    stepCardBevelBottom: '#DCD4C6',
    stepPillBg: '#FDF2F8',
    stepPillText: '#DB2777',
    stepTitle: '#1E1035',
    stepDesc: '#6B7280',

    // Modals & Forms
    modalSheetBg: '#FFFFFF',
    modalHandle: '#E5E7EB',
    modalFieldBg: '#F9FAFB',
    modalFieldBorder: '#E5E7EB',
    modalFieldText: '#1E1035',
    modalPlaceholder: '#A09AA8',
    modalShieldBg: '#ECFDF5',
    modalShieldIcon: '#059669',
    modalShieldBtnBg: '#059669',

    // Pet Alerts (Matching Website reference)
    petAlertsDeepPurple: '#2E008B',
    petAlertsCardBorder: '#EAE6DF',
    petAlertsInputBorder: '#E5E7EB',
    petAlertsInputFocusBorder: '#7C3AED',
    petAlertsInputFocusBg: '#FAF5FF',
    petAlertsCheckboxBorder: '#D1D5DB',
    petAlertsLabel: '#1F2937',
    petAlertsHelper: '#6B7280',
    petAlertsBtnBevelBottom: '#1D005A',
  },
};

export default colors;
