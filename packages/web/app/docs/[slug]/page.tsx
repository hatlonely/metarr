import { docList } from '@/lib/docs-content';
import { DocPageClient } from './doc-page-client';

export function generateStaticParams() {
  return docList.map((doc) => ({ slug: doc.slug }));
}

export default function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  return <DocPageClient params={params} />;
}
