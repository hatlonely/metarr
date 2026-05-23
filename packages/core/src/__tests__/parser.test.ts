import { describe, it, expect } from 'vitest';
import { parseDirName } from '../parser/dir-parser.js';
import { parseFileName } from '../parser/file-parser.js';
import { parseTags } from '../parser/tag-parser.js';

describe('parseDirName', () => {
  it('should parse already-clean format without id tag', () => {
    const result = parseDirName('万物生灵 (2020)');
    expect(result.chineseTitle).toBe('万物生灵');
    expect(result.year).toBe(2020);
    expect(result.isClean).toBe(true);
    expect(result.englishTitle).toBeUndefined();
  });

  it('should parse already-clean format with tmdbid', () => {
    const result = parseDirName('寻秦记 (2001) [tmdbid-1375]');
    expect(result.chineseTitle).toBe('寻秦记');
    expect(result.year).toBe(2001);
    expect(result.isClean).toBe(true);
  });

  it('should parse already-clean format with imdbid', () => {
    const result = parseDirName('阿凡达 (2009) [imdbid-tt0499549]');
    expect(result.chineseTitle).toBe('阿凡达');
    expect(result.year).toBe(2009);
    expect(result.isClean).toBe(true);
  });

  it('should parse Chinese bracket prefix with Chinese title', () => {
    const dirName =
      '【高清剧集网发布 www.QQHDTV.com】低智商犯罪[杜比视界版本][全24集][国语音轨+简繁英字幕].2026.2160p.IQ.WEB-DL.H265.DV.DDP5.1-BlackTV';
    const result = parseDirName(dirName);
    expect(result.chineseTitle).toBe('低智商犯罪');
    expect(result.year).toBe(2026);
    expect(result.isClean).toBe(false);
    expect(result.tags.resolution).toBe('2160p');
    expect(result.tags.codec).toBe('H.265');
    expect(result.tags.audioCodec).toBe('DDP5.1');
    expect(result.tags.source).toBe('WEB-DL');
    expect(result.tags.isDV).toBe(true);
    expect(result.tags.releaseGroup).toBe('BlackTV');
  });

  it('should parse mixed Chinese+English title', () => {
    const dirName =
      "【高清影视之家发布 www.BBEBBB.com】我，许可[杜比视界版本][高码版][国语音轨].It's.OK.2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.3Audios-PandaQT";
    const result = parseDirName(dirName);
    expect(result.chineseTitle).toBe('我，许可');
    expect(result.englishTitle).toBe("It's OK");
    expect(result.year).toBe(2025);
    expect(result.tags.isHQ).toBe(true);
    expect(result.tags.releaseGroup).toBe('PandaQT');
  });

  it('should parse movie directory name', () => {
    const result = parseDirName('沙丘2 (2024) [tmdbid-811887]');
    expect(result.chineseTitle).toBe('沙丘2');
    expect(result.year).toBe(2024);
    expect(result.isClean).toBe(true);
  });

  it('should extract media tags correctly', () => {
    const result = parseDirName(
      'Some.Show.S01.2025.1080p.BluRay.REMUX.H.264.DTS-HD.MA-Group',
    );
    expect(result.tags.resolution).toBe('1080p');
    expect(result.tags.codec).toBe('H.264');
    expect(result.tags.source).toBe('BluRay');
    expect(result.tags.releaseGroup).toBe('Group');
  });
});

describe('parseFileName', () => {
  it('should extract S01E01 pattern', () => {
    const result = parseFileName(
      'Born.with.Luck.S01E01.2026.2160p.IQ.WEB-DL.H265.DV.DDP5.1-BlackTV.mkv',
    );
    expect(result.season).toBe(1);
    expect(result.episodes).toEqual([1]);
    expect(result.extension).toBe('.mkv');
  });

  it('should extract S01E24 pattern', () => {
    const result = parseFileName(
      'Born.with.Luck.S01E24.2026.2160p.IQ.WEB-DL.H265.DV.DDP5.1-BlackTV.mkv',
    );
    expect(result.season).toBe(1);
    expect(result.episodes).toEqual([24]);
  });

  it('should handle movie file (no season/episode)', () => {
    const result = parseFileName(
      "我_许可.It's.OK..2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.3Audios-PandaQT.mkv",
    );
    expect(result.season).toBe(0);
    expect(result.episodes).toEqual([]);
    expect(result.extension).toBe('.mkv');
  });

  it('should extract media tags from file names', () => {
    const result = parseFileName(
      'Show.Name.S02E05.2025.2160p.WEB-DL.H265.DV.DDP5.1-Group.mkv',
    );
    expect(result.tags.resolution).toBe('2160p');
    expect(result.tags.codec).toBe('H.265');
    expect(result.tags.isDV).toBe(true);
    expect(result.tags.audioCodec).toBe('DDP5.1');
    expect(result.tags.releaseGroup).toBe('Group');
  });
});

describe('parseTags', () => {
  it('should parse resolution', () => {
    expect(parseTags('1080p').resolution).toBe('1080p');
    expect(parseTags('2160p').resolution).toBe('2160p');
    expect(parseTags('4K').resolution).toBe('2160p');
    expect(parseTags('720p').resolution).toBe('720p');
  });

  it('should parse codec', () => {
    expect(parseTags('H.265').codec).toBe('H.265');
    expect(parseTags('x265').codec).toBe('H.265');
    expect(parseTags('HEVC').codec).toBe('H.265');
    expect(parseTags('H264').codec).toBe('H.264');
    expect(parseTags('AV1').codec).toBe('AV1');
  });

  it('should parse audio codec', () => {
    expect(parseTags('DDP5.1').audioCodec).toBe('DDP5.1');
    expect(parseTags('DTS5.1').audioCodec).toBe('DTS5.1');
    expect(parseTags('AAC').audioCodec).toBe('AAC');
    expect(parseTags('TrueHD').audioCodec).toBe('TrueHD');
  });

  it('should parse source', () => {
    expect(parseTags('WEB-DL').source).toBe('WEB-DL');
    expect(parseTags('BluRay').source).toBe('BluRay');
    expect(parseTags('HDTV').source).toBe('HDTV');
  });

  it('should detect Dolby Vision', () => {
    const tags = parseTags('2160p.WEB-DL.H265.DV.DDP5.1');
    expect(tags.isDV).toBe(true);
    expect(tags.isHDR).toBe(false);
  });

  it('should detect HDR when no DV', () => {
    const tags = parseTags('2160p.WEB-DL.H265.HDR.DDP5.1');
    expect(tags.isHDR).toBe(true);
    expect(tags.isDV).toBe(false);
  });

  it('should detect HQ', () => {
    expect(parseTags('2160p.HQ').isHQ).toBe(true);
    expect(parseTags('2160p').isHQ).toBe(false);
  });
});
