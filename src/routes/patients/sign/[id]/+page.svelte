<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { db } from '../../../../lib/firebase';
    import { doc, getDoc, updateDoc } from 'firebase/firestore';
    import { fade, fly } from 'svelte/transition';
    
    // Get patient ID from URL params
    const patientId = $page.params.id;
    const token = $page.url.searchParams.get('token');
    
    let patient = null;
    let isLoading = true;
    let error = null;
    let success = false;
    
    // Patient questions state
    let currentStep = 0;
    let answers = {
        patient_informed_about_study: false,
        patient_understood_documentation: false,
        patient_asked_all_questions: false,
        patient_answered_all_questions: false,
        patient_voluntary_participation: false,
        patient_had_time_to_consider: false,
        patient_can_stop_participation: false
    };
    let hasAgreed = false;
    
    // Questions for the patient
    const questions = [
        {
            title: 'Questions for the patient (1/2)',
            questions: [
                {
                    question: "Have you been informed about the study?",
                    id: "patient_informed_about_study",
                },
                {
                    question: "Have you understood the documentation you are about to sign?",
                    id: "patient_understood_documentation",
                },
                {
                    question: "Have you asked all the questions you had about the study?",
                    id: "patient_asked_all_questions",
                },
                {
                    question: "Has the investigator answered all your questions?",
                    id: "patient_answered_all_questions",
                },
            ]
        },
        {
            title: 'Questions for the patient (2/2)',
            questions: [
                {
                    question: "Do you confirm that you are voluntarily participating in this study?",
                    id: "patient_voluntary_participation",
                },
                {
                    question: "Have you been given enough time to consider your participation?",
                    id: "patient_had_time_to_consider",
                },
                {
                    question: "Do you understand that you can stop participation at any time?",
                    id: "patient_can_stop_participation",
                },
            ]
        }
    ];
    
    // Fetch patient data
    async function fetchPatient() {
        try {
            isLoading = true;
            error = null;
            
            if (!patientId || !token) {
                error = "Invalid signing link. Please contact your healthcare provider.";
                return;
            }
            
            const patientRef = doc(db, "patients", patientId);
            const docSnap = await getDoc(patientRef);
            
            if (!docSnap.exists()) {
                error = "Patient not found. Please contact your healthcare provider.";
                return;
            }
            
            const patientData = docSnap.data();
            
            // Verify token
            if (!patientData.signing_token || patientData.signing_token !== token) {
                error = "Invalid or expired signing link. Please contact your healthcare provider.";
                return;
            }
            
            // Check if already signed
            if (patientData.icf_status === 'signed') {
                error = "You have already signed this document.";
                return;
            }
            
            patient = {
                id: docSnap.id,
                ...patientData
            };
            
        } catch (err) {
            console.error("Error fetching patient:", err);
            error = "Failed to load patient data. Please try again later.";
        } finally {
            isLoading = false;
        }
    }
    
    // Sign the ICF document
    async function signDocument() {
        try {
            isLoading = true;
            error = null;
            
            // Check if all questions are answered
            const allQuestionsAnswered = Object.values(answers).every(answer => answer === true);
            
            if (!allQuestionsAnswered || !hasAgreed) {
                error = "Please answer all questions and agree to the terms before signing.";
                isLoading = false;
                return;
            }
            
            // Update patient status to 'signed' in Firestore
            const patientRef = doc(db, "patients", patientId);
            await updateDoc(patientRef, {
                icf_status: 'signed',
                signing_date: new Date(),
                patient_answers: answers
            });
            
            success = true;
            
        } catch (err) {
            console.error("Error signing document:", err);
            error = "Failed to sign document. Please try again.";
        } finally {
            isLoading = false;
        }
    }
    
    // Check if all questions in current step are answered
    $: canProceed = questions[currentStep].questions.every(q => answers[q.id] === true);
    
    // Check if all questions are answered for final submission
    $: canSign = questions.flatMap(section => section.questions)
        .every(q => answers[q.id] === true) && hasAgreed;
    
    onMount(fetchPatient);
</script>

<main class="min-h-screen bg-base-200 py-4 sm:py-8">
    <div class="container mx-auto px-4">
        <div class="card bg-base-100 shadow-xl max-w-3xl mx-auto">
            <div class="card-body p-4 sm:p-6">
                {#if isLoading && !success}
                    <div class="flex flex-col items-center justify-center py-12">
                        <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
                        <p class="text-lg font-medium text-gray-600">Loading...</p>
                    </div>
                {:else if error}
                    <div class="alert alert-error shadow-lg my-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                {:else if success}
                    <div class="flex flex-col items-center justify-center py-12" in:fade={{ duration: 300 }}>
                        <div class="text-center">
                            <div class="bg-success text-success-content rounded-full p-4 inline-block mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 class="text-2xl font-bold mb-2">Document Signed Successfully!</h2>
                            <p class="text-gray-600 mb-6">
                                Thank you for signing the Informed Consent Form. Your healthcare provider has been notified.
                            </p>
                            <p class="text-sm text-gray-500">You can now close this window.</p>
                        </div>
                    </div>
                {:else if patient}
                    <div class="flex flex-col h-full">
                        <div class="flex-1">
                            <h1 class="text-xl sm:text-2xl font-bold mb-4">ICF Signing Portal</h1>
                            <div class="bg-base-200 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                                <p class="text-sm sm:text-base"><strong>Patient:</strong> {patient.name}</p>
                                <p class="text-sm sm:text-base"><strong>Email:</strong> {patient.email}</p>
                            </div>
                            
                            <!-- Progress bar -->
                            <div class="w-full h-2 bg-base-200 rounded-full overflow-hidden mb-4 sm:mb-6">
                                <div 
                                    class="h-full bg-primary transition-all duration-300"
                                    style="width: {(currentStep / (questions.length + (hasAgreed ? 0 : 1))) * 100}%"
                                ></div>
                            </div>
                            
                            {#key currentStep}
                                <div in:fly={{ x: 100, duration: 400, delay: 300, opacity: 0 }} out:fade={{ duration: 200 }}>
                                    {#if currentStep < questions.length}
                                        <!-- Questions -->
                                        <h2 class="text-lg sm:text-xl font-semibold mb-4">{questions[currentStep].title}</h2>
                                        <div class="space-y-3 sm:space-y-4 mb-6">
                                            {#each questions[currentStep].questions as q}
                                                <div class="form-control">
                                                    <label class="label cursor-pointer justify-start gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300">
                                                        <input 
                                                            type="checkbox" 
                                                            class="checkbox checkbox-primary shrink-0" 
                                                            bind:checked={answers[q.id]}
                                                        />
                                                        <span class="label-text text-sm sm:text-base whitespace-normal break-words">{q.question}</span>
                                                    </label>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <!-- Final agreement -->
                                        <h2 class="text-lg sm:text-xl font-semibold mb-4">Sign the Informed Consent Form</h2>
                                        <div class="bg-base-200 p-3 sm:p-4 rounded-lg mb-6">
                                            <p class="mb-4 text-sm sm:text-base">
                                                By checking the box below, I confirm that I have read and understood the Informed Consent Form, 
                                                and I voluntarily agree to participate in the study as described.
                                            </p>
                                            <div class="form-control">
                                                <label class="label cursor-pointer justify-start gap-3 p-3 bg-base-100 rounded-lg hover:bg-base-200">
                                                    <input 
                                                        type="checkbox" 
                                                        class="checkbox checkbox-primary shrink-0" 
                                                        bind:checked={hasAgreed}
                                                    />
                                                    <span class="label-text font-medium text-sm sm:text-base whitespace-normal break-words">I agree to participate in this study</span>
                                                </label>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/key}
                        </div>
                        
                        <!-- Navigation buttons -->
                        <div class="flex justify-between mt-6 pt-4 border-t border-base-200">
                            {#if currentStep > 0}
                                <button 
                                    class="btn btn-outline"
                                    on:click={() => currentStep--}
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </button>
                            {:else}
                                <div></div>
                            {/if}
                            
                            {#if currentStep < questions.length}
                                <button 
                                    class="btn btn-primary"
                                    on:click={() => currentStep++}
                                    disabled={!canProceed || isLoading}
                                >
                                    {currentStep === questions.length - 1 ? 'Continue to Sign' : 'Continue'}
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            {:else}
                                <button 
                                    class="btn btn-success"
                                    on:click={signDocument}
                                    disabled={!canSign || isLoading}
                                >
                                    {#if isLoading}
                                        <span class="loading loading-spinner loading-sm mr-2"></span>
                                        Signing...
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Sign Document
                                    {/if}
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</main> 