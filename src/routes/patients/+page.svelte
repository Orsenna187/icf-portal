<script>
    const patients = [{
        pic: 'https://i.pravatar.cc/150?img=1',
        name: 'Jane Doe',
        gender: 'Female',
        site: 'Oslo Hospital',
        city: 'Oslo',
        tags: ['pregnant'],
        icf_status: 'sent',
        next_visit: '2025-03-01'
    },
    {
        pic: 'https://i.pravatar.cc/150?img=2',
        name: 'John Doe',
        gender: 'Male',
        site: 'Oslo Hospital',
        city: 'Oslo',
        tags: ['child'],
        icf_status: 'signed',
        next_visit: '2025-03-15'
    },
    {
        pic: 'https://i.pravatar.cc/150?img=3',
        name: 'Tim Doe',
        gender: 'Female',
        site: 'Oslo Hospital',
        city: 'Oslo',
        tags: [],
        icf_status: 'not sent',
        next_visit: '2025-03-27'
    },
    {
        pic: 'https://i.pravatar.cc/150?img=4',
        name: 'Tom Dim',
        gender: 'Male',
        site: 'Oslo Hospital',
        city: 'Oslo',
        tags: [],
        icf_status: 'not sent',
        next_visit: '2025-03-07'
    },
    ];

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
    const genders = [...new Set(patients.map(p => p.gender))];
    const statuses = [...new Set(patients.map(p => p.icf_status))];
    const allTags = [...new Set(patients.flatMap(p => p.tags))];
    const sites = [...new Set(patients.map(p => p.site))];

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

    <div class="overflow-x-auto bg-transparent">
        <table class="table table-hover">
            <!-- head -->
            <thead>
                <tr>
                    <th class="cursor-pointer" on:click={() => handleSort('name')}>
                        Patient
                        {#if sortField === 'name'}
                            <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                    </th>
                    <th class="cursor-pointer" on:click={() => handleSort('gender')}>
                        Gender
                        {#if sortField === 'gender'}
                            <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                    </th>
                    <th class="cursor-pointer" on:click={() => handleSort('site')}>
                        Site
                        {#if sortField === 'site'}
                            <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                    </th>
                    <th>Tags</th>
                    <th class="cursor-pointer" on:click={() => handleSort('icf_status')}>
                        ICF Status
                        {#if sortField === 'icf_status'}
                            <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                    </th>
                    <th class="cursor-pointer" on:click={() => handleSort('next_visit')}>
                        Next Visit
                        {#if sortField === 'next_visit'}
                            <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                    </th>
                    <th>Action</th>
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
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
