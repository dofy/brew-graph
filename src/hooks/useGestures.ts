import { useNavigate } from "react-router-dom";
import { useDrag } from "@use-gesture/react";
import { useSyncStore } from "@/stores/useSyncStore";

export function useSwipeBack() {
  const navigate = useNavigate();

  const bind = useDrag(
    ({ movement: [mx], direction: [dx], velocity: [vx], cancel }) => {
      if (dx > 0 && mx > 100 && vx > 0.3) {
        cancel();
        navigate(-1);
      }
    },
    {
      axis: "x",
      filterTaps: true,
      from: () => [0, 0],
    }
  );

  return bind;
}

export function usePullToRefresh() {
  const { sync, isSyncing } = useSyncStore();

  const bind = useDrag(
    ({
      movement: [, my],
      direction: [, dy],
      velocity: [, vy],
      cancel,
      active,
    }) => {
      if (!active && dy > 0 && my > 100 && vy > 0.3 && !isSyncing) {
        cancel();
        sync(true);
      }
    },
    {
      axis: "y",
      filterTaps: true,
      from: () => [0, 0],
      bounds: { top: 0 },
    }
  );

  return { bind, isSyncing };
}

export function useSwipeActions(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const bind = useDrag(
    ({ movement: [mx], direction: [dx], velocity: [vx], cancel }) => {
      if (Math.abs(mx) > 80 && vx > 0.3) {
        cancel();
        if (dx < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (dx > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      from: () => [0, 0],
    }
  );

  return bind;
}
