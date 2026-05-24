import type { FakeSearchResult } from '@/lib/demo-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoSearchProps {
  results: FakeSearchResult[];
  selectedId: number | null;
  loading: boolean;
  onSelect: (match: FakeSearchResult) => void;
  labels: {
    selectMatch: string;
  };
}

export function DemoSearch({ results, selectedId, loading, onSelect, labels }: DemoSearchProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No results found.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => (
        <Card
          key={result.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md',
            selectedId === result.id && 'border-l-4 border-l-primary',
          )}
        >
          <CardContent className="p-4">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-medium">{result.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {result.originalTitle} ({result.year})
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {result.type === 'tv' ? 'TV' : 'Movie'}
                </Badge>
              </div>
            </div>
            <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
              {result.overview}
            </p>
            <Button
              size="sm"
              variant={selectedId === result.id ? 'default' : 'outline'}
              className="w-full"
              onClick={() => onSelect(result)}
            >
              {labels.selectMatch}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
