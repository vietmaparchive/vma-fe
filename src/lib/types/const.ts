export const MapViewModes = {
    OVERLAY: 'overlay',
    SIDE_X: 'side-x',
    SIDE_Y: 'side-y',
    SPYGLASS: 'spyglass'
} as const;
export type MapViewMode = typeof MapViewModes[keyof typeof MapViewModes];

export const BaseMaps = {
    ERSI: {
        name: 'Esri World Imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">Esri</a>'
    },
    GOOGLE_STREET: {
        name: 'Google Street',
        url: 'http://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', // Placeholder
        attributions: 'Tiles © <a href="https://www.google.com/earth/">Google</a>'
    },
    GOOGLE_SATELLITE: {
        name: 'Google Satellite',
        url: 'http://mt.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Placeholder
        attributions: 'Tiles © <a href="https://www.google.com/earth/">Google</a>'
    },
} as const;
export type BasemapKey = keyof typeof BaseMaps;



