import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "@/components/ui/sonner";
import { SyncOverlay } from "@/components/common/SyncOverlay";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { cn } from "@/lib/utils";

export function Layout() {
  const { pageWidth } = useSettingsStore();

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-auto">
        <div
          className={cn(
            "mx-auto p-4 lg:p-6",
            pageWidth === "contained" && "container max-w-6xl"
          )}
        >
          <Outlet />
        </div>
        <Footer />
      </main>
      <Toaster />
      <SyncOverlay />
    </div>
  );
}
