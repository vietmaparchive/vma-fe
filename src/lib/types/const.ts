export const MapViewModes = {
    OVERLAY: 'overlay',
    SIDE_X: 'side-x',
    SIDE_Y: 'side-y',
    SPYGLASS: 'spyglass'
} as const;
export type MapViewMode = typeof MapViewModes[keyof typeof MapViewModes];

