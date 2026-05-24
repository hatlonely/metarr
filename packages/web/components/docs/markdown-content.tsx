interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const html = simpleMarkdown(content);
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function simpleMarkdown(md: string): string {
  let html = md;

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    return `<pre class="rounded-md bg-muted p-4 overflow-x-auto text-sm"><code>${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-sm">$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-3 text-lg font-semibold">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-4 text-xl font-bold">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="mb-6 text-2xl font-bold">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline">$1</a>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    if (match.includes('---')) return '<!-- table separator -->';
    const cells = match.split('|').filter((c) => c.trim());
    const tag = 'td';
    const row = cells.map((c: string) => `<${tag} class="border px-3 py-2 text-sm">${c.trim()}</${tag}>`).join('');
    return `<tr>${row}</tr>`;
  });

  // Wrap consecutive <tr> in <table>
  html = html.replace(/((<tr>.*<\/tr>\n?)+)/g, '<table class="w-full border-collapse my-4">$1</table>');
  html = html.replace(/<!-- table separator -->\n?/g, '');

  // Paragraphs (lines that aren't already wrapped)
  html = html
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<tr') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<!--')
      ) {
        return line;
      }
      return `<p class="mb-2 text-muted-foreground">${trimmed}</p>`;
    })
    .join('\n');

  return html;
}
