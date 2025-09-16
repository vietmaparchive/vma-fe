<script lang="ts">
    import { loadMapDataset } from "$lib/services/mapDataService";
    import { selectedBasemap, selectedMapType, mapOpacity, selectedMapId } from "$lib/store";
    import type { MapData } from "$lib/types";
    import { BaseMaps } from "$lib/types/const";
    import { onMount } from "svelte";

    let allMapsData: MapData[] = [];
    let filteredMaps: Array<{ value: string; label: string }> = [];
    let mapTypes = [{ value: "all", label: "All" }];

    function populateTypeFilter() {
        const typeCounts = allMapsData.reduce((acc, map) => {
            acc[map.type] = (acc[map.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        mapTypes = [
            { value: "all", label: "All" },
            ...Object.entries(typeCounts).map(([type, count]) => ({
                value: type,
                label: `${type} (${count})`,
            })),
        ];
    }

    function populateMapSelector(filterType: string) {
        filteredMaps =
            filterType === "all"
                ? allMapsData.map((map) => ({
                      value: map.id,
                      label: map.name,
                  }))
                : allMapsData
                      .filter((map) => map.type === filterType)
                      .map((map) => ({
                          value: map.id,
                          label: map.name,
                      }));
    }

    function handleMapSelection(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        console.log("Selected map ID:", selectElement.value);
        selectedMapId.set(selectElement.value);
    }


    // Reactively update map selector when filter changes
    $: if ($selectedMapType && allMapsData.length) {
        populateMapSelector($selectedMapType);
    }

    onMount(async () => {
        try {
            // Load map dataset
            allMapsData = await loadMapDataset();
            populateTypeFilter();
            populateMapSelector($selectedMapType);
        } catch (error) {
            console.error("Error loading map dataset:", error);
        }
    });
</script>

<div class="p-4 space-y-6">
    <!-- Basemap Selector -->
    <div class="space-y-2">
        <label for="basemap" class="text-sm font-medium text-gray-700"
            >Basemap</label
        >
        <select
            id="basemap"
            bind:value={$selectedBasemap}
            class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
            {#each Object.entries(BaseMaps) as [key, basemap]}
                <option value={key}>{basemap.name}</option>
            {/each}
        </select>
    </div>

    <!-- Historical Maps List -->
    <div class="space-y-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
        <h3 class="text-base font-semibold text-gray-800">Historical Map</h3>

        <div class="space-y-2">
            <label for="mapTypeFilter" class="text-sm font-medium text-gray-700"
                >Map Type</label
            >
            <select
                id="mapTypeFilter"
                bind:value={$selectedMapType}
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
                {#each mapTypes as type}
                    <option value={type.value}>{type.label}</option>
                {/each}
            </select>
        </div>

        <div class="space-y-2">
            <label for="allmapsId" class="text-sm font-medium text-gray-700"
                >Choose Map</label
            >
            <select
                id="allmapsId"
                bind:value={$selectedMapId}
                on:change={handleMapSelection}
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
                <option value="">Select a map...</option>
                {#each filteredMaps as map}
                    <option value={map.value}>{map.label}</option>
                {/each}
            </select>
        </div>

       
    </div>
</div>
