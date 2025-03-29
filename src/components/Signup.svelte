<script>
    import { authHandlers } from '$lib/stores/authStore';
    import { goto } from '$app/navigation'; // For redirecting after signup

    let email = '';
    let password = '';
    let confirmPassword = '';
    let errorMessage = '';
    let loading = false;

    // Regex for password validation: at least 8 chars, 1 letter, 1 number, 1 symbol
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    async function handleSignup() {
        errorMessage = ''; // Clear previous errors

        if (password !== confirmPassword) {
            errorMessage = 'Passwords do not match.';
            return;
        }

        if (!passwordRegex.test(password)) {
             errorMessage = 'Password must be at least 8 characters long and include at least one letter, one number, and one symbol (@$!%*?&).';
             return;
        }

        loading = true;
        try {
            await authHandlers.signup(email, password);
            goto('/'); 
        } catch (error) {
            console.error("Signup failed:", error);
            errorMessage = error.message; 
        } finally {
            loading = false;
        }
    }
</script>

<div class="card bg-base-100 shadow-xl max-w-md mx-auto my-10">
    <div class="card-body">
        <h2 class="card-title justify-center text-2xl mb-4">Sign Up</h2>
        <form on:submit|preventDefault={handleSignup} class="space-y-4">
            <div class="form-control">
                <label class="label" for="email">
                    <span class="label-text">Email</span>
                </label>
                <input 
                    type="email" 
                    id="email" 
                    placeholder="you@example.com" 
                    class="input input-bordered w-full" 
                    bind:value={email} 
                    required 
                    disabled={loading} 
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
                    bind:value={password} 
                    required 
                    minlength="8"
                    disabled={loading} 
                />
                 <label class="label">
                    <span class="label-text-alt text-info">Min. 8 characters, including letter, number, and symbol (@$!%*?&).</span>
                 </label>
            </div>
             <div class="form-control">
                <label class="label" for="confirmPassword">
                    <span class="label-text">Confirm Password</span>
                </label>
                <input 
                    type="password" 
                    id="confirmPassword" 
                    placeholder="••••••••" 
                    class="input input-bordered w-full" 
                    bind:value={confirmPassword} 
                    required 
                    disabled={loading} 
                />
            </div>
            
            {#if errorMessage}
                <div role="alert" class="alert alert-error text-sm p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <div class="card-actions justify-end mt-6">
                 <button type="submit" class="btn btn-primary w-full" disabled={loading || (password && !passwordRegex.test(password)) || (password !== confirmPassword && confirmPassword !== '') }>
                    {#if loading}
                        <span class="loading loading-spinner"></span>
                        Signing up...
                    {:else}
                        Sign Up
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div> 