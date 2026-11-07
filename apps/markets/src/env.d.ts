/// <reference types="vite/client" />
/// <reference types="@isoloop/vite/client" />

interface ImportMetaEnv {
  /** Which of the five builds this is (vite.config.ts). */
  readonly MARKETS_BUILD: 'isoloop' | 'native' | 'isoloop-preact' | 'native-preact' | 'mixed';
}
