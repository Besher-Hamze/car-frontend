import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Car } from '../types';

interface CompareStore {
  selectedCars: Car[];
  addCar: (car: Car) => void;
  removeCar: (id: string) => void;
  clearAll: () => void;
  isSelected: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      selectedCars: [],
      addCar: (car) => {
        const { selectedCars } = get();
        if (selectedCars.length >= 4) return;
        if (selectedCars.find(c => c._id === car._id)) return;
        set({ selectedCars: [...selectedCars, car] });
      },
      removeCar: (id) => {
        set({ selectedCars: get().selectedCars.filter(c => c._id !== id) });
      },
      clearAll: () => set({ selectedCars: [] }),
      isSelected: (id) => !!get().selectedCars.find(c => c._id === id),
    }),
    { name: 'compare-storage' }
  )
);

interface FavoritesStore {
  favorites: string[];
  toggle: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (id) => {
        const { favorites } = get();
        if (favorites.includes(id)) {
          set({ favorites: favorites.filter(f => f !== id) });
        } else {
          set({ favorites: [...favorites, id] });
        }
      },
      isFavorite: (id) => get().favorites.includes(id),
    }),
    { name: 'favorites-storage' }
  )
);
