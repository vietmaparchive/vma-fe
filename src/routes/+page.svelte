<script lang="ts">
  import MapViewer from '$lib/components/MapViewer.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
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

