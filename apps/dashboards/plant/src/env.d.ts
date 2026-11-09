/// <reference types="vite/client" />
/// <reference types="@isoloop/vite/client" />

interface ImportMetaEnv {
  /** Which of the three builds this is (vite.config.ts). */
  readonly PLANT_BUILD: 'isoloop' | 'native' | 'native-workers';
}
