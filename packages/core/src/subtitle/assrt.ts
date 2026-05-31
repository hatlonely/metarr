interface AssrtSearchSub {
  id: string;
  native_name: string;
  videoname: string;
  lang: { desc: string };
  subtype: string;
}

interface AssrtFileItem {
  url: string;
  f: string;
  ext: string;
}

const PREFERRED_FORMATS = ['srt', 'ass', 'ssa', 'sub'];

export class AssrtClient {
  constructor(readonly token: string) {}

  async search(query: string): Promise<AssrtSearchSub[]> {
    const url = `https://api.assrt.net/v1/sub/search?q=${encodeURIComponent(query)}&cnt=5&pos=0&token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Assrt ${res.status}`);
    const data = await res.json() as { status: number; sub?: { subs?: AssrtSearchSub[] } };
    return data.sub?.subs ?? [];
  }

  async getDirectUrl(subId: string): Promise<{ url: string; ext: string } | null> {
    const url = `https://api.assrt.net/v1/sub/detail?id=${subId}&token=${this.token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as {
      status: number;
      sub?: { subs?: Array<{ filelist?: AssrtFileItem[] }> };
    };
    const filelist = data.sub?.subs?.[0]?.filelist ?? [];
    const direct = filelist
      .filter(f => PREFERRED_FORMATS.includes(f.ext.toLowerCase()))
      .sort((a, b) => PREFERRED_FORMATS.indexOf(a.ext) - PREFERRED_FORMATS.indexOf(b.ext));
    if (!direct.length) return null;
    return { url: direct[0].url, ext: direct[0].ext.toLowerCase() };
  }
}
