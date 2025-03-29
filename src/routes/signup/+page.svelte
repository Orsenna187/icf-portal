<script>
    import Signup from '../../components/Signup.svelte';
    import { authStore } from '$lib/stores/authStore';
    import { goto } from '$app/navigation';

    // If user is already logged in, redirect them away from signup page
    $: if ($authStore.user && !$authStore.loading) {
        goto('/'); // Redirect to home page or dashboard
    }
</script>

{#if $authStore.loading}
    <div class="min-h-screen flex items-center justify-center">
		<span class="loading loading-spinner loading-lg"></span> 
	</div>
{:else if !$authStore.user}
    <Signup />
     <p class="text-center mt-4">
        Already have an account? 
        <a href="/login" class="link link-primary">Login here</a>
    </p>
{:else}
    <!-- This part should ideally not be reached due to the redirect -->
    <p>You are already logged in.</p>
{/if} 