import { Github, Heart } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { cn } from "@/lib/utils";
import { version } from "../../../package.json";

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
            <span className="text-xs opacity-60">v{version}</span>
            <a
              href="https://github.com/dofy/brew-graph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
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
