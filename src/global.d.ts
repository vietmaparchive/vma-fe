import type { MapData } from './lib/types';

declare global {
  interface Window {
    allMapsData?: MapData[];
  }
}

export {};