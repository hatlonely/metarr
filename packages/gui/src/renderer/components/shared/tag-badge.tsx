'use client';

import { Badge } from '@/src/renderer/components/ui/badge';
import { cn } from '@/src/renderer/lib/utils';
import type { MediaTags } from '@metarr/core';

interface TagBadgeProps {
  label: string;
  className?: string;
}

export function TagBadge({ label, className }: TagBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('font-normal', className)}>
      {label}
    </Badge>
  );
}

interface MediaTagBadgesProps {
  tags: MediaTags;
}

export function MediaTagBadges({ tags }: MediaTagBadgesProps) {
  const items: string[] = [];
  if (tags.resolution) items.push(tags.resolution);
  if (tags.codec) items.push(tags.codec);
  if (tags.audioCodec) items.push(tags.audioCodec);
  if (tags.isDV) items.push('DV');
  if (tags.isHDR) items.push('HDR');
  if (tags.source) items.push(tags.source);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <TagBadge key={item} label={item} />
      ))}
    </div>
  );
}
