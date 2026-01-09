import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PackageType } from "@/types";

interface SearchState {
  query: string;
  type: PackageType | "all";
  tag: string | null;
  favoritesOnly: boolean;
  hideDeprecated: boolean;
  selectedIndex: number;
  isSearchOpen: boolean;

  setQuery: (query: string) => void;
  setType: (type: PackageType | "all") => void;
  setTag: (tag: string | null) => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  setHideDeprecated: (hide: boolean) => void;
  setSelectedIndex: (index: number) => void;

  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  reset: () => void;
}

const initialState = {
  query: "",
  type: "all" as const,
  tag: null,
  favoritesOnly: false,
  hideDeprecated: true,
  selectedIndex: 0,
  isSearchOpen: false,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      ...initialState,

      setQuery: (query) => set({ query, selectedIndex: 0 }),
      setType: (type) => set({ type, selectedIndex: 0 }),
      setTag: (tag) => set({ tag, selectedIndex: 0 }),
      setFavoritesOnly: (favoritesOnly) =>
        set({ favoritesOnly, selectedIndex: 0 }),
      setHideDeprecated: (hideDeprecated) => set({ hideDeprecated }),
      setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      toggleSearch: () =>
        set((state) => ({ isSearchOpen: !state.isSearchOpen })),

      reset: () => set(initialState),
    }),
    {
      name: "brew-graph-search",
      partialize: (state) => ({ hideDeprecated: state.hideDeprecated }),
    }
  )
);
