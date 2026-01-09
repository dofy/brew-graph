import { Heart } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { cn } from "@/lib/utils";

export function Footer() {
  const { pageWidth } = useSettingsStore();

  return (
    <footer className="border-t py-6 mt-8">
      <div
        className={cn(
          "mx-auto px-4",
          pageWidth === "contained" && "container max-w-6xl"
        )}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()}</span>
            <a
              href="https://yahaha.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              yahaha.net
            </a>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" />{" "}
              by{" "}
              <a
                href="https://phpz.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Seven Yu
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
