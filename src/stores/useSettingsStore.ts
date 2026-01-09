import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type PageWidth = "full" | "contained";

interface SettingsState {
  theme: Theme;
  pageWidth: PageWidth;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setPageWidth: (width: PageWidth) => void;
  togglePageWidth: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "system",
      pageWidth: "contained",

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme =
          theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      setPageWidth: (pageWidth) => set({ pageWidth }),
      togglePageWidth: () =>
        set((state) => ({
          pageWidth: state.pageWidth === "full" ? "contained" : "full",
        })),
    }),
    {
      name: "brew-graph-settings",
      version: 1,
      migrate: (persistedState, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any;
        if (version === 0) {
          // Remove deprecated sidebarOpen field
          delete state.sidebarOpen;
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const { theme } = useSettingsStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });
}
