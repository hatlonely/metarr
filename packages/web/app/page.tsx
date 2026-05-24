import { HeroSection } from '@/components/landing/hero-section';
import { FeatureHighlight } from '@/components/landing/feature-highlight';
import { DemoTeaser } from '@/components/landing/demo-teaser';
import { DownloadCta } from '@/components/landing/download-cta';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureHighlight />
      <DemoTeaser />
      <DownloadCta />
    </>
  );
}
