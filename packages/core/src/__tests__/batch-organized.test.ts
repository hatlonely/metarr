import { describe, it, expect } from 'vitest';
import { isAlreadyOrganized } from '../batch/analyze.js';
import type { RenamePlan } from '../types/renamer.js';

const plan = (tasks: RenamePlan['tasks']): RenamePlan => ({
  mediaType: 'movie', sourcePath: '/p/X', destPath: '/p', tasks,
});

describe('isAlreadyOrganized', () => {
  it('false when there is no plan', () => {
    expect(isAlreadyOrganized(undefined)).toBe(false);
  });

  it('true when every rename keeps the same path (files already named right)', () => {
    expect(
      isAlreadyOrganized(
        plan([
          { operation: 'create-dir', source: '', target: '/p/X (2020)', description: '' },
          { operation: 'rename', source: '/p/X (2020)/X (2020).mkv', target: '/p/X (2020)/X (2020).mkv', description: '' },
        ]),
      ),
    ).toBe(true);
  });

  it('false when any rename actually moves a file', () => {
    expect(
      isAlreadyOrganized(
        plan([
          { operation: 'create-dir', source: '', target: '/p/X (2020)', description: '' },
          { operation: 'rename', source: '/p/movie.mkv', target: '/p/X (2020)/X (2020).mkv', description: '' },
        ]),
      ),
    ).toBe(false);
  });

  it('false when there are no rename tasks at all', () => {
    expect(
      isAlreadyOrganized(plan([{ operation: 'create-dir', source: '', target: '/p/X (2020)', description: '' }])),
    ).toBe(false);
  });
});
