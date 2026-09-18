import { describe, it, expect } from 'vitest';
import { parseEntityKeys } from '../server/modules/git/entity-parser.ts';

describe('Git Entity Auto-Linker Unit Tests', () => {
  it('extracts single work item key from commit message', () => {
    const message = 'feat(auth): [WRK-101] implement bcrypt hashing with 12 rounds';
    const keys = parseEntityKeys(message);
    expect(keys).toEqual(['WRK-101']);
  });

  it('extracts multiple distinct keys from commit message', () => {
    const message = 'fix: resolve query bottleneck [WRK-102] linked to ticket [TCK-55]';
    const keys = parseEntityKeys(message);
    expect(keys).toEqual(['WRK-102', 'TCK-55']);
  });

  it('handles duplicates and returns unique keys', () => {
    const message = 'fix(core): [WRK-101] re-run test for [WRK-101]';
    const keys = parseEntityKeys(message);
    expect(keys).toEqual(['WRK-101']);
  });

  it('returns empty array if message contains no valid pattern', () => {
    const message = 'chore: update README documentation';
    const keys = parseEntityKeys(message);
    expect(keys).toEqual([]);
  });
});
