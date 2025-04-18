<script>
    import { onMount } from 'svelte';
    // import { getDownloadURL, getMetadata, listAll, ref } from 'firebase/storage';
    import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
    import { collection, doc, getDoc, setDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
    import MdiPdfBox from 'virtual:icons/mdi/pdf-box';
    import MdiCalendarMonth from 'virtual:icons/mdi/calendar-month';
    import MdiDownload from 'virtual:icons/mdi/download';
    import MdiEye from 'virtual:icons/mdi/eye';
    import MdiNewBox from 'virtual:icons/mdi/new-box';
    import MdiMagnify from 'virtual:icons/mdi/magnify';
    import { db, storage } from '../lib/firebase';
    import { authStore } from '$lib/stores/authStore';
    
    let newsletters = [];
    let isLoading = true;
    let error = null;
    
    // Search and filter state
    let searchQuery = '';
    let startDate = '';
    let endDate = '';
    
    // Track which newsletter preview is expanded
    let expandedPreview = null;
    
    // User's read newsletters
    let userReadNewsletters = [];
    let unsubAuthStore;
    
    function togglePreview(index) {
      if (expandedPreview === index) {
        expandedPreview = null;
      } else {
        expandedPreview = index;
      }
    }
    
    // Function to mark a newsletter as read
    async function markAsRead(newsletterName) {
      if (!$authStore.user) return;
      
      try {
        // Optimistic UI update
        if (!userReadNewsletters.includes(newsletterName)) {
          userReadNewsletters = [...userReadNewsletters, newsletterName];
        }
        
        // Update Firestore
        const userDocRef = doc(db, 'userReadNewsletters', $authStore.user.uid);
        
        // Get the latest data from Firebase to avoid overwrites
        const docSnap = await getDoc(userDocRef);
        let serverReadList = [];
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          serverReadList = data.readNewsletters || [];
          
          // Only update if not already in the server list
          if (!serverReadList.includes(newsletterName)) {
            await setDoc(userDocRef, {
              readNewsletters: [...serverReadList, newsletterName],
              updatedAt: new Date()
            }, { merge: true });
          }
        } else {
          // Document doesn't exist yet, create it
          await setDoc(userDocRef, {
            readNewsletters: [newsletterName],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (err) {
        console.error("Error marking newsletter as read:", err);
      }
    }
    
    // Function to handle clicking the View button
    function handleViewClick(newsletter) {
      // Mark as read if user is logged in
      if ($authStore.user) {
        markAsRead(newsletter.name);
      }
      
      // Open the newsletter in a new tab
      window.open(newsletter.url, '_blank');
    }
    
    // Check if a newsletter is unread by the current user
    function isUnread(newsletter) {
      return !userReadNewsletters.includes(newsletter.name);
    }
    
    // Check if a newsletter is recent AND unread (within the last 30 days)
    function isNewForUser(newsletter) {
      // Check if recently published (within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isRecent = newsletter.createdAt > thirtyDaysAgo;
      
      // Only show as new if it's both recent AND unread
      return isRecent && isUnread(newsletter);
    }
    
    // Load user's read newsletters
    async function loadReadNewsletters() {
      if (!$authStore.user) {
        userReadNewsletters = [];
        return;
      }
      
      try {
        const userDocRef = doc(db, 'userReadNewsletters', $authStore.user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          userReadNewsletters = data.readNewsletters || [];
        } else {
          userReadNewsletters = [];
        }
      } catch (err) {
        console.error("Error loading read newsletters:", err);
        userReadNewsletters = [];
      }
    }
    
    // Initialize everything
    async function initialize() {
      try {
        isLoading = true;
        
        const promises = [];
        
        // Load read status and newsletters in parallel but wait for both
        // to complete before showing content
        if ($authStore.user) {
          promises.push(loadReadNewsletters());
        } else {
          userReadNewsletters = [];
        }
        
        // Load newsletters
        const newslettersPromise = (async () => {
          const newslettersRef = ref(storage, 'newsletters');
          const result = await listAll(newslettersRef);
          
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
          
          const loadedNewsletters = await Promise.all(newsletterPromises);
          return loadedNewsletters.sort((a, b) => b.createdAt - a.createdAt);
        })();
        
        promises.push(newslettersPromise);
        
        // Wait for all promises to resolve
        const results = await Promise.all(promises);
        
        // Extract newsletters from results if it exists
        if (results.length > 0) {
          const lastResult = results[results.length - 1];
          if (Array.isArray(lastResult)) {
            newsletters = lastResult;
          }
        }
      } catch (err) {
        console.error("Error loading content:", err);
        error = err.message;
      } finally {
        isLoading = false;
      }
    }
    
    onMount(() => {
      // Setup auth subscription and handle changes
      unsubAuthStore = authStore.subscribe(async (auth) => {
        // Reset loading state on auth change
        isLoading = true;
        
        // Clear previous data before loading new data
        newsletters = [];
        userReadNewsletters = [];
        
        // Reinitialize everything when auth status changes
        await initialize();
      });
      
      // Initial load
      initialize();
      
      return () => {
        if (unsubAuthStore) unsubAuthStore();
      };
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

    // Separate newsletters into unread and read
    $: unreadNewsletters = filteredNewsletters.filter(newsletter => isUnread(newsletter));
    $: readNewsletters_filtered = filteredNewsletters.filter(newsletter => !isUnread(newsletter));

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

<div class="container mx-auto p-6 max-w-8xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-2">Study Newsletters</h1>
    <p class="text-base-content/70">Access the latest newsletters and updates for your study</p>
  </div>
  
  <!-- Search and filter section -->
  <div class="bg-base-200 rounded-lg p-4 mb-8">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <!-- Search input -->
      <div class="form-control md:col-span-5">
        <label class="label">
          <span class="label-text">Search</span>
        </label>
        <div class="flex">
          <input 
            type="text" 
            placeholder="Search newsletters..." 
            class="input input-bordered rounded-r-none flex-grow" 
            bind:value={searchQuery}
          />
          <button class="btn btn-square rounded-l-none border-l-0">
            <MdiMagnify class="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <!-- Date filters -->
      <div class="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">From</span>
          </label>
          <input 
            type="date" 
            class="input input-bordered w-full" 
            bind:value={startDate}
          />
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">To</span>
          </label>
          <input 
            type="date" 
            class="input input-bordered w-full" 
            bind:value={endDate}
          />
        </div>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Actions</span>
          </label>
          <button class="btn btn-outline w-full" on:click={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Search results count -->
    {#if searchQuery || startDate || endDate}
      <div class="mt-3 text-sm">
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
    {#if !searchQuery && !startDate && !endDate}
      <!-- Display sections only when not filtering -->
      {#if unreadNewsletters.length > 0}
        <div class="mb-10">
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>Unread Newsletters</span>
            <div class="badge badge-lg badge-primary">{unreadNewsletters.length}</div>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each unreadNewsletters as newsletter, i}
              <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 {i === 0 ? 'border-2 border-primary' : ''}">
                <!-- PDF Preview at the top of the card -->
                <figure class="h-64 relative">
                  <iframe 
                    src="{newsletter.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH,top" 
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
                  <div class="flex items-center justify-between w-full mb-3">
                    <div class="flex items-center gap-3">
                      <MdiPdfBox class="w-8 h-8 text-primary" />
                      <h2 class="card-title">
                        {newsletter.name.replace(/\.pdf$/i, '')}
                        {#if isNewForUser(newsletter)}
                          <div class="badge badge-primary">NEW</div>
                        {/if}
                      </h2>
                    </div>
                    <div class="flex items-center gap-1 text-base-content/70">
                      <MdiCalendarMonth class="w-5 h-5" />
                      <span class="text-sm whitespace-nowrap">{formatDate(newsletter.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div class="card-actions justify-between mt-auto">
                    <button 
                      class="btn btn-primary" 
                      on:click={() => handleViewClick(newsletter)}
                    >
                      <MdiEye class="w-5 h-5 mr-2" />
                      View
                    </button>
                    <a href={newsletter.url} download={newsletter.name} class="btn btn-outline">
                      <MdiDownload class="w-5 h-5" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if readNewsletters_filtered.length > 0}
        <div>
          <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>Read Newsletters</span>
            <div class="badge badge-lg">{readNewsletters_filtered.length}</div>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each readNewsletters_filtered as newsletter}
              <div class="card bg-base-100 shadow-xl hover:shadow-md transition-shadow duration-300">
                <!-- PDF Preview at the top of the card -->
                <figure class="h-64 relative">
                  <iframe 
                    src="{newsletter.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH,top" 
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
                  <div class="flex items-center justify-between w-full mb-3">
                    <div class="flex items-center gap-3">
                      <MdiPdfBox class="w-8 h-8 text-base-content/70" />
                      <h2 class="card-title text-base-content/90">
                        {newsletter.name.replace(/\.pdf$/i, '')}
                      </h2>
                    </div>
                    <div class="flex items-center gap-1 text-base-content/70">
                      <MdiCalendarMonth class="w-5 h-5" />
                      <span class="text-sm whitespace-nowrap">{formatDate(newsletter.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div class="card-actions justify-between mt-auto">
                    <button 
                      class="btn btn-ghost" 
                      on:click={() => handleViewClick(newsletter)}
                    >
                      <MdiEye class="w-5 h-5 mr-2" />
                      View Again
                    </button>
                    <a href={newsletter.url} download={newsletter.name} class="btn btn-outline btn-sm">
                      <MdiDownload class="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      <!-- When filtering, display all results in a single grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each filteredNewsletters as newsletter, i}
          <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 {isUnread(newsletter) ? 'border-l-4 border-l-primary' : ''}">
            <!-- PDF Preview at the top of the card -->
            <figure class="h-64 relative">
              <iframe 
                src="{newsletter.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH,top" 
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
              <div class="flex items-center justify-between w-full mb-3">
                <div class="flex items-center gap-3">
                  <MdiPdfBox class="w-8 h-8 {isUnread(newsletter) ? 'text-primary' : 'text-base-content/70'}" />
                  <h2 class="card-title {!isUnread(newsletter) ? 'text-base-content/90' : ''}">
                    {newsletter.name.replace(/\.pdf$/i, '')}
                    {#if isNewForUser(newsletter)}
                      <div class="badge badge-primary">NEW</div>
                    {/if}
                  </h2>
                </div>
                <div class="flex items-center gap-1 text-base-content/70">
                  <MdiCalendarMonth class="w-5 h-5" />
                  <span class="text-sm whitespace-nowrap">{formatDate(newsletter.createdAt)}</span>
                </div>
              </div>
              
              <div class="card-actions justify-between mt-auto">
                <button 
                  class="btn {isUnread(newsletter) ? 'btn-primary' : 'btn-ghost'}" 
                  on:click={() => handleViewClick(newsletter)}
                >
                  <MdiEye class="w-5 h-5 mr-2" />
                  {isUnread(newsletter) ? 'View' : 'View Again'}
                </button>
                <a href={newsletter.url} download={newsletter.name} class="btn btn-outline {!isUnread(newsletter) ? 'btn-sm' : ''}">
                  <MdiDownload class="w-5 h-5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>