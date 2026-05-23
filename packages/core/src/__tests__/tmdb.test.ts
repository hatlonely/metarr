import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TMDBClient } from '../tmdb/client.js';
import { TMDBError } from '../tmdb/errors.js';

describe('TMDBClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should search TV shows', async () => {
    const mockResponse = {
      results: [
        {
          id: 123,
          name: '测试剧',
          original_name: 'Test Show',
          first_air_date: '2026-01-01',
          overview: 'A test show',
          poster_path: '/abc.jpg',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const client = new TMDBClient({ apiKey: 'test-key', language: 'zh-CN' });
    const results = await client.searchTv('测试剧');

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(123);
    expect(results[0].name).toBe('测试剧');

    // Verify API call
    const calledUrl = new URL((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(calledUrl.pathname).toBe('/3/search/tv');
    expect(calledUrl.searchParams.get('api_key')).toBe('test-key');
    expect(calledUrl.searchParams.get('language')).toBe('zh-CN');
    expect(calledUrl.searchParams.get('query')).toBe('测试剧');
  });

  it('should search movies', async () => {
    const mockResponse = {
      results: [
        {
          id: 456,
          title: '测试电影',
          original_title: 'Test Movie',
          release_date: '2026-01-01',
          overview: 'A test movie',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const client = new TMDBClient({ apiKey: 'test-key' });
    const results = await client.searchMovie('测试电影', 2026);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(456);

    const calledUrl = new URL((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(calledUrl.searchParams.get('primary_release_year')).toBe('2026');
  });

  it('should throw TMDBError on non-200 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key'),
    });

    const client = new TMDBClient({ apiKey: 'bad-key' });
    await expect(client.searchTv('test')).rejects.toThrow(TMDBError);
  });

  it('should normalize search results to TMDBMatch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              id: 789,
              name: '低智商犯罪',
              original_name: 'Born with Luck',
              first_air_date: '2026-03-15',
              overview: 'Crime drama',
              poster_path: '/poster.jpg',
            },
          ],
        }),
    });

    const client = new TMDBClient({ apiKey: 'test-key', language: 'zh-CN' });
    const matches = await client.search('低智商犯罪', 'tv');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      id: 789,
      type: 'tv',
      displayName: '低智商犯罪',
      originalName: 'Born with Luck',
      year: 2026,
      imdbId: undefined,
      overview: 'Crime drama',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    });
  });

  it('should get movie details with imdb_id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 100,
          title: '阿凡达',
          original_title: 'Avatar',
          release_date: '2009-12-18',
          imdb_id: 'tt0499549',
          overview: 'A movie',
        }),
    });

    const client = new TMDBClient({ apiKey: 'test-key' });
    const details = await client.getMovieDetails(100);

    expect(details.imdb_id).toBe('tt0499549');
    expect(details.title).toBe('阿凡达');
  });

  it('should rate limit requests', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });
    });

    const client = new TMDBClient({ apiKey: 'test-key' });

    // Two rapid requests
    await client.searchTv('test1');
    await client.searchTv('test2');

    expect(callCount).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
