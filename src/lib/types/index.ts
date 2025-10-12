export interface MapData {
    id: string;
    name: string;
    type: string;
    annotation_page_url?: string;
}

export interface MapResponse {
    mapId: string;
    success: boolean;
    message?: string;
}
