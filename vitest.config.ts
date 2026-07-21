import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      // ADR-001 成功指標：核心邏輯 line coverage ≥ 80%
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
