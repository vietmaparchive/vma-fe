<script lang="ts">
import { onMount } from 'svelte';

let mapTarget: HTMLDivElement;
let map: any;
let baseLayer: any;
let selected: string = 'esri';
let ol: any;

const basemaps: Record<string, { label: string; url: string }> = {
  esri: {
    label: 'Esri World Imagery',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  },
  gstreets: {
    label: 'Google Streets',
    url: 'https://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
  },
  gsat: {
    label: 'Google Satellite',
    url: 'https://mt{0-3}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
  }
};

onMount(async () => {
  // @ts-ignore - external module without types
  const olModule = await import('https://cdn.jsdelivr.net/npm/ol@7.4.0/dist/ol.js');
  ol = olModule.default;
  const { Map, View, layer, source, proj } = ol;
  baseLayer = new layer.Tile({
    source: new source.XYZ({
      url: basemaps[selected].url
    })
  });
  map = new Map({
    target: mapTarget,
    layers: [baseLayer],
    view: new View({
      center: proj.fromLonLat([0, 0]),
      zoom: 2
    })
  });
});

function changeBasemap() {
  if (baseLayer && ol) {
    const { source } = ol;
    baseLayer.setSource(
      new source.XYZ({
        url: basemaps[selected].url
      })
    );
  }
}
</script>

<div class="controls">
  <label>
    Basemap:
    <select bind:value={selected} on:change={changeBasemap}>
      {#each Object.entries(basemaps) as [key, bm]}
        <option value={key}>{bm.label}</option>
      {/each}
    </select>
  </label>
</div>
<div bind:this={mapTarget} class="map"></div>

<style>
.map {
  width: 100%;
  height: 80vh;
}
.controls {
  margin-bottom: 0.5rem;
}
</style>

