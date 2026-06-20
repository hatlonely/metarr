import {
  ScanSearch,
  Clapperboard,
  FolderSync,
  Captions,
  Images,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/** Icon per capability key, shared by landing capabilities grid and features page. */
export const capabilityIcons: Record<string, LucideIcon> = {
  parse: ScanSearch,
  tmdb: Clapperboard,
  rename: FolderSync,
  subtitle: Captions,
  artwork: Images,
  presets: Settings2,
  safety: ShieldCheck,
};
