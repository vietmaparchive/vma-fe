export const MapViewModes = {
    OVERLAY: 'overlay',
    SIDE_X: 'side-x',
    SIDE_Y: 'side-y',
    SPYGLASS: 'spyglass'
} as const;
export type MapViewMode = typeof MapViewModes[keyof typeof MapViewModes];

export const ViewModeButtons = [
    {
        mode: MapViewModes.OVERLAY,
        label: 'Overlay',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
        mode: MapViewModes.SIDE_X,
        label: 'Side X',
        icon: 'M4 6h16v12H4zM12 6v12'
    },
    {
        mode: MapViewModes.SIDE_Y,
        label: 'Side Y',
        icon: 'M4 6h16v12H4zM4 12h16'
    },
    {
        mode: MapViewModes.SPYGLASS,
        label: 'Spyglass',
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    }
] as const;

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



