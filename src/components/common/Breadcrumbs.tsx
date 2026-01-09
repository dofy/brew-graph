import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useSearchStore } from '@/stores/useSearchStore';
import { Button } from '@/components/ui/button';

export function Breadcrumbs() {
  const { breadcrumbs, goToBreadcrumb, clearBreadcrumbs } = useSearchStore();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link to="/" onClick={clearBreadcrumbs}>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <Home className="h-4 w-4" />
        </Button>
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <div key={`${item.type}-${item.name}-${index}`} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium px-2">{item.name}</span>
          ) : (
            <Link to={`/${item.type}/${item.name}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => goToBreadcrumb(index)}
              >
                {item.name}
              </Button>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
