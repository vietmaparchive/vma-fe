import type { MapData, MapResponse } from "$lib/types";

// Load map from Google Sheets CSV
export async function loadMapDataset(): Promise<MapData[]> {
    const googleSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQivs6N80xA_Pgs0J8MMMTGcH4YLzjhhyxPUoMcoQTxHjUyRXo5FMOICXDSxayDcLYisABkoqvXiIiA/pub?gid=0&single=true&output=csv";

    try {
        const response = await fetch(googleSheetUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        const lines = csvText.trim().split(/\r?\n/);
        const header = lines.shift()?.split(',').map(h => h.trim().toLowerCase()) || [];

        const nameIndex = header.indexOf('name');
        const idIndex = header.indexOf('id');
        const typeIndex = header.indexOf('type');

        if (nameIndex === -1 || idIndex === -1 || typeIndex === -1) {
            throw new Error("CSV must have 'name', 'id', and 'type' columns.");
        }

        const allMapsData = lines.map(line => {
            const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g) || [];
            const name = (values[nameIndex] || '').replace(/"/g, '').trim();
            const id = (values[idIndex] || '').replace(/"/g, '').trim();
            const type = typeIndex > -1 ? (values[typeIndex] || '').replace(/"/g, '').trim() : 'Uncategorized';
            return (name && id) ? { name, id, type } : null;
        }).filter((item): item is MapData => item !== null);

        console.log(`Loaded ${allMapsData.length} historical maps`);

        return allMapsData;

    } catch (error) {
        console.error("Error loading map dataset:", error);
        return [];
    }
}

export async function loadMapAnnotation(mapId: string): Promise<void> {
     const annotationUrl = `https://annotations.allmaps.org/images/${mapId}`;
     try {
        const response = await fetch(annotationUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Map annotation data:", data);
        
     } catch (error) {
        console.error("Error loading map annotation:", error);
     }
}