import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { SyncOverlay } from '@/components/common/SyncOverlay';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <SyncOverlay />
    </div>
  );
}
