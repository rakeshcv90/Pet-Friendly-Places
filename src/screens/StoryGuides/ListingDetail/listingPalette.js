/** Colours for the listing page, light and dark. */
export const listingPalette = isDarkMode =>
  isDarkMode
    ? {
        bg: '#0F071D',
        bar: 'rgba(22, 13, 46, 0.96)',
        card: '#160D2E',
        border: '#26134B',
        text: '#F3E8FF',
        body: '#D1D5DB',
        muted: '#94A3B8',
        soft: 'rgba(168, 85, 247, 0.14)',
        accent: '#C4ADFF',
        good: '#86EFAC',
        goodSoft: 'rgba(34, 197, 94, 0.14)',
        warn: '#FCD34D',
        warnSoft: 'rgba(245, 158, 11, 0.14)',
      }
    : {
        bg: '#FAF7F2',
        bar: 'rgba(255, 255, 255, 0.96)',
        card: '#FFFFFF',
        border: '#EFE6F9',
        text: '#1A1A2E',
        body: '#374151',
        muted: '#6B7280',
        soft: '#F3EEFF',
        accent: '#3B108F',
        good: '#166534',
        goodSoft: '#DCFCE7',
        warn: '#92400E',
        warnSoft: '#FEF3C7',
      };
