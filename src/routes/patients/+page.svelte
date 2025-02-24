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

</script>

<div class="p-8">
    <div class="overflow-x-auto bg-transparent">
        <table class="table table-hover">
            <!-- head -->
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Gender</th>
                    <th>Site</th>
                    <th>Tags</th>
                    <th>ICF Status</th>
                    <th>Next Visit</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {#each patients as patient}
                    <tr class="hover">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="avatar">
                                    <div class="mask mask-squircle w-12 h-12">
                                        <img src={patient.pic} alt={patient.name} />
                                    </div>
                                </div>
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
                                <button class="btn btn-warning btn-sm">Sign ICF</button>
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
