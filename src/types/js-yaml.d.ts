// js-yaml ships no TypeScript declarations of its own (verified: no .d.ts
// anywhere in node_modules/js-yaml) and @types/js-yaml can't be installed on
// this machine right now, so this is a small hand-written ambient module
// covering only the surface src/utils/frontmatter.ts actually calls.
declare module 'js-yaml' {
  export interface DumpOptions {
    indent?: number;
    lineWidth?: number;
    sortKeys?: boolean | ((a: string, b: string) => number);
    flowLevel?: number;
    quotingType?: '"' | "'";
    forceQuotes?: boolean;
    skipInvalid?: boolean;
    noRefs?: boolean;
  }

  export interface LoadOptions {
    schema?: unknown;
    json?: boolean;
  }

  export const JSON_SCHEMA: unknown;
  export const DEFAULT_SCHEMA: unknown;

  export function load(input: string, options?: LoadOptions): unknown;
  export function dump(input: unknown, options?: DumpOptions): string;
}
