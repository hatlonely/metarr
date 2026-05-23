export class TMDBError extends Error {
  constructor(
    public statusCode: number,
    body: string,
  ) {
    super(`TMDB API error ${statusCode}: ${body}`);
    this.name = 'TMDBError';
  }
}
