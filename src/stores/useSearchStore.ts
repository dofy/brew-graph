import { create } from 'zustand';
import type { PackageType, BreadcrumbItem } from '@/types';

interface SearchState {
  query: string;
  type: PackageType | 'all';
  tag: string | null;
  favoritesOnly: boolean;
  selectedIndex: number;
  breadcrumbs: BreadcrumbItem[];
  isSearchOpen: boolean;
  
  setQuery: (query: string) => void;
  setType: (type: PackageType | 'all') => void;
  setTag: (tag: string | null) => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  setSelectedIndex: (index: number) => void;
  
  pushBreadcrumb: (item: BreadcrumbItem) => void;
  popBreadcrumb: () => void;
  goToBreadcrumb: (index: number) => void;
  clearBreadcrumbs: () => void;
  
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  
  reset: () => void;
}

const initialState = {
  query: '',
  type: 'all' as const,
  tag: null,
  favoritesOnly: false,
  selectedIndex: 0,
  breadcrumbs: [] as BreadcrumbItem[],
  isSearchOpen: false,
};

export const useSearchStore = create<SearchState>((set) => ({
  ...initialState,

  setQuery: (query) => set({ query, selectedIndex: 0 }),
  setType: (type) => set({ type, selectedIndex: 0 }),
  setTag: (tag) => set({ tag, selectedIndex: 0 }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly, selectedIndex: 0 }),
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

  pushBreadcrumb: (item) => set((state) => ({
    breadcrumbs: [...state.breadcrumbs, item],
  })),
  
  popBreadcrumb: () => set((state) => ({
    breadcrumbs: state.breadcrumbs.slice(0, -1),
  })),
  
  goToBreadcrumb: (index) => set((state) => ({
    breadcrumbs: state.breadcrumbs.slice(0, index + 1),
  })),
  
  clearBreadcrumbs: () => set({ breadcrumbs: [] }),
  
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  
  reset: () => set(initialState),
}));
