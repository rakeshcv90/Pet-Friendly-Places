const CATEGORY_CONFIG = {
  Stays: { icon: 'bed-outline', color: '#7B2CFF', bgColor: '#F3EEFF' },
  Cafe: { icon: 'cafe-outline', color: '#EC4899', bgColor: '#FDF2F8' },
  Restaurant: { icon: 'restaurant-outline', color: '#F97316', bgColor: '#FFF7ED' },
  Resort: { icon: 'sunny-outline', color: '#10B981', bgColor: '#ECFDF5' },
  'Pet Store': { icon: 'paw-outline', color: '#F59E0B', bgColor: '#FEF3C7' },
  'Nature & Water': { icon: 'water-outline', color: '#06B6D4', bgColor: '#ECFEFF', name: 'Nature' },
  vet: { icon: 'medkit-outline', color: '#D946EF', bgColor: '#FDF4FF', name: 'Vet care' },
  'Pet Experience': { icon: 'sparkles-outline', color: '#8B5CF6', bgColor: '#F5F3FF', name: 'Experience' },
  Outdoor: { icon: 'leaf-outline', color: '#10B981', bgColor: '#ECFDF5' },
  PET_RELOCATION: { icon: 'car-sport-outline', color: '#F97316', bgColor: '#FFF7ED', name: 'Relocation' },
  TAXI_SERVICE: { icon: 'bus-outline', color: '#06B6D4', bgColor: '#ECFEFF', name: 'Transport' },
  'Pet Welfare & Rescue': { icon: 'heart-outline', color: '#EF4444', bgColor: '#FEF2F2', name: 'Rescue' },
};

export const mapApiCategories = (categories = []) => {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.map(item => {
    const config = CATEGORY_CONFIG[item.category] || {};
    return {
      id: item.category,
      name: config.name || item.category,
      icon: config.icon || 'paw-outline',
      color: config.color || '#7B2CFF',
      bgColor: config.bgColor || '#F3EEFF',
      count: item.listing_count || 0,
      rawCategory: item.category,
    };
  });
};

export default mapApiCategories;
