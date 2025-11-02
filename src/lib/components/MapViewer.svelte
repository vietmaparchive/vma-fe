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

  // Slider state
  let sliderPosition = 50; // Percentage (0-100)
  let isDragging = false;
  let mapRect: DOMRect;

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
      cacheSize: 2048,
      minZoom: 14,
      maxZoom: 22,
      transition: 250,
    }),
    zIndex: 0,
    preload: 1,
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
          cacheSize: 2048,
          minZoom: 14,
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

        const annotationUrl = `https://annotations.allmaps.org/images/${mapId}`;

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

      // Ensure layer is added to map with proper z-index
      if (map && !map.getLayers().getArray().includes(warpedMapLayer)) {
        map.addLayer(warpedMapLayer as any);
        warpedMapLayer.setZIndex(10); // Higher than basemap
      }

      // Set opacity - this allows basemap to show through
      warpedMapLayer.setOpacity($mapOpacity);

      // Update clipping after a short delay to ensure map is rendered
      setTimeout(() => {
        updateViewModeClipping();
      }, 100);
    } catch (error) {
      if (!signal.aborted) {
        console.error("Error loading historical map:", error);
      }
    } finally {
      isLoading = false;
      loadingController = null;
    }
  }

  // Slider event handlers
  function handleSliderStart(event: MouseEvent | TouchEvent) {
    if (
      $viewMode === MapViewModes.SIDE_X ||
      $viewMode === MapViewModes.SIDE_Y
    ) {
      isDragging = true;
      mapRect = mapTarget.getBoundingClientRect();

      // Prevent map interaction
      map.getInteractions().forEach((interaction) => {
        interaction.setActive(false);
      });

      event.preventDefault();
    }
  }

  function handleSliderMove(event: MouseEvent | TouchEvent) {
    if (!isDragging || !mapRect) return;

    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    if ($viewMode === MapViewModes.SIDE_X) {
      const x = clientX - mapRect.left;
      sliderPosition = Math.max(0, Math.min(100, (x / mapRect.width) * 100));
    } else if ($viewMode === MapViewModes.SIDE_Y) {
      const y = clientY - mapRect.top;
      sliderPosition = Math.max(0, Math.min(100, (y / mapRect.height) * 100));
    }

    updateViewModeClipping();
    event.preventDefault();
  }

  function handleSliderEnd() {
    isDragging = false;

    // Re-enable map interactions
    map.getInteractions().forEach((interaction) => {
      interaction.setActive(true);
    });
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

    requestAnimationFrame(() => {
      // update basemap clipping
      updateBasemapClipping(width, height);

      // update warpedMapLayer clipping based on view mode
      updateWarpedMapClipping(width, height);
    });
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
        canvas.style.clipPath = "";
        // canvas.style.clipPath = `polygon(0 0, ${xPos}px 0, ${xPos}px 100%, 0 100%)`;
        break;
      case MapViewModes.SIDE_Y:
        canvas.style.clipPath = "";
        // const yPos = height / 2;
        // canvas.style.clipPath = `polygon(0 0, 100% 0, 100% ${yPos}px, 0 ${yPos}px)`;
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
        const xPos = (width * sliderPosition) / 100;
        canvas.style.clipPath = `polygon(${xPos}px 0, 100% 0, 100% 100%, ${xPos}px 100%)`;
        break;
      case MapViewModes.SIDE_Y:
        const yPos = (height * sliderPosition) / 100;
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

  // Subscribe to map opacity changes
  $: if (map && warpedMapLayer && $mapOpacity !== undefined) {
    warpedMapLayer.setOpacity($mapOpacity);
  }

  // Subscribe to view mode changes
  $: if (map && warpedMapLayer && $viewMode !== MapViewModes.SPYGLASS) {
    // Reset slider position when changing view modes
    if (
      $viewMode === MapViewModes.SIDE_X ||
      $viewMode === MapViewModes.SIDE_Y
    ) {
      sliderPosition = 50;
    }
    requestAnimationFrame(() => {
      updateViewModeClipping();
    });
  }

  // Subscribe to lens radius changes for spyglass mode
  $: if (
    map &&
    warpedMapLayer &&
    $viewMode === MapViewModes.SPYGLASS &&
    $lensRadius !== undefined
  ) {
    updateMapLensRadius();
    setTimeout(() => {
      updateBasemapClipping(...(map.getSize() || [0, 0]));
    }, 100);
  }

  onMount(() => {
    map = new Map({
      target: mapTarget,
      layers: [tileLayer],
      view: new View({
        center: fromLonLat([106.70098, 10.77653]),
        zoom: 14,
        constrainResolution: true,
        smoothResolutionConstraint: true,
        smoothExtentConstraint: true,
      }),
      controls: [], // Remove default controls to prevent interference
    });

    // UPDATED: Create WarpedMapLayer with transparency settings
    warpedMapLayer = new WarpedMapLayer({
      zIndex: 10,
      // Try to configure for transparency if available
      opacity: $mapOpacity || 1.0,
    });

    map.on(["change:size", "moveend"], () => {
      updateViewModeClipping();
    });

    // Add global event listeners for slider
    document.addEventListener("mousemove", handleSliderMove);
    document.addEventListener("mouseup", handleSliderEnd);
    document.addEventListener("touchmove", handleSliderMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleSliderEnd);

    // Set up periodic cache cleanup
    const cacheCleanupInterval = setInterval(cleanupCache, 15 * 60 * 1000);

    // Cleanup on component destroy
    return () => {
      if (loadingController) {
        loadingController.abort();
      }
      clearInterval(cacheCleanupInterval);

      // Remove event listeners
      document.removeEventListener("mousemove", handleSliderMove);
      document.removeEventListener("mouseup", handleSliderEnd);
      document.removeEventListener("touchmove", handleSliderMove);
      document.removeEventListener("touchend", handleSliderEnd);
    };
  });

  // Export preload function for external use
  export { preloadMap };
</script>

<!-- Main map container with relative positioning -->
<div bind:this={mapTarget} class="relative w-full h-full overflow-hidden">
  <!-- Enhanced loading indicator -->
  {#if isLoading}
    <div
      class="absolute top-4 left-4 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-gray-200/50 transition-all duration-300 ease-out"
    >
      <!-- Animated spinner -->
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent shadow-sm"
      ></div>

      <!-- Loading text -->
      <span class="text-sm font-medium text-gray-700 select-none"
        >Loading map data...</span
      >

      <!-- Optional progress indicator -->
      <div class="flex space-x-1">
        <div class="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
        <div
          class="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-75"
        ></div>
        <div
          class="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-150"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Error state (if needed) -->
  {#if currentMapId === null && !isLoading && $selectedMapId}
    <div
      class="absolute top-4 left-4 z-50 flex items-center gap-3 bg-red-50/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-red-200/50"
    >
      <div class="h-5 w-5 text-red-500">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <span class="text-sm font-medium text-red-700 select-none"
        >Failed to load map</span
      >
    </div>
  {/if}

  <!-- Success state indicator (optional) -->
  {#if currentMapId && !isLoading}
    <div
      class="absolute top-4 right-4 z-50 flex items-center gap-2 bg-green-50/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-green-200/50 transition-all duration-300 ease-out opacity-100 animate-fade-in"
    >
      <div class="h-4 w-4 text-green-500">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <span class="text-xs font-medium text-green-700 select-none"
        >Map loaded</span
      >
    </div>
  {/if}

  <!-- Draggable Slider for Side X mode -->
  {#if $viewMode === MapViewModes.SIDE_X && currentMapId}
    <div
      class="absolute top-0 bottom-0 z-40 w-1 bg-white/80 shadow-lg cursor-ew-resize transition-all duration-150 hover:w-2 hover:bg-white/90"
      style="left: {sliderPosition}%"
      on:mousedown={handleSliderStart}
      on:touchstart={handleSliderStart}
      role="slider"
      tabindex="0"
      aria-label="Adjust split position"
      aria-valuenow={sliderPosition}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <!-- Slider handle -->
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center"
      >
        <div class="w-1 h-3 bg-gray-400 rounded-full"></div>
        <div class="w-1 h-3 bg-gray-400 rounded-full ml-0.5"></div>
      </div>
    </div>
  {/if}

  <!-- Draggable Slider for Side Y mode -->
  {#if $viewMode === MapViewModes.SIDE_Y && currentMapId}
    <div
      class="absolute left-0 right-0 z-40 h-1 bg-white/80 shadow-lg cursor-ns-resize transition-all duration-150 hover:h-2 hover:bg-white/90"
      style="top: {sliderPosition}%"
      on:mousedown={handleSliderStart}
      on:touchstart={handleSliderStart}
      role="slider"
      tabindex="0"
      aria-label="Adjust split position"
      aria-valuenow={sliderPosition}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <!-- Slider handle -->
      <div
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center"
      >
        <div class="h-1 w-3 bg-gray-400 rounded-full"></div>
        <div class="h-1 w-3 bg-gray-400 rounded-full mt-0.5"></div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom Tailwind animations and utilities */
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  /* ENHANCED: Remove backgrounds and enable transparency */
  :global(.ol-layer canvas) {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* Specific targeting for warped map layer */
  :global(.allmaps-warped-map-layer canvas) {
    background: transparent !important;
    background-color: transparent !important;
    mix-blend-mode: normal;
  }

  /* Ensure proper layering and transparency */
  :global(.ol-viewport) {
    background: transparent;
  }

  :global(.ol-viewport .ol-layers) {
    background: transparent;
  }

  /* Force transparency on all map-related canvases */
  :global(canvas) {
    background-color: transparent !important;
  }

  /* Smooth transitions for map layers */
  :global(.ol-layer) {
    transition: opacity 0.25s ease-in-out;
  }

  /* Hide OpenLayers attribution in bottom right */
  :global(.ol-attribution) {
    @apply hidden;
  }

  /* Custom scrollbar for any overflow (if needed) */
  :global(.ol-viewport::-webkit-scrollbar) {
    display: none;
  }

  /* Prevent text selection on map */
  :global(.ol-viewport) {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Smooth cursor changes for different view modes */
  :global(.ol-viewport) {
    transition: cursor 0.15s ease;
  }

  /* Custom cursor styles for sliders */
  .cursor-ew-resize {
    cursor: ew-resize;
  }

  .cursor-ns-resize {
    cursor: ns-resize;
  }
</style>
