import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoritesStore {
  favoriteIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      addFavorite: (id: string) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id) ? state.favoriteIds : [...state.favoriteIds, id],
        })),
      removeFavorite: (id: string) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((favId) => favId !== id),
        })),
      toggleFavorite: (id: string) => {
        const { favoriteIds, addFavorite, removeFavorite } = get();
        if (favoriteIds.includes(id)) {
          removeFavorite(id);
        } else {
          addFavorite(id);
        }
      },
      isFavorite: (id: string) => get().favoriteIds.includes(id),
    }),
    {
      name: 'saanjh.favorites.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
