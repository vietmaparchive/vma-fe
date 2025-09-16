<script lang="ts">
  import { onMount } from "svelte";
  import Map from "ol/Map";
  import View from "ol/View";
  import TileLayer from "ol/layer/Tile";
  import XYZ from "ol/source/XYZ";
  import { fromLonLat } from "ol/proj";
  import { selectedBasemap, selectedMapId } from "../store";
  import { BaseMaps, type BasemapKey } from "$lib/types/const";
  import { WarpedMapLayer } from "@allmaps/openlayers";

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

    } else {
      console.error("No valid map IDs returned from addGeoreferenceAnnotation");
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

  // Subscribe to

  onMount(async () => {
    map = new Map({
      target: mapTarget,
      layers: [tileLayer],
      view: new View({
        center: fromLonLat([106.70098, 10.77653]),
        zoom: 14,
      }),
    });

    warpedMapLayer = new WarpedMapLayer();
  });
</script>

<div bind:this={mapTarget} class="w-full h-full"></div>
