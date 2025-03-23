<script>
    import { db } from '../../lib/firebase';
    import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
    
    let testPatient = {
        name: 'Test Patient',
        email: 'test@example.com',
        icf_status: 'not sent'
    };
    
    let signingLink = '';
    let isLoading = false;
    let error = null;
    
    async function createTestPatient() {
        try {
            isLoading = true;
            error = null;
            
            // Create a test patient
            const docRef = await addDoc(collection(db, "patients"), testPatient);
            
            // Generate a test token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Update the patient with the signing token
            await updateDoc(doc(db, "patients", docRef.id), {
                signing_token: token
            });
            
            // Generate the signing link
            signingLink = `${window.location.origin}/patients/sign/${docRef.id}?token=${token}`;
            
        } catch (err) {
            console.error("Error creating test patient:", err);
            error = "Failed to create test patient";
        } finally {
            isLoading = false;
        }
    }
</script>

<main class="min-h-screen bg-base-200 py-4 sm:py-8">
    <div class="container mx-auto px-4">
        <div class="card bg-base-100 shadow-xl max-w-3xl mx-auto">
            <div class="card-body p-4 sm:p-6">
                <h1 class="text-xl sm:text-2xl font-bold mb-4">Debug Tools</h1>
                
                <div class="bg-base-200 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                    <h2 class="text-lg sm:text-xl font-semibold mb-4">Generate Test Signing Link</h2>
                    <div class="space-y-2">
                        <p class="text-sm sm:text-base whitespace-normal break-words"><strong>Test Patient:</strong> {testPatient.name}</p>
                        <p class="text-sm sm:text-base whitespace-normal break-words"><strong>Test Email:</strong> {testPatient.email}</p>
                    </div>
                </div>
                
                {#if error}
                    <div class="alert alert-error shadow-lg my-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="whitespace-normal break-words">{error}</span>
                    </div>
                {/if}
                
                {#if signingLink}
                    <div class="alert alert-success shadow-lg my-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p class="font-bold whitespace-normal break-words">Test Signing Link Generated!</p>
                            <a href={signingLink} target="_blank" class="link link-hover break-all text-sm sm:text-base whitespace-normal break-words">
                                {signingLink}
                            </a>
                        </div>
                    </div>
                {/if}
                
                <div class="card-actions justify-end mt-6 pt-4 border-t border-base-200">
                    <button 
                        class="btn btn-primary"
                        on:click={createTestPatient}
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <span class="loading loading-spinner loading-sm mr-2"></span>
                            Creating...
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Generate Test Link
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
</main> 