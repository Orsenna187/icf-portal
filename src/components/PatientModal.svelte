<script>
    import { createEventDispatcher } from 'svelte';
    import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

    // Props
    export let db;
    export let showModal = false;
    export let editMode = false;
    export let patientData = null;
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // New patient form data
    let newPatient = {
        name: '',
        gender: 'Male',
        site: '',
        city: '',
        tags: [],
        icf_status: 'not sent',
        next_visit: ''
    };
    
    // Temporary tag input
    let tagInput = '';
    
    // Form submission state
    let isSubmitting = false;
    let formError = null;
    
    // Initialize form data when patientData changes or modal opens
    $: if (showModal && patientData && editMode) {
        newPatient = { 
            ...patientData,
            // Ensure next_visit is in the right format for the date input
            next_visit: patientData.next_visit || ''
        };
    } else if (showModal && !editMode) {
        resetForm();
    }
    
    // Save patient to Firebase (create or update)
    async function savePatient() {
        if (!newPatient.name || !newPatient.site || !newPatient.city) {
            formError = "Please fill in all required fields";
            return;
        }
        
        try {
            isSubmitting = true;
            formError = null;
            
            // Prepare data for Firestore
            const patientData = {
                ...newPatient,
                // Convert next_visit to a timestamp if it exists
                next_visit: newPatient.next_visit ? new Date(newPatient.next_visit) : null,
            };
            
            if (editMode) {
                // Update existing document
                const patientId = newPatient.id;
                const patientRef = doc(db, "patients", patientId);
                
                // Remove id from the data to update
                delete patientData.id;
                patientData.updated_at = serverTimestamp();
                
                await updateDoc(patientRef, patientData);
            } else {
                // Add new document
                patientData.created_at = serverTimestamp();
                await addDoc(collection(db, "patients"), patientData);
            }
            
            // Reset form and close modal
            resetForm();
            closeModal(true);
            
        } catch (err) {
            console.error(`Error ${editMode ? 'updating' : 'adding'} patient:`, err);
            formError = `Failed to ${editMode ? 'update' : 'add'} patient. Please try again.`;
        } finally {
            isSubmitting = false;
        }
    }
    
    // Reset the form to default values
    function resetForm() {
        newPatient = {
            name: '',
            gender: 'Male',
            site: '',
            city: '',
            tags: [],
            icf_status: 'not sent',
            next_visit: ''
        };
        tagInput = '';
        formError = null;
    }
    
    // Close the modal
    function closeModal(patientChanged = false) {
        resetForm();
        dispatch('close', { patientChanged });
    }
    
    // Add tag to the new patient
    function addTag() {
        if (tagInput && !newPatient.tags.includes(tagInput)) {
            newPatient.tags = [...newPatient.tags, tagInput];
            tagInput = '';
        }
    }
    
    // Remove tag from the new patient
    function removeTag(tag) {
        newPatient.tags = newPatient.tags.filter(t => t !== tag);
    }
</script>

{#if showModal}
    <div class="modal modal-open">
        <div class="modal-box max-w-3xl">
            <h3 class="font-bold text-lg mb-4">{editMode ? 'Edit' : 'Add New'} Patient</h3>
            
            {#if formError}
                <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{formError}</span>
                </div>
            {/if}
            
            <form on:submit|preventDefault={savePatient} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Name -->
                    <div class="form-control">
                        <label class="label" for="patient-name">
                            <span class="label-text">Name *</span>
                        </label>
                        <input 
                            id="patient-name"
                            type="text" 
                            bind:value={newPatient.name} 
                            placeholder="Patient name" 
                            class="input input-bordered w-full" 
                            required
                        />
                    </div>
                    
                    <!-- Gender -->
                    <div class="form-control">
                        <label class="label" for="patient-gender">
                            <span class="label-text">Gender</span>
                        </label>
                        <select 
                            id="patient-gender"
                            bind:value={newPatient.gender} 
                            class="select select-bordered w-full"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <!-- Site -->
                    <div class="form-control">
                        <label class="label" for="patient-site">
                            <span class="label-text">Site *</span>
                        </label>
                        <input 
                            id="patient-site"
                            type="text" 
                            bind:value={newPatient.site} 
                            placeholder="Hospital or clinic name" 
                            class="input input-bordered w-full" 
                            required
                        />
                    </div>
                    
                    <!-- City -->
                    <div class="form-control">
                        <label class="label" for="patient-city">
                            <span class="label-text">City *</span>
                        </label>
                        <input 
                            id="patient-city"
                            type="text" 
                            bind:value={newPatient.city} 
                            placeholder="City" 
                            class="input input-bordered w-full" 
                            required
                        />
                    </div>
                    
                    <!-- ICF Status -->
                    <div class="form-control">
                        <label class="label" for="patient-status">
                            <span class="label-text">ICF Status</span>
                        </label>
                        <select 
                            id="patient-status"
                            bind:value={newPatient.icf_status} 
                            class="select select-bordered w-full"
                        >
                            <option value="not sent">Not Sent</option>
                            <option value="sent">Sent</option>
                            <option value="signed">Signed</option>
                        </select>
                    </div>
                    
                    <!-- Next Visit -->
                    <div class="form-control">
                        <label class="label" for="patient-visit">
                            <span class="label-text">Next Visit</span>
                        </label>
                        <input 
                            id="patient-visit"
                            type="date" 
                            bind:value={newPatient.next_visit} 
                            class="input input-bordered w-full" 
                        />
                    </div>
                </div>
                
                <!-- Tags -->
                <div class="form-control">
                    <label class="label" for="patient-tags">
                        <span class="label-text">Tags</span>
                    </label>
                    <div class="flex gap-2">
                        <input 
                            id="patient-tags"
                            type="text" 
                            bind:value={tagInput} 
                            placeholder="Add a tag" 
                            class="input input-bordered flex-grow" 
                        />
                        <button 
                            type="button" 
                            class="btn btn-secondary" 
                            on:click={addTag}
                        >
                            Add
                        </button>
                    </div>
                    
                    {#if newPatient.tags.length > 0}
                        <div class="flex flex-wrap gap-2 mt-2">
                            {#each newPatient.tags as tag}
                                <div class="badge badge-primary badge-lg gap-1">
                                    {tag}
                                    <button 
                                        type="button" 
                                        class="btn btn-xs btn-circle btn-ghost" 
                                        on:click={() => removeTag(tag)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <div class="modal-action">
                    <button type="button" class="btn" on:click={() => closeModal()}>Cancel</button>
                    <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                        {#if isSubmitting}
                            <span class="loading loading-spinner loading-xs mr-2"></span>
                        {/if}
                        {editMode ? 'Update' : 'Save'} Patient
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" on:click={() => closeModal()}></div>
    </div>
{/if} 