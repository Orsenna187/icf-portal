<script>
    import { onMount } from 'svelte';
    // import { getDownloadURL, getMetadata, listAll, ref } from 'firebase/storage';
    import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
    import MdiPdfBox from 'virtual:icons/mdi/pdf-box';
    import MdiCalendarMonth from 'virtual:icons/mdi/calendar-month';
    import MdiDownload from 'virtual:icons/mdi/download';
    import MdiEye from 'virtual:icons/mdi/eye';
    import MdiNewBox from 'virtual:icons/mdi/new-box';
    import MdiMagnify from 'virtual:icons/mdi/magnify';
    import { db, storage } from '../lib/firebase';
    
    let newsletters = [];
    let isLoading = true;
    let error = null;
    
    // Search and filter state
    let searchQuery = '';
    let startDate = '';
    let endDate = '';
    
    // Track which newsletter preview is expanded
    let expandedPreview = null;
    
    function togglePreview(index) {
      if (expandedPreview === index) {
        expandedPreview = null;
      } else {
        expandedPreview = index;
      }
    }
    
    onMount(async () => {
      try {
        // Reference to the newsletters folder in storage
        const newslettersRef = ref(storage, 'newsletters');
        
        // List all items in the newsletters folder
        const result = await listAll(newslettersRef);
        
        // Get download URLs and metadata for each item
        const newsletterPromises = result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          return {
            name: itemRef.name,
            url,
            contentType: metadata.contentType,
            size: formatFileSize(metadata.size),
            createdAt: new Date(metadata.timeCreated),
            updatedAt: new Date(metadata.updated)
          };
        });
        
        newsletters = await Promise.all(newsletterPromises);
        // Sort by creation date (newest first)
        newsletters.sort((a, b) => b.createdAt - a.createdAt);
        
      } catch (err) {
        console.error("Error fetching newsletters:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    });
    
    // Helper function to format file size
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // Format date for display
    function formatDate(date) {
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    }

    // Format date for input value
    function formatDateForInput(date) {
      return date.toISOString().split('T')[0];
    }

    // Check if a newsletter is recent (within the last 30 days)
    function isRecent(date) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date > thirtyDaysAgo;
    }

    // Filter newsletters based on search query and date range
    $: filteredNewsletters = newsletters.filter(newsletter => {
      // Search query filter
      const nameMatch = newsletter.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date range filter
      let dateMatch = true;
      if (startDate) {
        const start = new Date(startDate);
        dateMatch = dateMatch && newsletter.createdAt >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        dateMatch = dateMatch && newsletter.createdAt <= end;
      }
      
      return nameMatch && dateMatch;
    });

    // Group newsletters by year and month
    $: groupedNewsletters = filteredNewsletters.reduce((groups, newsletter) => {
      const year = newsletter.createdAt.getFullYear();
      const month = newsletter.createdAt.getMonth();
      
      if (!groups[year]) {
        groups[year] = {};
      }
      
      if (!groups[year][month]) {
        groups[year][month] = [];
      }
      
      groups[year][month].push(newsletter);
      return groups;
    }, {});

    // Get sorted years (newest first)
    $: years = Object.keys(groupedNewsletters).sort((a, b) => b - a);

    // Get month name
    function getMonthName(monthIndex) {
      return new Date(2000, monthIndex, 1).toLocaleString('default', { month: 'long' });
    }

    // Reset filters
    function resetFilters() {
      searchQuery = '';
      startDate = '';
      endDate = '';
    }
  </script>
  
<svelte:head>
  <style>
    /* Enable scrolling only for this route */
    body {
      overflow-y: auto !important;
    }
    
    /* Show scrollbars */
    ::-webkit-scrollbar {
      display: block !important;
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    * {
      scrollbar-width: thin !important;
      -ms-overflow-style: auto !important;
    }
  </style>
</svelte:head>

<div class="container mx-auto p-6 max-w-6xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Study Newsletters</h1>
    <p class="text-base-content/70">Access the latest newsletters and updates for your study</p>
  </div>
  
  <!-- Search and filter section -->
  <div class="bg-base-200 rounded-lg p-4 mb-8">
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Search input -->
      <div class="form-control flex-1">
        <div class="input-group">
          <input 
            type="text" 
            placeholder="Search newsletters..." 
            class="input input-bordered w-full" 
            bind:value={searchQuery}
          />
          <button class="btn btn-square">
            <MdiMagnify class="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <!-- Date filters -->
      <div class="flex flex-wrap gap-2">
        <div class="form-control">
          <label class="label">
            <span class="label-text">From</span>
          </label>
          <input 
            type="date" 
            class="input input-bordered w-full max-w-xs" 
            bind:value={startDate}
          />
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">To</span>
          </label>
          <input 
            type="date" 
            class="input input-bordered w-full max-w-xs" 
            bind:value={endDate}
          />
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">&nbsp;</span>
          </label>
          <button class="btn btn-outline" on:click={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Search results count -->
    {#if searchQuery || startDate || endDate}
      <div class="mt-2 text-sm">
        Found {filteredNewsletters.length} newsletter{filteredNewsletters.length !== 1 ? 's' : ''}
      </div>
    {/if}
  </div>
  
  {#if isLoading}
    <div class="flex justify-center my-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <span>Error loading newsletters: {error}</span>
    </div>
  {:else if filteredNewsletters.length === 0}
    <div class="alert alert-info">
      <span>No newsletters found matching your search criteria.</span>
    </div>
  {:else}
    <!-- Most recent newsletter (featured) -->
    {#if filteredNewsletters.length > 0 && (!searchQuery && !startDate && !endDate)}
      <div class="mb-12">
        <div class="flex items-center gap-2 mb-4">
          <h2 class="text-2xl font-bold">Latest Newsletter</h2>
          {#if isRecent(filteredNewsletters[0].createdAt)}
            <div class="badge badge-primary gap-1">
              <MdiNewBox class="w-4 h-4" />
              NEW
            </div>
          {/if}
        </div>
        
        <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 border-2 border-primary">
          <!-- PDF Preview at the top of the card -->
          <figure class="h-64 relative">
            <iframe 
              src="{filteredNewsletters[0].url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH,top" 
              width="100%" 
              height="100%" 
              title="PDF Preview" 
              class="border-0"
              loading="lazy"
            ></iframe>
            
            <!-- Gradient overlay to fade out the bottom of the preview -->
            <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-base-100 to-transparent"></div>
          </figure>
          
          <div class="card-body">
            <div class="flex items-center gap-3 mb-3">
              <MdiPdfBox class="w-8 h-8 text-primary" />
              <h2 class="card-title">{filteredNewsletters[0].name.replace(/\.pdf$/i, '')}</h2>
            </div>
            
            <div class="flex items-center gap-2 text-base-content/70 mb-1">
              <MdiCalendarMonth class="w-5 h-5" />
              <span class="text-sm">{formatDate(filteredNewsletters[0].createdAt)}</span>
            </div>
            
            <p class="text-sm text-base-content/70 mb-4">Size: {filteredNewsletters[0].size}</p>
            
            <div class="card-actions justify-between mt-auto">
              <a href={filteredNewsletters[0].url} target="_blank" class="btn btn-primary">
                <MdiEye class="w-5 h-5 mr-2" />
                View
              </a>
              <a href={filteredNewsletters[0].url} download={filteredNewsletters[0].name} class="btn btn-outline">
                <MdiDownload class="w-5 h-5" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- All newsletters organized by year and month -->
    <div class="mb-8">
      {#if !searchQuery && !startDate && !endDate}
        <h2 class="text-2xl font-bold mb-6">Newsletter Archive</h2>
      {/if}
      
      {#each years as year}
        <div class="mb-10">
          <h3 class="text-xl font-bold mb-4 bg-base-200 p-2 rounded">{year}</h3>
          
          {#each Object.keys(groupedNewsletters[year]).sort((a, b) => b - a) as month}
            <div class="mb-6">
              <h4 class="text-lg font-semibold mb-3 text-primary border-b border-primary pb-1">{getMonthName(month)}</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each groupedNewsletters[year][month] as newsletter}
                  <!-- Skip the first newsletter in the unfiltered view since it's already shown above -->
                  {#if newsletter !== filteredNewsletters[0] || searchQuery || startDate || endDate}
                    <div class="card bg-base-100 shadow hover:shadow-md transition-shadow duration-300">
                      <div class="card-body p-4">
                        <div class="flex items-center gap-2 mb-2">
                          <MdiPdfBox class="w-6 h-6 text-primary" />
                          <h5 class="card-title text-base">{newsletter.name.replace(/\.pdf$/i, '')}</h5>
                          {#if isRecent(newsletter.createdAt)}
                            <div class="badge badge-sm badge-primary">New</div>
                          {/if}
                        </div>
                        
                        <div class="flex items-center gap-1 text-base-content/70 text-sm mb-3">
                          <MdiCalendarMonth class="w-4 h-4" />
                          <span>{formatDate(newsletter.createdAt)}</span>
                        </div>
                        
                        <div class="card-actions justify-between mt-2">
                          <a href={newsletter.url} target="_blank" class="btn btn-sm btn-primary">
                            View
                          </a>
                          <a href={newsletter.url} download={newsletter.name} class="btn btn-sm btn-ghost">
                            <MdiDownload class="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>