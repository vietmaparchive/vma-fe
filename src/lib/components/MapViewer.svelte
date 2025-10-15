<script lang="ts">
  import { onMount } from "svelte";
  import Map from "ol/Map";
  import View from "ol/View";
  import TileLayer from "ol/layer/Tile";
  import XYZ from "ol/source/XYZ";
  import { fromLonLat } from "ol/proj";
  import { selectedBasemap, selectedMapId, viewMode } from "../store";
  import { BaseMaps, MapViewModes, type BasemapKey } from "$lib/types/const";
  import { WarpedMapLayer } from "@allmaps/openlayers";
    import { browser } from "$app/environment";

  let mapTarget: HTMLDivElement;
  let map: Map;
  let warpedMapLayer: WarpedMapLayer | any;
  let currentMapId: string | null = null;
  

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

  // Function to handle historical map loading
  async function loadHistoricalMap(mapId: string) {
    if (!mapId || !warpedMapLayer) return;

    // clear existing layer if any
    if (currentMapId) {
      warpedMapLayer.removeGeoreferencedMapById(currentMapId);
      currentMapId = null;
    }

    const annotationUrl = `https://annotations.allmaps.org/images/${mapId}`;
    const mapIds = await warpedMapLayer.addGeoreferenceAnnotationByUrl(annotationUrl);
    if (mapIds && mapIds.length > 0 && typeof mapIds[0] === "string") {
      currentMapId = mapIds[0];
      console.log("Loaded historical map with ID:", currentMapId);
      if (map && !map.getLayers().getArray().includes(warpedMapLayer)) {
        map.addLayer(warpedMapLayer as any);
      }
    
      // Zoom to the extent of the newly added map
      const extent = warpedMapLayer.getExtent();

      // set opacity
      warpedMapLayer.setOpacity(0.8);

      // update clipping after a short delay to ensure map is rendered
      updateViewModeClipping();
    } else {
      console.error("No valid map IDs returned from addGeoreferenceAnnotation");
    }
  }

  // update view mode for warpedMapLayer
  function updateViewModeClipping() {
    if (!browser || !map || !warpedMapLayer) return;

    const [width, height] = map.getSize();
    if (!width || !height) return;

    // update basemap clipping
    // updateBasemapClipping(width, height);

    // update warpedMapLayer clipping based on view mode
    updateWarpedMapClipping(width, height);
  }

  function updateBasemapClipping(width: number, height: number) {
    const canvas = tileLayer.getRenderer();
    if (!canvas) return;

    switch ($viewMode) {
      case MapViewModes.OVERLAY:
        // clip the basemap to the left half of the canvas
        canvas.style.clipPath = '';
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
        const radius = Math.min(width, height) / 4;
        const centerX = width / 2;
        const centerY = height / 2;
        canvas.style.clipPath = `circle(${radius}px at ${centerX}px ${centerY}px)`;
        break;
      default:
        canvas.style.clipPath = '';
        break;
    }
  }

  function updateWarpedMapClipping(width: number, height: number) {
    if (!warpedMapLayer || !currentMapId) return;

    const canvas = warpedMapLayer.getCanvas();
    if (!canvas) return;
    console.log("Updating warped map clipping for view mode:", $viewMode);

    switch ($viewMode) {
      case MapViewModes.OVERLAY:
        // no clipping
        canvas.style.clipPath = '';
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
        const radius = Math.min(width, height) / 4;
        const centerX = width / 2;
        const centerY = height / 2;
        canvas.style.clipPath = `circle(${radius}px at ${centerX}px ${centerY}px)`;
        break;
      default:
        canvas.style.clipPath = '';
        break;
    }
  }

  // Subscribe to basemap changes (after map is initialized)
  $: if (map && $selectedBasemap) {
    handleBasemapChange($selectedBasemap);
  }

  // Subscribe to map selection changes
  $: if (map && $selectedMapId) {
    loadHistoricalMap($selectedMapId);
  }

  // Subscribe to view mode changes
  $: if (map && warpedMapLayer) {
    updateViewModeClipping();
  }

  onMount(async () => {
    map = new Map({
      target: mapTarget,
      layers: [tileLayer],
      view: new View({
        center: fromLonLat([106.70098, 10.77653]),
        zoom: 14,
      }),
    });

    warpedMapLayer = new WarpedMapLayer({
      zIndex: 10
    });

    map.on(['change:size', 'moveend'], () => {
      updateViewModeClipping();
    });
  });
</script>

<div bind:this={mapTarget} class="w-full h-full"></div>
