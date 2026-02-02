import { describe, it, expect } from 'vitest';
import * as Types from '@/lib/types';

describe('Types Index', () => {
  it('should export types', () => {
    expect(Types).toBeDefined();
  });
});
