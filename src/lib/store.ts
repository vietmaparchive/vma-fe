import { writable } from 'svelte/store';
import { BaseMaps, MapViewModes, type MapViewMode, type BasemapKey } from './types/const';

export const selectedBasemap = writable<BasemapKey>('ERSI'); // Changed to string key
export const selectedMapType = writable('all');
export const mapOpacity = writable(0.8);
export const selectedMapId = writable('');
export const viewMode = writable<MapViewMode>(MapViewModes.OVERLAY);
export const opacity = writable(0.8);