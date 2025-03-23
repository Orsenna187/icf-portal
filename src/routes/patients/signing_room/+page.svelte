<script>	
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { db } from '../../../lib/firebase';
	import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
	import Questionnaire from './Questionnaire.svelte';
	import IcfReader from './IcfReader.svelte';
	import EmailConfirmation from './EmailConfirmation.svelte';
	import Summary from './Summary.svelte';
	import SendEmailLink from './SendEmailLink.svelte';
	import WaitingForSignature from './WaitingForSignature.svelte';

	let patientId = null;
	let selectedPatient = null;
	let isLoadingPatient = false;
	let patientError = null;

	// Fetch patient data if ID is provided
	async function fetchPatient() {
		if (!patientId) return;
		
		try {
			isLoadingPatient = true;
			patientError = null;
			
			const patientRef = doc(db, "patients", patientId);
			const docSnap = await getDoc(patientRef);
			
			if (!docSnap.exists()) {
				patientError = "Patient not found";
				return;
			}
			
			selectedPatient = {
				id: docSnap.id,
				...docSnap.data()
			};
			
		} catch (err) {
			console.error("Error fetching patient:", err);
			patientError = "Failed to load patient data";
		} finally {
			isLoadingPatient = false;
		}
	}

	onMount(() => {
		// Get patient ID from URL if provided
		patientId = $page.url.searchParams.get('patient');
		fetchPatient();
	});

	const questions = {
		0: {
			title: 'Who is participating?',
			questions: [{
				question: "Is the patient present?", 
				id: "patient_present", 
			},
			{
				question: "Is the legal guardian present?", 
				id: "guardian_present", 
			},
			{
				question: "Is the principal investigator present?",
				id: "investigator_present", 
			},
			{
				question: "Is the delegated sub-investigator present?",
				id: "sub_investigator_present", 
			}]
		},
		1: {
			title: 'Please present the ICFs',
			component: IcfReader
		},
		2: {
			title: "Who is the medical representative",
			questions: [
				{
					question: "Are you the principal investigator?",
					id: "is_principal_investigator",
				},
				{
					question: "Are you the delegated sub-investigator?",
					id: "is_sub_investigator",
				}]
		},
		3: {
			title: "Questions for the investigator (1/2)",
			questions: [
				{
					question: "Have you informed the patient about the protocol and the ICFs?",
					id: "investigator_informed_patient",
				},
				{
					question: "Have you ensured that the patient and/or the legal guardian has understood the study?",
					id: "investigator_understood_study",
				},
				{
					question: "Have you answered all the questions from the patient and/or the legal guardian?",
					id: "investigator_answered_questions",
				},
				{
					question: "Are you certain that the participation is voluntary, free and informed?",
					id: "investigator_voluntary_free_informed",
				}
			]
		},
		4: {
			title: "Questions for the investigator (2/2)",
			questions: [
				{
					question: "Has the patient had sufficient time to consider their participation?",
					id: "investigator_had_time_to_consider",
				},
				{
					question: "Has the patient been informed of their right to withdraw from the study at any time?",
					id: "investigator_right_to_withdraw",
				},
				{
					question: "Has the signature process happened before any medical procedure tied to the protocol?",
					id: "investigator_signature_before_procedure",
				}
			]
		},
		5: {
			title: 'Send signing link to patient',
			component: SendEmailLink
		},
		6: {
			title: 'Waiting for patient signature',
			component: WaitingForSignature
		},
		7: {
			title: "ICF has been signed",
			component: EmailConfirmation
		},
		8: {
			title: "Summary",
			component: Summary
		}
	};

	// Initialize answers object with all question IDs set to false
	const initializeAnswers = () => {
		const answers = {};
		Object.values(questions).forEach(section => {
			if (section.questions) {
				section.questions.forEach(q => {
					answers[q.id] = false;
				});
			}
		});
		return answers;
	};

	let formState = $state({
		answers: initializeAnswers(),
		step: 0,
		error: '',
	});

	// Handle email sent event
	function handleEmailSent() {
		// Move to the waiting for signature step
		formState.step = 6;
	}

	// Handle signing complete event
	function handleSigningComplete() {
		// Move to the confirmation step
		formState.step = 7;
	}

	let Comp = $derived(questions[formState.step].component);
</script>

<main class="min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] bg-base-200 flex items-center overflow-hidden">
	<div class="w-full mx-auto p-4">
		<div class="card bg-base-100 shadow-xl max-w-[800px] mx-auto min-h-[calc(100vh-8rem)]">
			<div class="card-body flex flex-col h-full relative overflow-y-auto">
				<h1 class="card-title text-xl md:text-2xl font-bold">
					{questions[formState.step].title}
				</h1>

				<!-- Progress bar -->
				<div class="w-full h-2 bg-base-200 rounded-full overflow-hidden mb-4">
					<div 
						class="h-full bg-primary transition-all duration-300"
						style="width: {(formState.step / (Object.keys(questions).length - 1)) * 100}%"
					></div>
				</div>

				<!-- Questionnaire or custom component -->
				{#key formState.step}
					<div
						in:fly={{ x: 100, duration: 400, delay: 300, opacity: 0 }} 
						out:fade={{ duration: 200 }}
					>
						{#if questions[formState.step].questions}
							<Questionnaire
								questions={questions}
								step={formState.step}
								bind:answers={formState.answers}
							/>
						{:else if questions[formState.step].component}
							{#if formState.step === 5}
								<SendEmailLink patientData={selectedPatient} onEmailSent={handleEmailSent} />
							{:else if formState.step === 6}
								<WaitingForSignature patientData={selectedPatient} onSigningComplete={handleSigningComplete} />
							{:else}
								<Comp/>
							{/if}
						{/if}
					</div>
				{/key}

				<!-- Buttons -->
				<div class="card-actions justify-between mt-auto pt-4">
					<button 
						class="btn btn-primary"
						onclick={() => {
							if (formState.step > 0) formState.step--;
						}}
						disabled={formState.step === 0 || formState.step === 6}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
							<path d="M15 18l-6-6 6-6"/>
						</svg>
						Previous
					</button>
					<button 
						class="btn btn-primary"
						onclick={() => {
							if (formState.step < Object.keys(questions).length - 1) formState.step++;
						}}
						disabled={formState.step === 5 || formState.step === 6}
					>
						Next
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
							<path d="M9 18l6-6-6-6"/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
</main>