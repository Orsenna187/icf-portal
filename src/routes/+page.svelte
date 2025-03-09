<script>
    import { onMount } from 'svelte';
    // import { getDownloadURL, getMetadata, listAll, ref } from 'firebase/storage';
    import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
    import MdiPdfBox from 'virtual:icons/mdi/pdf-box';
    import MdiCalendarMonth from 'virtual:icons/mdi/calendar-month';
    import MdiDownload from 'virtual:icons/mdi/download';
    import MdiEye from 'virtual:icons/mdi/eye';
    import { db, storage } from '../lib/firebase';
    
    let newsletters = [];
    let isLoading = true;
    let error = null;
    
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
  </script>
  
  <div class="container mx-auto p-6 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Study Newsletters</h1>
      <p class="text-base-content/70">Access the latest newsletters and updates for your study</p>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center my-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else if error}
      <div class="alert alert-error">
        <span>Error loading newsletters: {error}</span>
      </div>
    {:else if newsletters.length === 0}
      <div class="alert alert-info">
        <span>No newsletters available yet.</span>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {#each newsletters as newsletter}
          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <!-- PDF Preview at the top of the card -->
            <figure class="h-64 relative">
              <iframe 
                src="{newsletter.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH,top" 
                width="100%" 
                height="100%" 
                title="PDF Preview" 
                class="border-0 overflow-hidden"
                loading="lazy"
                style="overflow: hidden;"
              ></iframe>
              
              <!-- Gradient overlay to fade out the bottom of the preview -->
              <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-base-100 to-transparent"></div>
            </figure>
            
            <div class="card-body">
              <div class="flex items-center gap-3 mb-3">
                <MdiPdfBox class="w-8 h-8 text-primary" />
                <h2 class="card-title">{newsletter.name.replace(/\.pdf$/i, '')}</h2>
              </div>
              
              <div class="flex items-center gap-2 text-base-content/70 mb-1">
                <MdiCalendarMonth class="w-5 h-5" />
                <span class="text-sm">{formatDate(newsletter.createdAt)}</span>
              </div>
              
              <p class="text-sm text-base-content/70 mb-4">Size: {newsletter.size}</p>
              
              <div class="card-actions justify-between mt-auto">
                <a href={newsletter.url} target="_blank" class="btn btn-primary">
                  View
                </a>
                <a href={newsletter.url} download={newsletter.name} class="btn btn-outline">
                  <MdiDownload class="w-5 h-5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>