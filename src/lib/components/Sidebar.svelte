<script lang="ts">
  import Map from "./sidebar/Map.svelte";

  let activeTab = "map";

  const tabs = [
    { id: "map", label: "Map" },
    { id: "annotation", label: "Annotation" },
    { id: "story", label: "Story" },
    { id: "info", label: "Info" },
  ];

  function setActiveTab(tabId: string) {
    activeTab = tabId;
  }

  const basemaps = {
    esri: {
      name: "Esri",
    },
    "google-street": {
      name: "Google Street",
    },
    "google-satellite": {
      name: "Google Satellite",
    },
  };
</script>

<div class="w-1/3 h-full bg-gray-100">
  <!-- Header Section -->
  <header
    class="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-white"
  >
    <div class="flex items-center gap-3 overflow-hidden">
      <img
        src="https://raw.githubusercontent.com/lqtue/VMA/main/data/logo.png"
        alt="Logo"
        class="w-8 h-8 flex-shrink-0"
      />
      <div class="collapsible-content">
        <h1 class="text-lg font-bold text-gray-800">
          Vietnam Map Archive project
        </h1>
        <p class="text-xs text-gray-500">Map Viewer</p>
      </div>
    </div>
    <div class="collapsible-content"></div>
  </header>

  <!-- Tab Headers -->
  <div class="flex border-b border-gray-200">
    {#each tabs as tab}
      <button
        class="flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors duration-200 {activeTab ===
        tab.id
          ? 'text-blue-600 border-blue-600 bg-white'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}"
        on:click={() => setActiveTab(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  <div>
    {#if activeTab === "map"}
      <Map />
    {:else if activeTab === "annotation"}
      <p class="p-4 text-gray-600">Annotations content goes here.</p>
    {:else if activeTab === "story"}
      <p class="p-4 text-gray-600">Story content goes here.</p>
    {:else if activeTab === "info"}
      <p class="p-4 text-gray-600">Info content goes here.</p>
    {/if}
  </div>
</div>
