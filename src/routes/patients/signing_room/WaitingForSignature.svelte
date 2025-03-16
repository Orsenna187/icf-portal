<script>
    import { onMount, onDestroy } from 'svelte';
    import { db } from '../../../lib/firebase';
    import { doc, onSnapshot } from 'firebase/firestore';
    
    // Props
    export let patientData = null;
    export let onSigningComplete = () => {};
    
    let isLoading = true;
    let error = null;
    let unsubscribe = null;
    
    // Set up real-time listener for patient document changes
    onMount(() => {
        if (patientData && patientData.id) {
            const patientRef = doc(db, "patients", patientData.id);
            
            unsubscribe = onSnapshot(patientRef, 
                (docSnapshot) => {
                    isLoading = false;
                    const data = docSnapshot.data();
                    
                    // Check if the patient has signed the document
                    if (data && data.icf_status === 'signed') {
                        onSigningComplete();
                    }
                },
                (err) => {
                    console.error("Error listening for patient updates:", err);
                    error = "Failed to monitor signing status. Please refresh the page.";
                    isLoading = false;
                }
            );
        }
    });
    
    // Clean up listener when component is destroyed
    onDestroy(() => {
        if (unsubscribe) {
            unsubscribe();
        }
    });
</script>

<div class="flex flex-col items-center justify-center py-12">
    <div class="text-center mb-8">
        <h2 class="text-xl font-semibold mb-4">Waiting for Patient Signature</h2>
        <p class="text-gray-600 mb-6">
            An email with a signing link has been sent to {patientData?.email}.
            <br>
            Please wait while the patient completes the signing process.
        </p>
        
        {#if patientData}
            <div class="bg-base-200 p-4 rounded-lg mt-4 text-left max-w-md mx-auto">
                <p><strong>Patient:</strong> {patientData.name}</p>
                <p><strong>Email:</strong> {patientData.email}</p>
                <p><strong>Status:</strong> <span class="badge badge-warning">Waiting for signature</span></p>
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
    
    <div class="flex flex-col items-center mt-6">
        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p class="text-lg font-medium text-gray-600">Waiting for patient to sign...</p>
    </div>
</div> 