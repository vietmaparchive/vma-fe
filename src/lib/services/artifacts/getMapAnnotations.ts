import type { MapData } from "$lib/types";
import { httpClient } from "$lib/services/http";
import { API_URLS } from "$lib/services/http/apiConfig";
import { logError } from "$lib/services/http/errorHandler";

/**
 * Load map dataset from the API
 * Uses the HTTP client to fetch and process map data
 */
export async function getMapDataset(): Promise<MapData[]> {
    try {
        const response = await httpClient.get<any[]>(API_URLS.getArtifacts());
        
        // Map the API response to our MapData interface
        // Converting display_name → name, id → id, category → type
        const allMapsData = response.data.map((item: any) => {
            const name = item.display_name || '';
            const id = item.id || '';
            const type = item.category || 'Uncategorized';
            const annotation_page_url = item.annotation_page_url;
            
            return (name && id) ? { name, id, type, annotation_page_url } : null;
        }).filter((item: MapData | null): item is MapData => item !== null);

        console.log(`Loaded ${allMapsData.length} historical maps`);
        return allMapsData as MapData[];

    } catch (error) {
        logError(error);
        console.error("Error loading map dataset:", error);
        return [];
    }
}

/**
 * Load map annotation from the API
 * Uses the HTTP client to fetch annotation data for a specific map
 */
export async function getMapAnnotation(mapId: string): Promise<any> {
    try {
        const response = await httpClient.get<any>(API_URLS.getAnnotation(mapId));
        console.log("Map annotation data:", response.data);
        return response.data;
    } catch (error) {
        logError(error);
        console.error("Error loading map annotation:", error);
        return null;
    }
}