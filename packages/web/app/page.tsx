import { HeroSection } from '@/components/landing/hero-section';
import { CapabilitiesSection } from '@/components/landing/capabilities-section';
import { WorkflowSection } from '@/components/landing/workflow-section';
import { HighlightSection } from '@/components/landing/highlight-section';
import { PresetsSection } from '@/components/landing/presets-section';
import { DemoTeaser } from '@/components/landing/demo-teaser';
import { DownloadCta } from '@/components/landing/download-cta';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CapabilitiesSection />
      <WorkflowSection />
      <HighlightSection />
      <PresetsSection />
      <DemoTeaser />
      <DownloadCta />
    </>
  );
}
