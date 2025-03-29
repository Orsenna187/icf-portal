<script>
    import Login from '../../components/Login.svelte';
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';

    // If user is already logged in, redirect them away from login page (e.g., to dashboard)
    $: if ($authStore.user && !$authStore.loading) {
        goto('/'); // Redirect to home page or dashboard
    }
</script>

{#if $authStore.loading}
    <p>Loading authentication status...</p>
{:else if !$authStore.user}
    <Login />
    <!-- Optional: Add a link to a signup page -->
    <!-- <p>Don't have an account? <a href="/signup">Sign up</a></p> -->
    <p class="text-center mt-4">
        Don't have an account? 
        <a href="/signup" class="link link-primary">Sign up here</a>
    </p>
{:else}
    <!-- This part should ideally not be reached due to the redirect -->
    <p>You are already logged in.</p>
{/if} 