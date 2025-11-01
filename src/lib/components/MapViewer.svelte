<script lang="ts">
  import { onMount } from "svelte";
  import Map from "ol/Map";
  import View from "ol/View";
  import TileLayer from "ol/layer/Tile";
  import XYZ from "ol/source/XYZ";
  import { fromLonLat } from "ol/proj";
  import {
    lensRadius,
    mapOpacity,
    selectedBasemap,
    selectedMapId,
    viewMode,
  } from "../store";
  import { BaseMaps, MapViewModes, type BasemapKey } from "$lib/types/const";
  import { WarpedMapLayer } from "@allmaps/openlayers";
  import { browser } from "$app/environment";

  let mapTarget: HTMLDivElement;
  let map: Map;
  let warpedMapLayer: WarpedMapLayer | any;
  let currentMapId: string | null = null;

  // Add caching and loading state management
  interface CachedMapData {
    mapId: string;
    annotation: any;
    timestamp: number;
  }

  let overlayCache: Record<string, CachedMapData> = {};
  console.log("Initialized overlayCache:", overlayCache);
  let isLoading = false;
  let loadingController: AbortController | null = null;
  const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  // Basemap layer
  let tileLayer = new TileLayer({
    source: new XYZ({
      url: BaseMaps.ERSI.url,
      attributions: BaseMaps.ERSI.attributions,
      crossOrigin: "anonymous",
    }),
    zIndex: 0,
  });

  // Function to update basemap layer
  function handleBasemapChange(basemap: BasemapKey) {
    if (map && tileLayer && BaseMaps[basemap]) {
      const config = BaseMaps[basemap];
      tileLayer.setSource(
        new XYZ({
          url: config.url,
          attributions: config.attributions,
          crossOrigin: "anonymous",
          maxZoom: 22,
        }),
      );
    }
  }

  // Enhanced function to handle historical map loading with caching
  async function loadHistoricalMap(mapId: string) {
    if (!mapId || !warpedMapLayer || isLoading) return;

    // Cancel any ongoing loading
    if (loadingController) {
      loadingController.abort();
    }

    loadingController = new AbortController();
    const signal = loadingController.signal;
    isLoading = true;

    try {
      // clear previous map
      if (currentMapId) {
        console.log("Clearing previous map with ID:", currentMapId);
        await warpedMapLayer.removeGeoreferenceAnnotationByUrl(currentMapId);
        console.log("Cleared previous map with ID:", currentMapId);
        currentMapId = null;
      }

      let annotation;
      let resultMapId;

      // Check cache first
      const cached = overlayCache[mapId];
      const now = Date.now();

      if (cached && now - cached.timestamp < CACHE_EXPIRY_MS) {
        console.log("Loading map from cache:", mapId);
        annotation = cached.annotation;
        resultMapId = cached.mapId;

        // Add from cached annotation
        const mapIds =
          await warpedMapLayer.addGeoreferenceAnnotation(annotation);
        if (signal.aborted) return;

        if (mapIds && mapIds.length > 0 && typeof mapIds[0] === "string") {
          resultMapId = mapIds[0];
        }
      } else {
        console.log("Loading map from network:", mapId);

        // Use annotation_page_url if available, otherwise fall back to constructed URL
        const annotationUrl =
          `https://annotations.allmaps.org/images/${mapId}`;

        // Fetch annotation data
        const response = await fetch(annotationUrl, { signal });
        if (!response.ok) {
          throw new Error(`Annotation not found (HTTP ${response.status})`);
        }

        annotation = await response.json();
        console.log("Fetched annotation:", annotation);
        if (signal.aborted) return;

        const mapIds =
          await warpedMapLayer.addGeoreferenceAnnotation(annotation);
        if (signal.aborted) return;

        if (!mapIds || mapIds.length === 0 || mapIds[0] instanceof Error) {
          throw mapIds[0] || new Error("Failed to add map to layer.");
        }

        resultMapId = mapIds[0];

        // Cache the result
        overlayCache[mapId] = {
          mapId: resultMapId,
          annotation: annotation,
          timestamp: now,
        };
      }

      currentMapId = resultMapId;
      console.log("Successfully loaded historical map with ID:", currentMapId);

      // Ensure layer is added to map
      if (map && !map.getLayers().getArray().includes(warpedMapLayer)) {
        map.addLayer(warpedMapLayer as any);
      }

      // Set opacity
      warpedMapLayer.setOpacity($mapOpacity);

      // Update clipping after a short delay to ensure map is rendered
      setTimeout(() => {
        updateViewModeClipping();
      }, 100);
    } catch (error) {
      if (!signal.aborted) {
        console.error("Error loading historical map:", error);
        // You might want to emit an event or update a store here for error handling
      }
    } finally {
      isLoading = false;
      loadingController = null;
    }
  }

  // Cleanup function for cache management
  function cleanupCache() {
    const now = Date.now();
    Object.keys(overlayCache).forEach((key) => {
      if (now - overlayCache[key].timestamp > CACHE_EXPIRY_MS) {
        delete overlayCache[key];
      }
    });
  }

  // Preload function for smoother user experience
  async function preloadMap(mapId: string) {
    if (!mapId || overlayCache[mapId] || isLoading) return;

    try {
      const annotationUrl = `https://annotations.allmaps.org/images/${mapId}`;

      const response = await fetch(annotationUrl);
      if (response.ok) {
        const annotation = await response.json();
        overlayCache[mapId] = {
          mapId: "",
          annotation,
          timestamp: Date.now(),
        };
        console.log("Preloaded map data for:", mapId);
      }
    } catch (error) {
      console.log("Failed to preload map:", mapId, error);
    }
  }

  // update view mode for warpedMapLayer
  function updateViewModeClipping() {
    if (!browser || !map || !warpedMapLayer) return;

    const [width, height] = map.getSize();
    if (!width || !height) return;

    // update basemap clipping
    updateBasemapClipping(width, height);

    // update warpedMapLayer clipping based on view mode
    updateWarpedMapClipping(width, height);
  }

  function updateBasemapClipping(width: number, height: number) {
    const viewport = map.getViewport();
    const canvas = viewport.querySelector("canvas");
    if (!canvas) return;

    switch ($viewMode) {
      case MapViewModes.OVERLAY:
        canvas.style.clipPath = "";
        break;
      case MapViewModes.SIDE_X:
        const xPos = width / 2;
        canvas.style.clipPath = `polygon(0 0, ${xPos}px 0, ${xPos}px 100%, 0 100%)`;
        break;
      case MapViewModes.SIDE_Y:
        const yPos = height / 2;
        canvas.style.clipPath = `polygon(0 0, 100% 0, 100% ${yPos}px, 0 ${yPos}px)`;
        break;
      case MapViewModes.SPYGLASS:
        canvas.style.clipPath = "";
        break;
      default:
        canvas.style.clipPath = "";
        break;
    }
  }

  function updateWarpedMapClipping(width: number, height: number) {
    if (!warpedMapLayer || !currentMapId) return;

    const canvas = warpedMapLayer.getCanvas();
    if (!canvas) return;

    switch ($viewMode) {
      case MapViewModes.OVERLAY:
        canvas.style.clipPath = "";
        break;
      case MapViewModes.SIDE_X:
        const xPos = width / 2;
        canvas.style.clipPath = `polygon(${xPos}px 0, 100% 0, 100% 100%, ${xPos}px 100%)`;
        break;
      case MapViewModes.SIDE_Y:
        const yPos = height / 2;
        canvas.style.clipPath = `polygon(0 ${yPos}px, 100% ${yPos}px, 100% 100%, 0 100%)`;
        break;
      case MapViewModes.SPYGLASS:
        updateSpyglassClipping(width, height);
        break;
      default:
        canvas.style.clipPath = "";
        break;
    }
  }

  function updateSpyglassClipping(width: number, height: number) {
    if (!warpedMapLayer || !currentMapId) return;

    const canvas = warpedMapLayer.getCanvas();
    if (!canvas) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = $lensRadius || Math.min(width, height) / 4;

    canvas.style.clipPath = `circle(${radius}px at ${centerX}px ${centerY}px)`;
  }

  function updateMapLensRadius() {
    if (
      !browser ||
      !map ||
      !warpedMapLayer ||
      $viewMode !== MapViewModes.SPYGLASS
    )
      return;

    const [width, height] = map.getSize();
    if (!width || !height) return;

    updateSpyglassClipping(width, height);
  }

  // Subscribe to basemap changes (after map is initialized)
  $: if (map && $selectedBasemap) {
    handleBasemapChange($selectedBasemap);
  }

  // Subscribe to map selection changes
  $: if (map && $selectedMapId) {
    loadHistoricalMap($selectedMapId);
  }
  // let mapLoadTimeout: ReturnType<typeof setTimeout>;
  // $: if (map && $selectedMapId) {
  //   // Clear any pending load
  //   if (mapLoadTimeout) clearTimeout(mapLoadTimeout);

  //   // Debounce map loading to prevent rapid successive calls
  //   mapLoadTimeout = setTimeout(() => {
  //     loadHistoricalMap($selectedMapId);
  //   }, 100);

  //   // verify the cache
  //   console.log("Current overlayCache state:", overlayCache);
  // }

  // Subscribe to map opacity changes
  $: if (map && warpedMapLayer && $mapOpacity !== undefined) {
    warpedMapLayer.setOpacity($mapOpacity);
  }

  // Subscribe to view mode changes
  $: if (map && warpedMapLayer) {
    updateViewModeClipping();
  }

  // Subscribe to lens radius changes for spyglass mode
  $: if (
    map &&
    warpedMapLayer &&
    $viewMode === MapViewModes.SPYGLASS &&
    $lensRadius !== undefined
  ) {
    updateMapLensRadius();
  }

  onMount(() => {
    map = new Map({
      target: mapTarget,
      layers: [tileLayer],
      view: new View({
        center: fromLonLat([106.70098, 10.77653]),
        zoom: 14,
      }),
    });

    warpedMapLayer = new WarpedMapLayer({
      zIndex: 10,
    });

    map.on(["change:size", "moveend"], () => {
      updateViewModeClipping();
    });

    // Set up periodic cache cleanup
    const cacheCleanupInterval = setInterval(cleanupCache, 15 * 60 * 1000); // Every 15 minutes

    // Cleanup on component destroy
    return () => {
      if (loadingController) {
        loadingController.abort();
      }
      clearInterval(cacheCleanupInterval);
    };
  });

  // Export preload function for external use
  export { preloadMap };
</script>

<div bind:this={mapTarget} class="w-full h-full">
  {#if isLoading}
    <div
      class="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md"
    >
      <div
        class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"
      ></div>
      <span class="text-sm text-gray-700">Loading map...</span>
    </div>
  {/if}
</div>
