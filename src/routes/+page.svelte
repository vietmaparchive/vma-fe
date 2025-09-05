<script lang="ts">
  import MapViewer from '$lib/MapViewer.svelte';
  import Sidebar from '$lib/Sidebar.svelte';
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

