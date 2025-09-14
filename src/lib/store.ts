import { writable } from 'svelte/store';
import { MapViewModes, type MapViewMode } from './types/const';

export const selectedBasemap = writable('esri');
export const selectedMapType = writable('all');
export const mapOpacity = writable(0.8);
export const selectedMapId = writable('');
export const viewMode = writable<MapViewMode>(MapViewModes.OVERLAY);