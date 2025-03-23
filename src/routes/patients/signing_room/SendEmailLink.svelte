<script>
    import { onMount } from 'svelte';
    import { db } from '../../../lib/firebase';
    import { doc, updateDoc } from 'firebase/firestore';
    
    // Props
    export let patientData = null;
    export let onEmailSent = () => {};
    
    let isLoading = false;
    let error = null;
    let success = false;
    let emailSent = false;
    
    // Generate a unique signing link
    function generateSigningLink() {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return `${window.location.origin}/patients/sign/${patientData.id}?token=${token}`;
    }
    
    // Send email with signing link
    async function sendSigningLink() {
        if (!patientData || !patientData.email) {
            error = "Patient email is missing";
            return;
        }
        
        try {
            isLoading = true;
            error = null;
            
            const signingLink = generateSigningLink();
            
            // Send email using the server endpoint
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: patientData.email,
                    subject: 'Sign Your ICF Document',
                    patientName: patientData.name,
                    signingLink: signingLink
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            // Update patient status in Firestore
            const patientRef = doc(db, "patients", patientData.id);
            await updateDoc(patientRef, {
                icf_status: 'sent',
                signing_link: signingLink,
                signing_token: signingLink.split('token=')[1]
            });
            
            success = true;
            emailSent = true;
            
            // Notify parent component that email was sent
            onEmailSent();
            
        } catch (err) {
            console.error("Error sending signing link:", err);
            error = "Failed to send signing link. Please try again.";
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="flex flex-col items-center justify-center py-6">
    <div class="text-center mb-8">
        <h2 class="text-xl font-semibold mb-4">Send Signing Link to Patient</h2>
        <p class="text-gray-600 mb-2">
            The patient will receive an email with a link to sign the ICF document on their own device.
        </p>
        {#if patientData}
            <div class="bg-base-200 p-4 rounded-lg mt-4 text-left">
                <p><strong>Patient:</strong> {patientData.name}</p>
                <p><strong>Email:</strong> {patientData.email}</p>
            </div>
        {/if}
    </div>
    
    {#if error}
        <div class="alert alert-error shadow-lg my-4 w-full max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
        </div>
    {/if}
    
    {#if success}
        <div class="alert alert-success shadow-lg my-4 w-full max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Signing link sent successfully to {patientData?.email}!</span>
        </div>
    {/if}
    
    <div class="mt-4">
        <button 
            class="btn btn-primary btn-lg"
            on:click={sendSigningLink}
            disabled={isLoading || emailSent}
        >
            {#if isLoading}
                <span class="loading loading-spinner loading-sm mr-2"></span>
                Sending...
            {:else if emailSent}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Email Sent
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Signing Link
            {/if}
        </button>
    </div>
</div> 