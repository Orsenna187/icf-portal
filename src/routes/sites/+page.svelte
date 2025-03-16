<script>
    import { onMount } from 'svelte';
    import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
    import SiteModal from '../../components/SiteModal.svelte';
    import { db } from '../../lib/firebase';

    let sites = []; 
    let isLoading = true;
    let error = null;
    let deleteConfirmationId = null;

    // Modal state
    let showModal = false;
    let editMode = false;
    let selectedSite = null;

    // Open modal for adding a new site
    function openAddModal() {
        editMode = false;
        selectedSite = null;
        showModal = true;
    }
    
    // Open modal for editing a site
    function openEditModal(site) {
        selectedSite = { ...site };
        editMode = true;
        showModal = true;
    }
    
    // Handle modal close event
    function handleModalClose(event) {
        showModal = false;
        
        // If a site was added or updated, refresh the site list
        if (event.detail && event.detail.siteChanged) {
            fetchSites();
        }
    }

    // Delete a site
    async function deleteSite(siteId) {
        try {
            isLoading = true;
            await deleteDoc(doc(db, "site", siteId));
            deleteConfirmationId = null;
            await fetchSites();
        } catch (err) {
            console.error("Error deleting site:", err);
            error = "Failed to delete site. Please try again.";
            isLoading = false;
        }
    }

    // Show delete confirmation
    function confirmDelete(siteId) {
        console.log("Confirming delete for site ID:", siteId);
        deleteConfirmationId = siteId;
    }

    // Cancel delete
    function cancelDelete() {
        console.log("Canceling delete");
        deleteConfirmationId = null;
    }

    async function fetchSites() {
        try {
            isLoading = true;
            error = null;
            console.log("Fetching sites from collection 'site'");
            const querySnapshot = await getDocs(collection(db, "site"));
            console.log("Query snapshot:", querySnapshot);
            sites = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Fetched sites:", sites);
        } catch (err) {
            console.error("Error fetching sites:", err);
            error = `Failed to load site data: ${err.message}`;
        } finally {
            isLoading = false;
        }
    }
    
    onMount(() => {
        fetchSites();
    });

    // Add sorting state
    let sortField = 'name';
    let sortDirection = 'asc';

    // Sort function
    function sortSites(a, b) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        return sortDirection === 'asc'
            ? aValue.toString().localeCompare(bValue.toString())
            : bValue.toString().localeCompare(aValue.toString());
    }

    // Handle sort click
    function handleSort(field) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'asc';
        }
    }

    // Filter state
    let nameFilter = '';

    // Filtered sites
    $: filteredSites = sites
        .filter(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()))
        .sort(sortSites);
</script>

<div class="p-8 relative min-h-screen">
    <div class="mb-6">
        <h1 class="text-2xl font-bold">Sites</h1>
    </div>

    <div class="flex flex-wrap gap-4 mb-4">
        <div class="form-control">
            <label class="label" for="name-filter">
                <span class="label-text">Search by name</span>
            </label>
            <input 
                id="name-filter"
                type="text" 
                bind:value={nameFilter} 
                placeholder="Search site name..." 
                class="input input-bordered w-full max-w-xs" 
            />
        </div>
    </div>

    {#if isLoading}
        <div class="flex flex-col items-center justify-center py-12">
            <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p class="text-lg font-medium text-gray-600">Loading site data...</p>
        </div>
    {:else if error}
        <div class="alert alert-error shadow-lg my-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button class="btn btn-sm" on:click={fetchSites}>Try Again</button>
        </div>
    {:else if filteredSites.length === 0}
        <div class="alert alert-info shadow-lg my-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No sites found. Click "Add Site" to create your first site.</span>
        </div>
    {:else}
        <div class="overflow-x-auto bg-transparent">
            <table class="table table-hover">
                <!-- head -->
                <thead>
                    <tr>
                        <th class="cursor-pointer" on:click={() => handleSort('name')}>
                            Name
                            {#if sortField === 'name'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" on:click={() => handleSort('adress')}>
                            Address
                            {#if sortField === 'adress'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" on:click={() => handleSort('delivery')}>
                            Delivery
                            {#if sortField === 'delivery'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" on:click={() => handleSort('number')}>
                            Number
                            {#if sortField === 'number'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" on:click={() => handleSort('pi')}>
                            Principal Investigator
                            {#if sortField === 'pi'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="w-24">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredSites as site}
                        <tr class="hover">
                            <td>
                                <div class="font-bold">{site.name}</div>
                            </td>
                            <td>{site.adress}</td>
                            <td>{site.delivery}</td>
                            <td>{site.number}</td>
                            <td>{site.pi}</td>
                            <td class="flex gap-2">
                                <!-- Edit Button -->
                                <button 
                                    class="btn btn-ghost btn-sm btn-circle"
                                    on:click={() => openEditModal(site)}
                                    title="Edit site"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                
                                <!-- Delete Button / Confirmation -->
                                {#if deleteConfirmationId === site.id}
                                    <div class="flex gap-1">
                                        <button 
                                            class="btn btn-error btn-sm btn-circle"
                                            on:click={() => deleteSite(site.id)}
                                            title="Confirm delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button 
                                            class="btn btn-ghost btn-sm btn-circle"
                                            on:click={cancelDelete}
                                            title="Cancel delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                {:else}
                                    <button 
                                        class="btn btn-ghost btn-sm btn-circle text-error"
                                        on:click={() => confirmDelete(site.id)}
                                        title="Delete site"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
    
    <!-- Fixed Add Site button at bottom right -->
    <div class="fixed bottom-8 right-8">
        <button class="btn btn-primary btn-circle shadow-lg" on:click={openAddModal} title="Add Site">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
        </button>
    </div>
</div>

<!-- Site Modal Component -->
<SiteModal 
    {db} 
    {showModal}
    {editMode}
    siteData={selectedSite}
    on:close={handleModalClose} 
/>

