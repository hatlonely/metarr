export interface AssrtLangList {
  langchs?: boolean; // simplified Chinese
  langcht?: boolean; // traditional Chinese
  langeng?: boolean; // English
  langdou?: boolean; // bilingual (usually zh + en)
  langjap?: boolean;
  langkor?: boolean;
}

export interface AssrtSearchSub {
  id: number;
  native_name: string;
  videoname: string;
  lang: { desc?: string; langlist?: AssrtLangList };
}

/** Which canonical language keys a search result provides, based on langlist flags. */
export function assrtLangsOf(langlist?: AssrtLangList): string[] {
  if (!langlist) return [];
  const langs = new Set<string>();
  if (langlist.langchs || langlist.langdou) langs.add('zh');
  if (langlist.langcht) langs.add('zh-TW');
  if (langlist.langeng || langlist.langdou) langs.add('en');
  if (langlist.langjap) langs.add('ja');
  if (langlist.langkor) langs.add('ko');
  return [...langs];
}

export class AssrtClient {
  constructor(readonly token: string) {}

  async search(query: string): Promise<AssrtSearchSub[]> {
    const url = `https://api.assrt.net/v1/sub/search?q=${encodeURIComponent(query)}&cnt=8&pos=0&token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Assrt ${res.status}`);
    const data = (await res.json()) as { status: number; sub?: { subs?: AssrtSearchSub[] } };
    return data.sub?.subs ?? [];
  }

  /**
   * Resolve the download URL for a subtitle. Assrt serves the file via the
   * top-level `url` field (filelist is usually empty); it may be a direct
   * subtitle file or a zip/rar archive.
   */
  async getDownload(subId: number): Promise<{ url: string; ext: string } | null> {
    const url = `https://api.assrt.net/v1/sub/detail?id=${subId}&token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: number;
      sub?: { subs?: Array<{ url?: string }> };
    };
    const dlUrl = data.sub?.subs?.[0]?.url;
    if (!dlUrl) return null;
    const ext = (dlUrl.split('?')[0].split('.').pop() ?? '').toLowerCase();
    return { url: dlUrl, ext };
  }
}
