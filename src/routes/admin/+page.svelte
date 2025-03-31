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

    // New user form data and state
    let newUserEmail = '';
    let newUserPassword = '';
    let newUserRole = 'user';
    let isCreatingUser = false;
    let createUserSuccess = '';
    let createUserError = '';
    let showCreateUserModal = false;

    // Password regex for validation: at least 8 chars, 1 letter, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    // Email regex for basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    // Function to open the create user modal
    function openCreateUserModal() {
        // Reset form and states
        newUserEmail = '';
        newUserPassword = '';
        newUserRole = 'user';
        createUserSuccess = '';
        createUserError = '';
        showCreateUserModal = true;
    }

    // Function to close the create user modal
    function closeCreateUserModal() {
        showCreateUserModal = false;
        // If there was a success message, we might want to keep it visible on the main page
        // So only clear error messages here
        createUserError = '';
    }

    // Function to create a new user
    async function createNewUser() {
        // Reset status messages
        createUserSuccess = '';
        createUserError = '';
        
        // Validate input
        if (!emailRegex.test(newUserEmail)) {
            createUserError = 'Please enter a valid email address';
            return;
        }
        
        if (!passwordRegex.test(newUserPassword)) {
            createUserError = 'Password must be at least 8 characters with at least one letter, one number, and one symbol (@$!%*?&)';
            return;
        }
        
        isCreatingUser = true;
        
        try {
            const response = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to create user (status: ${response.status})`);
            }
            
            const result = await response.json();
            
            // Add the new user to the users store
            users.update(currentUsers => [result.user, ...currentUsers]);
            
            // Reset form fields
            newUserEmail = '';
            newUserPassword = '';
            newUserRole = 'user';
            
            createUserSuccess = `User ${result.user.email} successfully created`;
            
            // Close the modal after successful creation
            showCreateUserModal = false;
            
            // Clear success message after a delay
            setTimeout(() => {
                createUserSuccess = '';
            }, 5000);
            
        } catch (error) {
            console.error('Failed to create user:', error);
            createUserError = `Failed to create user: ${error.message}`;
        } finally {
            isCreatingUser = false;
        }
    }
</script>

<div class="container mx-auto p-4 md:p-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Admin Panel - User Management</h1>
        <button class="btn btn-primary" on:click={openCreateUserModal}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Add User
        </button>
    </div>
    
    {#if createUserSuccess}
        <div role="alert" class="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{createUserSuccess}</span>
        </div>
    {/if}

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

<!-- Create User Modal -->
{#if showCreateUserModal}
    <div class="modal modal-open">
        <div class="modal-box max-w-2xl">
            <button on:click={closeCreateUserModal} class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <h3 class="font-bold text-xl mb-6">Create New User</h3>
            
            <form on:submit|preventDefault={createNewUser} class="space-y-4">
                <div class="form-control">
                    <label class="label" for="email">
                        <span class="label-text">Email</span>
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        placeholder="user@example.com" 
                        class="input input-bordered w-full" 
                        bind:value={newUserEmail} 
                        required 
                        disabled={isCreatingUser} 
                    />
                </div>
                
                <div class="form-control">
                    <label class="label" for="password">
                        <span class="label-text">Password</span>
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        placeholder="••••••••" 
                        class="input input-bordered w-full" 
                        bind:value={newUserPassword} 
                        required 
                        minlength="8"
                        disabled={isCreatingUser} 
                    />
                    <label class="label">
                        <span class="label-text-alt text-info">Min. 8 characters, including letter, number, and symbol (@$!%*?&).</span>
                    </label>
                </div>
                
                <div class="form-control">
                    <label class="label" for="role">
                        <span class="label-text">Role</span>
                    </label>
                    <select 
                        id="role"
                        class="select select-bordered w-full" 
                        bind:value={newUserRole}
                        disabled={isCreatingUser}
                    >
                        {#each availableRoles as role}
                            <option value={role}>{role}</option>
                        {/each}
                    </select>
                </div>
                
                {#if createUserError}
                    <div role="alert" class="alert alert-error mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{createUserError}</span>
                    </div>
                {/if}
                
                <div class="modal-action">
                    <button 
                        type="button" 
                        class="btn btn-ghost" 
                        on:click={closeCreateUserModal}
                        disabled={isCreatingUser}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="btn btn-primary" 
                        disabled={isCreatingUser || !newUserEmail || !newUserPassword || !passwordRegex.test(newUserPassword)}
                    >
                        {#if isCreatingUser}
                            <span class="loading loading-spinner"></span>
                            Creating...
                        {:else}
                            Create User
                        {/if}
                    </button>
                </div>
            </form>
        </div>
        <div class="modal-backdrop" on:click={closeCreateUserModal}></div>
    </div>
{/if} 