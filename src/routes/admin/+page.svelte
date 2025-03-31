<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    // Store for users data
    const users = writable([]);
    const isLoading = writable(true);
    const errorMessage = writable(null);

    // Store for tracking changes locally before saving
    const pendingRoleChanges = writable({}); // { uid: newRole, ... }
    const savingStatus = writable({}); // { uid: 'saving' | 'success' | 'error', ... }

    // Allowed roles for the dropdown
    const availableRoles = ['user', 'admin'];

    // Fetch users on component mount
    onMount(async () => {
        isLoading.set(true);
        errorMessage.set(null);
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const usersData = await response.json();
            // Sort users by creation time, newest first (optional)
            usersData.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime));
            users.set(usersData);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            errorMessage.set(`Failed to load users: ${error.message}`);
        } finally {
            isLoading.set(false);
        }
    });

    // Function to handle role selection change
    function handleRoleChange(uid, newRole) {
        pendingRoleChanges.update(changes => ({
            ...changes,
            [uid]: newRole
        }));
        // Clear saving status when a new role is selected
        savingStatus.update(status => {
            const newStatus = { ...status };
            delete newStatus[uid];
            return newStatus;
        });
    }

    // Function to save role change for a specific user
    async function saveRoleChange(uid) {
        const roleToSet = $pendingRoleChanges[uid];
        if (!roleToSet) return; // No change pending

        savingStatus.update(status => ({ ...status, [uid]: 'saving' }));
        errorMessage.set(null); // Clear general error

        try {
            const response = await fetch(`/api/admin/users/${uid}/role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: roleToSet })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update role (status: ${response.status})`);
            }

            // Update the main users store with the new role
            users.update(currentUsers => 
                currentUsers.map(user => 
                    user.uid === uid ? { ...user, role: roleToSet } : user
                )
            );
            
            // Clear pending change for this user
            pendingRoleChanges.update(changes => {
                const newChanges = { ...changes };
                delete newChanges[uid];
                return newChanges;
            });
            savingStatus.update(status => ({ ...status, [uid]: 'success' }));

            // Optionally clear success message after a delay
            setTimeout(() => {
                 savingStatus.update(status => {
                    const newStatus = { ...status };
                    if (newStatus[uid] === 'success') {
                        delete newStatus[uid];
                    }
                    return newStatus;
                });
            }, 3000);

        } catch (error) {
            console.error(`Failed to update role for user ${uid}:`, error);
            savingStatus.update(status => ({ ...status, [uid]: 'error' }));
            // Display specific error for this user row maybe?
            // For now, setting the general error message
            errorMessage.set(`Error updating role for user ${uid}: ${error.message}`);
        }
    }

</script>

<div class="container mx-auto p-4 md:p-8">
    <h1 class="text-3xl font-bold mb-6">Admin Panel - User Management</h1>

    {#if $isLoading}
        <div class="flex justify-center items-center p-10">
            <span class="loading loading-lg loading-spinner text-primary"></span>
            <span class="ml-4 text-xl">Loading users...</span>
        </div>
    {:else if $errorMessage}
        <div role="alert" class="alert alert-error mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Error: {$errorMessage}</span>
        </div>
    {/if}

    {#if !$isLoading}
        <div class="overflow-x-auto shadow-lg rounded-lg">
            <table class="table w-full table-zebra">
                <thead>
                    <tr class="bg-base-200">
                        <th>Email</th>
                        <th>Current Role</th>
                        <th>Change Role</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $users as user (user.uid)}
                        <tr class="hover">
                            <td>{user.email}</td>
                            <td>
                                <span class={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ghost'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                <select 
                                    class="select select-bordered select-sm w-full max-w-xs"
                                    value={$pendingRoleChanges[user.uid] ?? user.role} 
                                    on:change={(e) => handleRoleChange(user.uid, e.target.value)}
                                    disabled={$savingStatus[user.uid] === 'saving'}
                                >
                                    {#each availableRoles as roleOption}
                                        <option value={roleOption}>{roleOption}</option>
                                    {/each}
                                </select>
                            </td>
                            <td class="w-40">
                                {#if $pendingRoleChanges[user.uid] && $pendingRoleChanges[user.uid] !== user.role}
                                    <button 
                                        class="btn btn-sm btn-primary"
                                        on:click={() => saveRoleChange(user.uid)}
                                        disabled={$savingStatus[user.uid] === 'saving'}
                                    >
                                        {#if $savingStatus[user.uid] === 'saving'}
                                            <span class="loading loading-spinner loading-xs"></span> Saving...
                                        {:else}
                                            Save Change
                                        {/if}
                                    </button>
                                {:else if $savingStatus[user.uid] === 'success'}
                                     <span class="text-success font-semibold">Saved!</span>
                                {:else if $savingStatus[user.uid] === 'error'}
                                     <span class="text-error font-semibold">Error</span>
                                {:else}
                                    <span class="text-base-content text-opacity-50 text-sm italic">No changes</span>
                                {/if}
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="4" class="text-center py-4">No users found.</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div> 