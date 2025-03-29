<script>
    import Login from '../../components/Login.svelte';
    // import { authStore } from '$lib/stores/authStore'; // No longer needed for loading/redirect
    // import { goto } from '$app/navigation'; // No longer needed for redirect

    // Server load function in +layout.server.js handles redirecting logged-in users away.

    // Props are passed from load functions. Here, we get data from the layout load.
    export let data;

</script>

{#if !data.user}
    <!-- Show Login only if user data from server is null -->
    <Login />
    <p class="text-center mt-4">
        Don't have an account? 
        <a href="/signup" class="link link-primary">Sign up here</a>
    </p>
{:else}
    <!-- This should ideally not be reached due to server-side redirect -->
    <!-- You could show a brief message or spinner while redirect happens -->
    <p class="text-center mt-4">Redirecting...</p> 
{/if} 