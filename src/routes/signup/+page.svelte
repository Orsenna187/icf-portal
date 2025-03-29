<script>
    import Signup from '../../components/Signup.svelte';
    // import { authStore } from '$lib/stores/authStore'; // No longer needed
    // import { goto } from '$app/navigation'; // No longer needed

    // Server load function in +layout.server.js handles redirecting logged-in users away.
    export let data; // Get user data from layout load

</script>

{#if !data.user} 
    <!-- Show Signup only if user data from server is null -->
    <Signup />
     <p class="text-center mt-4">
        Already have an account? 
        <a href="/login" class="link link-primary">Login here</a>
    </p>
{:else}
    <!-- This part should ideally not be reached due to server-side redirect -->
    <p class="text-center mt-4">Redirecting...</p> 
{/if} 