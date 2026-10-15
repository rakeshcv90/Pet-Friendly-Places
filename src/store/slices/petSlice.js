export const createPetSlice = (set, get) => ({
  pets: [],
  favorites: [],
  isLoading: false,
  error: null,

  setPets: (pets) => set({ pets }),
  
  toggleFavorite: (petId) => {
    const { favorites } = get();
    if (favorites.includes(petId)) {
      set({ favorites: favorites.filter(id => id !== petId) });
    } else {
      set({ favorites: [...favorites, petId] });
    }
  },
});
