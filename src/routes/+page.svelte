<script lang="ts">
  import MapViewer from '$lib/components/map/MapViewer.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
</script>

<main>
  <Sidebar />
  <MapViewer />
</main>

<style>
  main {
    display: flex;
    height: 100%;
  }
</style>

