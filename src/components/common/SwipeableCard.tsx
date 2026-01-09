import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Heart, Copy, Check } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  installCommand: string;
}

export function SwipeableCard({
  children,
  isFavorite,
  onToggleFavorite,
  installCommand,
}: SwipeableCardProps) {
  const [copied, setCopied] = useState(false);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ down, movement: [mx] }) => {
      if (!down && Math.abs(mx) > 80) {
        if (mx < -80) {
          handleCopy();
        } else if (mx > 80) {
          onToggleFavorite();
        }
      }

      api.start({
        x: down ? Math.max(-120, Math.min(120, mx)) : 0,
        immediate: down,
      });
    },
    {
      axis: "x",
      filterTaps: true,
      from: () => [x.get(), 0],
    }
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg md:overflow-visible">
      {/* Left action (favorite) */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-red-500 text-white rounded-l-lg md:hidden">
        <Heart className={isFavorite ? "fill-white" : ""} />
      </div>

      {/* Right action (copy) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-blue-500 text-white rounded-r-lg md:hidden">
        {copied ? <Check /> : <Copy />}
      </div>

      {/* Main content */}
      <animated.div
        {...bind()}
        style={{ x, touchAction: "pan-y" }}
        className="relative bg-background"
      >
        {children}
      </animated.div>
    </div>
  );
}
