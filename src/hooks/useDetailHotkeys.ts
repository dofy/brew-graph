import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { toast } from "sonner";
import type { PackageType } from "@/types";

const isInputFocused = () => {
  const target = document.activeElement as HTMLElement;
  return target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
};

interface UseDetailHotkeysOptions {
  name: string;
  type: PackageType;
  homepage: string;
  installCommand: string;
}

export function useDetailHotkeys({
  name,
  type,
  homepage,
  installCommand,
}: UseDetailHotkeysOptions) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  const favorite = isFavorite(name, type);

  // F: toggle favorite
  useHotkeys(
    "f",
    () => {
      if (isInputFocused()) return;
      toggleFavorite(name, type);
      toast.success(favorite ? "Removed from favorites" : "Added to favorites");
    },
    [name, type, toggleFavorite, favorite]
  );

  // T: open tag dialog
  useHotkeys(
    "t",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      setTimeout(() => setTagDialogOpen(true), 0);
    },
    [setTagDialogOpen]
  );

  // O: open homepage
  useHotkeys(
    "o",
    () => {
      if (isInputFocused()) return;
      window.open(homepage, "_blank", "noopener,noreferrer");
    },
    [homepage]
  );

  // C: copy install command
  useHotkeys(
    "c",
    () => {
      if (isInputFocused()) return;
      navigator.clipboard.writeText(installCommand);
      toast.success("Install command copied!");
    },
    [installCommand]
  );

  // Backspace: go back
  useHotkeys(
    "backspace",
    (e) => {
      if (isInputFocused()) return;
      e.preventDefault();
      navigate(-1);
    },
    [navigate]
  );

  return {
    tagDialogOpen,
    setTagDialogOpen,
    favorite,
  };
}
