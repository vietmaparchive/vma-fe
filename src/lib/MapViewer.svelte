<script lang="ts">
  import { onMount } from 'svelte';
  import 'ol/ol.css';
  import Map from 'ol/Map';
  import View from 'ol/View';
  import TileLayer from 'ol/layer/Tile';
  import OSM from 'ol/source/OSM';
  import XYZ from 'ol/source/XYZ';
  import { fromLonLat } from 'ol/proj';
  import { selectedBasemap } from './store';

  let mapTarget: HTMLDivElement;
  let map: Map;

  const basemaps = {
    esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    },
    'google-street': {
      url: 'http://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', // Placeholder
    },
    'google-satellite': {
      url: 'http://mt.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', // Placeholder
    },
  };

  let tileLayer = new TileLayer({
    source: new OSM(),
  });

  selectedBasemap.subscribe((basemap) => {
    if (map) {
      const newSource = new XYZ({
        url: basemaps[basemap].url,
      });
      tileLayer.setSource(newSource);
    }
  });

  onMount(() => {
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

<div bind:this={mapTarget} class="map"></div>

<style>
  .map {
    width: 100%;
    height: 100%;
  }
</style>

