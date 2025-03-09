<script>
    import { onMount } from 'svelte';
    import { initializeApp } from 'firebase/app';
    import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
    import PatientModal from '../../components/PatientModal.svelte';

    const firebaseConfig = {
        apiKey: "AIzaSyAeF-HyA2J-vcDJKKz7m2JC4YhTicMcpSQ",
        authDomain: "icfportal.firebaseapp.com",
        projectId: "icfportal",
        storageBucket: "icfportal.firebasestorage.app",
        messagingSenderId: "488487858201",
        appId: "1:488487858201:web:bf11da8290a8bcf8ebba88",
        measurementId: "G-REDMM2NNDC"
    };

    let patients = []; 
    let isLoading = true;
    let error = null;
    let deleteConfirmationId = null;

    // Modal state
    let showModal = false;
    let editMode = false;
    let selectedPatient = null;

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Open modal for adding a new patient
    function openAddModal() {
        editMode = false;
        selectedPatient = null;
        showModal = true;
    }
    
    // Open modal for editing a patient
    function openEditModal(patient) {
        selectedPatient = { ...patient };
        editMode = true;
        showModal = true;
    }
    
    // Handle modal close event
    function handleModalClose(event) {
        showModal = false;
        
        // If a patient was added or updated, refresh the patient list
        if (event.detail && event.detail.patientChanged) {
            fetchPatients();
        }
    }

    // Delete a patient
    async function deletePatient(patientId) {
        try {
            isLoading = true;
            await deleteDoc(doc(db, "patients", patientId));
            deleteConfirmationId = null;
            await fetchPatients();
        } catch (err) {
            console.error("Error deleting patient:", err);
            error = "Failed to delete patient. Please try again.";
            isLoading = false;
        }
    }

    // Show delete confirmation
    function confirmDelete(patientId) {
        deleteConfirmationId = patientId;
    }

    // Cancel delete
    function cancelDelete() {
        deleteConfirmationId = null;
    }

    async function fetchPatients() {
        try {
            isLoading = true;
            error = null;
            const querySnapshot = await getDocs(collection(db, "patients"));
            patients = querySnapshot.docs.map(doc => {
                const data = doc.data();
                
                // Format next_visit timestamp to date string if it exists
                if (data.next_visit) {
                    // Handle both Firestore Timestamp objects and string dates
                    if (data.next_visit.toDate) {
                        // It's a Firestore Timestamp
                        data.next_visit = data.next_visit.toDate().toISOString().split('T')[0];
                    } else if (typeof data.next_visit === 'string') {
                        // It's already a string, just take the date part
                        data.next_visit = data.next_visit.split('T')[0];
                    }
                }
                
                return {
                    id: doc.id,
                    ...data
                };
            });
        } catch (error) {
            console.error("Error fetching patients:", error);
            error = "Failed to load patient data. Please try again later.";
        } finally {
            isLoading = false;
        }
    }
    
    onMount(() => {
        fetchPatients();
    });

    const dev = process.env.NODE_ENV === 'development';
    const basePath = dev ? '' : '/icf-portal';

    // Add sorting state
    let sortField = 'name';
    let sortDirection = 'asc';

    // Add filter state
    let nameFilter = '';
    let genderFilter = 'all';
    let statusFilter = 'all';
    let tagFilter = '';
    let siteFilter = 'all';

    // Get unique values for filters
    $: genders = [...new Set(patients.map(p => p.gender))];
    $: statuses = [...new Set(patients.map(p => p.icf_status))];
    $: allTags = [...new Set(patients.flatMap(p => p.tags))];
    $: sites = [...new Set(patients.map(p => p.site))];

    // Sort function
    function sortPatients(a, b) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortField === 'next_visit') {
            return sortDirection === 'asc' 
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
        }
        
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

    // Filter function
    $: filteredPatients = patients
        .filter(p => p.name.toLowerCase().includes(nameFilter.toLowerCase()))
        .filter(p => genderFilter === 'all' || p.gender === genderFilter)
        .filter(p => statusFilter === 'all' || p.icf_status === statusFilter)
        .filter(p => !tagFilter || p.tags.includes(tagFilter))
        .filter(p => siteFilter === 'all' || p.site === siteFilter)
        .sort(sortPatients);
</script>

<div class="p-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Patients</h1>
        <button class="btn btn-primary" onclick={openAddModal}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
        </button>
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
                placeholder="Search name..." 
                class="input input-bordered w-full max-w-xs" 
            />
        </div>

        <div class="form-control">
            <label class="label" for="gender-filter">
                <span class="label-text">Filter by gender</span>
            </label>
            <select 
                id="gender-filter"
                bind:value={genderFilter} 
                class="select select-bordered w-full max-w-xs"
            >
                <option value="all">All genders</option>
                {#each genders as gender}
                    <option value={gender}>{gender}</option>
                {/each}
            </select>
        </div>

        <div class="form-control">
            <label class="label" for="status-filter">
                <span class="label-text">Filter by status</span>
            </label>
            <select 
                id="status-filter"
                bind:value={statusFilter} 
                class="select select-bordered w-full max-w-xs"
            >
                <option value="all">All statuses</option>
                {#each statuses as status}
                    <option value={status}>{status}</option>
                {/each}
            </select>
        </div>

        <div class="form-control">
            <label class="label" for="tag-filter">
                <span class="label-text">Filter by tag</span>
            </label>
            <select 
                id="tag-filter"
                bind:value={tagFilter} 
                class="select select-bordered w-full max-w-xs"
            >
                <option value="">All tags</option>
                {#each allTags as tag}
                    <option value={tag}>{tag}</option>
                {/each}
            </select>
        </div>

        <div class="form-control">
            <label class="label" for="site-filter">
                <span class="label-text">Filter by site</span>
            </label>
            <select 
                id="site-filter"
                bind:value={siteFilter} 
                class="select select-bordered w-full max-w-xs"
            >
                <option value="all">All sites</option>
                {#each sites as site}
                    <option value={site}>{site}</option>
                {/each}
            </select>
        </div>
    </div>

    {#if isLoading}
        <div class="flex flex-col items-center justify-center py-12">
            <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p class="text-lg font-medium text-gray-600">Loading patient data...</p>
        </div>
    {:else if error}
        <div class="alert alert-error shadow-lg my-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button class="btn btn-sm" onclick={fetchPatients}>Try Again</button>
        </div>
    {:else if filteredPatients.length === 0}
        <div class="alert alert-info shadow-lg my-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No patients found matching your filters.</span>
        </div>
    {:else}
        <div class="overflow-x-auto bg-transparent">
            <table class="table table-hover">
                <!-- head -->
                <thead>
                    <tr>
                        <th class="cursor-pointer" onclick={() => handleSort('name')}>
                            Patient
                            {#if sortField === 'name'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" onclick={() => handleSort('gender')}>
                            Gender
                            {#if sortField === 'gender'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" onclick={() => handleSort('site')}>
                            Site
                            {#if sortField === 'site'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th>Tags</th>
                        <th class="cursor-pointer" onclick={() => handleSort('icf_status')}>
                            ICF Status
                            {#if sortField === 'icf_status'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th class="cursor-pointer" onclick={() => handleSort('next_visit')}>
                            Next Visit
                            {#if sortField === 'next_visit'}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                        <th>ICF Action</th>
                        <th class="w-24">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredPatients as patient}
                        <tr class="hover">
                            <td>
                                <div class="flex items-center gap-3">
                                    <!-- <div class="avatar">
                                        <div class="mask mask-squircle w-12 h-12">
                                            <img src={patient.pic} alt={patient.name} />
                                        </div>
                                    </div> -->
                                    <div>
                                        <div class="font-bold">{patient.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{patient.gender}</td>
                            <td>
                                {patient.site}
                                <br/>
                                <span class="badge badge-ghost badge-sm">{patient.city}</span>
                            </td>
                            <td>
                                {#each patient.tags as tag}
                                    <div class="badge badge-primary badge-outline">{tag}</div>
                                {/each}
                            </td>
                            <td>
                                <div class="badge" class:badge-success={patient.icf_status === 'signed'}
                                     class:badge-warning={patient.icf_status === 'sent'}
                                     class:badge-error={patient.icf_status === 'not sent'}>
                                    {patient.icf_status}
                                </div>
                            </td>
                            <td>{new Date(patient.next_visit).toLocaleDateString()}</td>
                            <td>
                                {#if patient.icf_status === 'not sent'}
                                    <button class="btn btn-primary btn-sm">Send ICF</button>
                                {:else if patient.icf_status === 'sent'}
                                    <a href={`${basePath}/patients/signing_room`} class="btn btn-warning btn-sm">Sign ICF</a>
                                {:else if patient.icf_status === 'signed'}
                                    <button class="btn btn-success btn-sm">View ICF</button>
                                {/if}
                            </td>
                            <td class="flex gap-2">
                                <!-- Edit Button -->
                                <button 
                                    class="btn btn-ghost btn-sm btn-circle"
                                    onclick={() => openEditModal(patient)}
                                    title="Edit patient"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                                
                                <!-- Delete Button / Confirmation -->
                                {#if deleteConfirmationId === patient.id}
                                    <div class="flex gap-1">
                                        <button 
                                            class="btn btn-error btn-sm btn-circle"
                                            onclick={() => deletePatient(patient.id)}
                                            title="Confirm delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button 
                                            class="btn btn-ghost btn-sm btn-circle"
                                            onclick={cancelDelete}
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
                                        onclick={() => confirmDelete(patient.id)}
                                        title="Delete patient"
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
</div>

<!-- Patient Modal Component -->
<PatientModal 
    {db} 
    {showModal}
    {editMode}
    patientData={selectedPatient}
    on:close={handleModalClose} 
/>
