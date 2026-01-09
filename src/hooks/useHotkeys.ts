import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSearchStore } from "@/stores/useSearchStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSyncStore } from "@/stores/useSyncStore";
import { toast } from "sonner";

const isInputFocused = () => {
  const target = document.activeElement as HTMLElement;
  return target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
};

const isDialogOpen = () => {
  // Check if any Radix Dialog is open
  return document.querySelector('[role="dialog"]') !== null;
};

export function useGlobalHotkeys() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setSearchOpen, isSearchOpen, hideDeprecated, setHideDeprecated } =
    useSearchStore();
  const { toggleTheme, togglePageWidth, pageWidth } = useSettingsStore();
  const { sync, isSyncing } = useSyncStore();

  // Helper to update type filter
  const setTypeFilter = (type: "all" | "formula" | "cask") => {
    // Only work on home page
    if (location.pathname !== "/" && location.pathname !== "") return;

    const newParams = new URLSearchParams(searchParams);
    if (type === "all") {
      newParams.delete("type");
    } else {
      newParams.set("type", type);
    }
    const queryString = newParams.toString();
    navigate(queryString ? `/?${queryString}` : "/", { replace: true });

    const labels = { all: "All", formula: "Formulae", cask: "Casks" };
    toast.success(`Filter: ${labels[type]}`);
  };

  // ============ Search ============
  // Cmd/Ctrl+K: Open search
  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      setSearchOpen(true);
    },
    { enableOnFormTags: true }
  );

  // /: Focus search
  useHotkeys("/", (e) => {
    if (isSearchOpen || isInputFocused()) return;
    e.preventDefault();
    setSearchOpen(true);
  });

  // Escape: Close dialog or go home
  useHotkeys("escape", () => {
    // If search dialog is open, close it
    if (isSearchOpen) {
      setSearchOpen(false);
      return;
    }
    // If any other dialog is open (help, tag, etc.), let the dialog handle ESC
    if (isDialogOpen()) {
      return;
    }
    // Otherwise, go home if not already there
    if (location.pathname !== "/") {
      navigate("/");
    }
  });

  // ============ Navigation (Shift + key) ============
  // Shift+H: Go Home
  useHotkeys("shift+h", () => {
    if (isInputFocused() || isSearchOpen) return;
    navigate("/");
    toast.success("Home");
  });

  // Shift+F: Go Favorites (f = favorite, Shift+F = favorites page)
  useHotkeys("shift+f", () => {
    if (isInputFocused() || isSearchOpen) return;
    navigate("/favorites");
    toast.success("Favorites");
  });

  // Shift+T: Go Tags (t = tag, Shift+T = tags page)
  useHotkeys("shift+t", () => {
    if (isInputFocused() || isSearchOpen) return;
    navigate("/tags");
    toast.success("Tags");
  });

  // ============ Settings/Actions ============
  // d: Toggle theme
  useHotkeys("d", () => {
    if (isInputFocused() || isSearchOpen) return;
    toggleTheme();
    toast.success("Theme toggled");
  });

  // w: Toggle page width
  useHotkeys("w", () => {
    if (isInputFocused() || isSearchOpen) return;
    togglePageWidth();
    toast.success(pageWidth === "full" ? "Contained width" : "Full width");
  });

  // x: Toggle hide deprecated
  useHotkeys("x", () => {
    if (isInputFocused() || isSearchOpen) return;
    setHideDeprecated(!hideDeprecated);
    toast.success(
      hideDeprecated
        ? "Showing deprecated packages"
        : "Hiding deprecated packages"
    );
  });

  // r: Refresh/sync data
  useHotkeys("r", () => {
    if (isInputFocused() || isSearchOpen) return;
    if (!isSyncing) {
      sync(true);
      toast.success("Syncing data...");
    }
  });

  // ============ List Filters (Home page) ============
  // 1: All packages
  useHotkeys("1", () => {
    if (isInputFocused() || isSearchOpen) return;
    setTypeFilter("all");
  });

  // 2: Formulae only
  useHotkeys("2", () => {
    if (isInputFocused() || isSearchOpen) return;
    setTypeFilter("formula");
  });

  // 3: Casks only
  useHotkeys("3", () => {
    if (isInputFocused() || isSearchOpen) return;
    setTypeFilter("cask");
  });

  // ============ Pagination ============
  // [: Previous page
  useHotkeys(
    "BracketLeft",
    () => {
      if (isInputFocused() || isSearchOpen || isDialogOpen()) return;
      if (location.pathname !== "/") return;

      const currentPage = parseInt(searchParams.get("page") || "1", 10);
      if (currentPage > 1) {
        const newParams = new URLSearchParams(searchParams);
        const newPage = currentPage - 1;
        if (newPage === 1) {
          newParams.delete("page");
        } else {
          newParams.set("page", String(newPage));
        }
        const queryString = newParams.toString();
        navigate(queryString ? `/?${queryString}` : "/", { replace: true });
        toast.success(`Page ${newPage}`);
      }
    },
    { keyup: false, keydown: true }
  );

  // ]: Next page
  useHotkeys(
    "BracketRight",
    () => {
      if (isInputFocused() || isSearchOpen || isDialogOpen()) return;
      if (location.pathname !== "/") return;

      const currentPage = parseInt(searchParams.get("page") || "1", 10);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(currentPage + 1));
      const queryString = newParams.toString();
      navigate(queryString ? `/?${queryString}` : "/", { replace: true });
      toast.success(`Page ${currentPage + 1}`);
    },
    { keyup: false, keydown: true }
  );

  // Shift+[: First page
  useHotkeys(
    "shift+BracketLeft",
    () => {
      if (isInputFocused() || isSearchOpen || isDialogOpen()) return;
      if (location.pathname !== "/") return;

      const currentPage = parseInt(searchParams.get("page") || "1", 10);
      if (currentPage > 1) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("page");
        const queryString = newParams.toString();
        navigate(queryString ? `/?${queryString}` : "/", { replace: true });
        toast.success("First page");
      }
    },
    { keyup: false, keydown: true }
  );

  // ============ Help ============
  // ?: Show help (using native event for better compatibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !isInputFocused() && !isSearchOpen) {
        e.preventDefault();
        const helpButton = document.querySelector(
          '[data-hotkey-help="true"]'
        ) as HTMLButtonElement;
        if (helpButton) {
          helpButton.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);
}
