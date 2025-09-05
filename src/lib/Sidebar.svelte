<script lang="ts">
  import { selectedBasemap } from './store';

  const basemaps = {
    esri: {
      name: 'Esri',
    },
    'google-street': {
      name: 'Google Street',
    },
    'google-satellite': {
      name: 'Google Satellite',
    },
  };
</script>

<div class="sidebar">
  <div class="sidebar-content">
    <h2>Basemap</h2>
    <select bind:value={$selectedBasemap}>
      {#each Object.entries(basemaps) as [id, { name }]}
        <option value={id}>{name}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  .sidebar {
    width: 300px;
    height: 100%;
    background-color: #f0f0f0;
    padding: 1rem;
    box-sizing: border-box;
  }
</style>