import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { useSearchStore } from "@/stores/useSearchStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { toast } from "sonner";
import type { PackageItem } from "./usePackages";

const isInputFocused = () => {
  const target = document.activeElement as HTMLElement;
  return target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
};

interface UseCardNavigationOptions {
  packages: PackageItem[] | undefined;
  onTagRequest?: (pkg: PackageItem) => void;
}

// Calculate actual columns by checking card positions in the grid
function getActualColumns(container: HTMLDivElement | null): number {
  if (!container) return 1;

  const cards = container.querySelectorAll("[data-card-index]");
  if (cards.length < 2) return 1;

  const firstCard = cards[0] as HTMLElement;
  const firstTop = firstCard.getBoundingClientRect().top;

  // Count how many cards are on the first row
  let columns = 1;
  for (let i = 1; i < cards.length; i++) {
    const card = cards[i] as HTMLElement;
    if (Math.abs(card.getBoundingClientRect().top - firstTop) < 5) {
      columns++;
    } else {
      break;
    }
  }

  return columns;
}

export function useCardNavigation({
  packages,
  onTagRequest,
}: UseCardNavigationOptions) {
  const navigate = useNavigate();
  const { selectedIndex, setSelectedIndex, isSearchOpen } = useSearchStore();
  const { toggleFavorite } = useFavoriteStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const totalItems = packages?.length ?? 0;

  // Ensure selectedIndex is within bounds
  useEffect(() => {
    if (totalItems > 0 && selectedIndex >= totalItems) {
      setSelectedIndex(Math.max(0, totalItems - 1));
    }
  }, [totalItems, selectedIndex, setSelectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (containerRef.current && totalItems > 0) {
      const selectedCard = containerRef.current.querySelector(
        `[data-card-index="${selectedIndex}"]`
      );
      if (selectedCard) {
        selectedCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, totalItems]);

  const moveSelection = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (totalItems === 0) return;

      const columns = getActualColumns(containerRef.current);
      let newIndex = selectedIndex;

      switch (direction) {
        case "up":
          newIndex = Math.max(0, selectedIndex - columns);
          break;
        case "down":
          newIndex = Math.min(totalItems - 1, selectedIndex + columns);
          break;
        case "left":
          newIndex = Math.max(0, selectedIndex - 1);
          break;
        case "right":
          newIndex = Math.min(totalItems - 1, selectedIndex + 1);
          break;
      }
      setSelectedIndex(newIndex);
    },
    [selectedIndex, totalItems, setSelectedIndex]
  );

  const getSelectedPackage = useCallback(() => {
    if (!packages || packages.length === 0) return null;
    return packages[selectedIndex] ?? null;
  }, [packages, selectedIndex]);

  // Navigation keys
  useHotkeys(
    "up, k",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      e.preventDefault();
      moveSelection("up");
    },
    { enableOnFormTags: false },
    [moveSelection, isSearchOpen]
  );

  useHotkeys(
    "down, j",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      e.preventDefault();
      moveSelection("down");
    },
    { enableOnFormTags: false },
    [moveSelection, isSearchOpen]
  );

  useHotkeys(
    "left",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      e.preventDefault();
      moveSelection("left");
    },
    { enableOnFormTags: false },
    [moveSelection, isSearchOpen]
  );

  // h key for left movement (separate to avoid Shift+H conflict)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" && !e.shiftKey && !isInputFocused() && !isSearchOpen) {
        e.preventDefault();
        moveSelection("left");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveSelection, isSearchOpen]);

  useHotkeys(
    "right, l",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      e.preventDefault();
      moveSelection("right");
    },
    { enableOnFormTags: false },
    [moveSelection, isSearchOpen]
  );

  // Enter: open selected package
  useHotkeys(
    "enter",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      const pkg = getSelectedPackage();
      if (pkg) {
        e.preventDefault();
        navigate(`/${pkg.type}/${pkg.name}`);
      }
    },
    { enableOnFormTags: false },
    [getSelectedPackage, navigate, isSearchOpen]
  );

  // F: toggle favorite
  useHotkeys(
    "f",
    () => {
      if (isInputFocused() || isSearchOpen) return;
      const pkg = getSelectedPackage();
      if (pkg) {
        const wasFavorite = useFavoriteStore
          .getState()
          .isFavorite(pkg.name, pkg.type);
        toggleFavorite(pkg.name, pkg.type);
        toast.success(
          wasFavorite ? "Removed from favorites" : "Added to favorites"
        );
      }
    },
    { enableOnFormTags: false },
    [getSelectedPackage, toggleFavorite, isSearchOpen]
  );

  // T: add tag
  useHotkeys(
    "t",
    (e) => {
      if (isInputFocused() || isSearchOpen) return;
      const pkg = getSelectedPackage();
      if (pkg && onTagRequest) {
        e.preventDefault();
        // Use setTimeout to ensure the key event is fully processed before opening dialog
        setTimeout(() => onTagRequest(pkg), 0);
      }
    },
    { enableOnFormTags: false },
    [getSelectedPackage, onTagRequest, isSearchOpen]
  );

  return {
    containerRef,
    selectedIndex,
    setSelectedIndex,
    getSelectedPackage,
  };
}
