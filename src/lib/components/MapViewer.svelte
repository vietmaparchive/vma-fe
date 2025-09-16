<script lang="ts">
  import { onMount } from 'svelte';
  import Map from 'ol/Map';
  import View from 'ol/View';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';
  import XYZ from 'ol/source/XYZ';
  import { fromLonLat } from 'ol/proj';
  import { selectedBasemap } from '../store';
  import {loadMapDataset} from '../services/mapDataService';
  import { BaseMaps, type BasemapKey, type BasemapType } from '$lib/types/const';
    import { load } from 'ol/Image';

  let mapTarget: HTMLDivElement;
  let map: Map;

  // Basemap layer
  let tileLayer = new TileLayer({
    source: new XYZ({
      url: BaseMaps.ERSI.url,
      attributions: BaseMaps.ERSI.attributions,
      crossOrigin: 'anonymous',
    }),
    zIndex: 0,
  });

  // Function to update basemap layer
  function handleBasemapChange(basemap: BasemapKey) {
    console.log('Changing basemap to:', basemap);
    if (map && tileLayer && BaseMaps[basemap]) {
      const config = BaseMaps[basemap];
      tileLayer.setSource(
        new XYZ({
          url: config.url,
          attributions: config.attributions,
          crossOrigin: 'anonymous',
          maxZoom: 22,
        })
      );
      console.log('Basemap changed to:', basemap);
    }
  }


  selectedBasemap.subscribe((basemap) => {
    if (map) {
      handleBasemapChange(basemap);
    }
  });

  onMount(async () => {
    map = new Map({
      target: mapTarget,
      layers: [tileLayer],
      view: new View({
        center: fromLonLat([106.70098, 10.77653]),
        zoom: 14,
      }),
    });

    
  });
</script>

<div bind:this={mapTarget} class="w-full h-full"></div>

