import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SearchDialog } from '@/components/search/SearchDialog';
import { HotkeyProvider } from '@/components/common/HotkeyProvider';
import { Home } from '@/pages/Home';
import { Favorites } from '@/pages/Favorites';
import { Detail } from '@/pages/Detail';

function App() {
  return (
    <BrowserRouter>
      <HotkeyProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path=":type/:name" element={<Detail />} />
          </Route>
        </Routes>
        <SearchDialog />
      </HotkeyProvider>
    </BrowserRouter>
  );
}

export default App;
