import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// separator: "+" for combo (pressed together), "/" for alternatives, " " for sequence
type Separator = "+" | "/" | " ";

interface ShortcutItem {
  keys: string[];
  separator?: Separator;
  description: string;
}

const shortcuts: { category: string; items: ShortcutItem[] }[] = [
  {
    category: "Search",
    items: [
      { keys: ["⌘", "K"], separator: "+", description: "Open search" },
      { keys: ["/"], description: "Focus search" },
      { keys: ["Esc"], description: "Close dialog / Go home" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { keys: ["⇧", "H"], separator: "+", description: "Go to Home" },
      { keys: ["⇧", "F"], separator: "+", description: "Go to Favorites" },
      { keys: ["⇧", "T"], separator: "+", description: "Go to Tags" },
    ],
  },
  {
    category: "Settings",
    items: [
      { keys: ["d"], description: "Toggle theme" },
      { keys: ["w"], description: "Toggle page width" },
      { keys: ["x"], description: "Toggle hide deprecated" },
      { keys: ["r"], description: "Refresh data" },
      { keys: ["?"], description: "Show this help" },
    ],
  },
  {
    category: "List Filters & Pagination",
    items: [
      { keys: ["1"], description: "All packages" },
      { keys: ["2"], description: "Formulae only" },
      { keys: ["3"], description: "Casks only" },
      { keys: ["["], description: "Previous page" },
      { keys: ["]"], description: "Next page" },
      { keys: ["⇧", "["], separator: "+", description: "First page" },
    ],
  },
  {
    category: "List Navigation",
    items: [
      { keys: ["↑", "k"], separator: "/", description: "Move up" },
      { keys: ["↓", "j"], separator: "/", description: "Move down" },
      { keys: ["←", "h"], separator: "/", description: "Move left" },
      { keys: ["→", "l"], separator: "/", description: "Move right" },
      { keys: ["Enter"], description: "Open package" },
      { keys: ["f"], description: "Toggle favorite" },
      { keys: ["t"], description: "Add tag" },
    ],
  },
  {
    category: "Detail View",
    items: [
      { keys: ["⌫"], description: "Go back" },
      { keys: ["f"], description: "Toggle favorite" },
      { keys: ["t"], description: "Add tag" },
      { keys: ["o"], description: "Open homepage" },
      { keys: ["c"], description: "Copy install command" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
      {children}
    </kbd>
  );
}

export function HotkeyHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Keyboard shortcuts (?)"
          data-hotkey-help="true"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="flex-shrink-0 p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto flex-1 px-4 pb-4 scrollbar-thin">
          {shortcuts.map((section, index) => (
            <div key={section.category}>
              {index > 0 && <Separator className="mb-3" />}
              <h4 className="text-sm font-medium mb-1.5">{section.category}</h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between text-sm gap-2"
                  >
                    <span className="text-muted-foreground">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && item.separator && (
                            <span className="text-muted-foreground text-xs">
                              {item.separator === " " ? "→" : item.separator}
                            </span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
