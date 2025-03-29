<script>
    import { authStore, authHandlers } from '$lib/stores/authStore';
    import { goto } from '$app/navigation'; // Often not needed here, handled by layout

    let email = '';
    let password = '';
    let errorMessage = '';
    let loading = false;

    async function handleLogin() {
        loading = true;
        errorMessage = '';
        try {
            await authHandlers.login(email, password);
            // Login successful, Firebase auth state changes, listener in authStore updates,
            // and the layout effect handles redirecting if user was on login page.
            // Explicit goto('/') might be needed if you want immediate redirect before layout effect runs,
            // but usually the layout handles it fine.
        } catch (error) {
            console.error("Login failed:", error);
            errorMessage = error.message; // Display Firebase error message
        } finally {
            loading = false;
        }
    }
</script>

<div class="card bg-base-100 shadow-xl max-w-md mx-auto my-10">
    <div class="card-body">
        <h2 class="card-title justify-center text-2xl mb-4">Login</h2>
        <form on:submit|preventDefault={handleLogin} class="space-y-4">
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
                    disabled={loading} 
                />
                 <!-- Optional: Link to password reset -->
                 <!-- <label class="label">
                    <a href="/forgot-password" class="label-text-alt link link-hover">Forgot password?</a>
                 </label> -->
            </div>
            
            {#if errorMessage}
                 <div role="alert" class="alert alert-error text-sm p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <div class="card-actions justify-end mt-6">
                 <button type="submit" class="btn btn-primary w-full" disabled={loading}>
                    {#if loading}
                        <span class="loading loading-spinner"></span>
                        Logging in...
                    {:else}
                        Login
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Removed old <style> block --> 