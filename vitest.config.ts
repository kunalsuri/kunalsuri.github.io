import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only look inside the tests/ directory.
    include: ['tests/**/*.test.ts'],
    // Default Node environment — no JSDOM needed for utility and build tests.
    environment: 'node',
    // Show individual test names in output.
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      // Allow tests to import from src/ the same way project code does.
      '@/': new URL('./src/', import.meta.url).pathname,
      // Mock astro:content to avoid runtime dependency during unit testing.
      'astro:content': new URL('./tests/mocks/astro-content.ts', import.meta.url).pathname,
    },
  },
});
