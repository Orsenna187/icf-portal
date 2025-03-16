<script>
    import { createEventDispatcher } from 'svelte';
    import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

    // Props
    export let db;
    export let showModal = false;
    export let editMode = false;
    export let siteData = null;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // New site form data
    let newSite = {
        name: '',
        adress: '',
        delivery: '',
        number: '',
        pi: ''
    };
    
    // Form submission state
    let isSubmitting = false;
    let formError = null;
    
    // Initialize form data when siteData changes or modal opens
    $: if (showModal && siteData && editMode) {
        newSite = { ...siteData };
    } else if (showModal && !editMode) {
        resetForm();
    }
    
    // Save site to Firebase (create or update)
    async function saveSite() {
        if (!newSite.name || !newSite.adress) {
            formError = "Please fill in all required fields";
            return;
        }
        
        try {
            isSubmitting = true;
            formError = null;
            
            if (editMode) {
                // Update existing document
                const siteId = newSite.id;
                const siteRef = doc(db, "site", siteId);
                
                // Remove id from the data to update
                const siteToUpdate = { ...newSite };
                delete siteToUpdate.id;
                siteToUpdate.updated_at = serverTimestamp();
                
                await updateDoc(siteRef, siteToUpdate);
            } else {
                // Add new document
                const siteToAdd = { ...newSite, created_at: serverTimestamp() };
                await addDoc(collection(db, "site"), siteToAdd);
            }
            
            // Reset form and close modal
            resetForm();
            closeModal(true);
            
        } catch (err) {
            console.error(`Error ${editMode ? 'updating' : 'adding'} site:`, err);
            formError = `Failed to ${editMode ? 'update' : 'add'} site. Please try again.`;
        } finally {
            isSubmitting = false;
        }
    }
    
    // Reset the form to default values
    function resetForm() {
        newSite = {
            name: '',
            adress: '',
            delivery: '',
            number: '',
            pi: ''
        };
        formError = null;
    }
    
    // Close the modal
    function closeModal(siteChanged = false) {
        resetForm();
        dispatch('close', { siteChanged });
    }
</script>

{#if showModal}
    <div class="modal modal-open">
        <div class="modal-box max-w-3xl">
            <h3 class="font-bold text-lg mb-4">{editMode ? 'Edit' : 'Add New'} Site</h3>
            
            {#if formError}
                <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{formError}</span>
                </div>
            {/if}
            
            <form on:submit|preventDefault={saveSite} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Name -->
                    <div class="form-control">
                        <label class="label" for="site-name">
                            <span class="label-text">Name *</span>
                        </label>
                        <input 
                            id="site-name"
                            type="text" 
                            bind:value={newSite.name} 
                            placeholder="Site name" 
                            class="input input-bordered w-full" 
                            required
                        />
                    </div>
                    
                    <!-- Address -->
                    <div class="form-control">
                        <label class="label" for="site-address">
                            <span class="label-text">Address *</span>
                        </label>
                        <input 
                            id="site-address"
                            type="text" 
                            bind:value={newSite.adress} 
                            placeholder="Site address" 
                            class="input input-bordered w-full" 
                            required
                        />
                    </div>
                    
                    <!-- Delivery -->
                    <div class="form-control">
                        <label class="label" for="site-delivery">
                            <span class="label-text">Delivery</span>
                        </label>
                        <input 
                            id="site-delivery"
                            type="text" 
                            bind:value={newSite.delivery} 
                            placeholder="Delivery information" 
                            class="input input-bordered w-full"
                        />
                    </div>
                    
                    <!-- Number -->
                    <div class="form-control">
                        <label class="label" for="site-number">
                            <span class="label-text">Number</span>
                        </label>
                        <input 
                            id="site-number"
                            type="text" 
                            bind:value={newSite.number} 
                            placeholder="Site number" 
                            class="input input-bordered w-full"
                        />
                    </div>
                    
                    <!-- PI (Principal Investigator) -->
                    <div class="form-control md:col-span-2">
                        <label class="label" for="site-pi">
                            <span class="label-text">Principal Investigator</span>
                        </label>
                        <input 
                            id="site-pi"
                            type="text" 
                            bind:value={newSite.pi} 
                            placeholder="Principal Investigator name" 
                            class="input input-bordered w-full"
                        />
                    </div>
                </div>
                
                <div class="modal-action">
                    <button type="button" class="btn" on:click={() => closeModal()}>Cancel</button>
                    <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                        {#if isSubmitting}
                            <span class="loading loading-spinner loading-xs mr-2"></span>
                        {/if}
                        {editMode ? 'Update' : 'Save'} Site
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" on:click={() => closeModal()}></div>
    </div>
{/if} 