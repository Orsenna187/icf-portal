<script>	
	import { fade, fly } from 'svelte/transition';
	import Questionnaire from './Questionnaire.svelte';
	import IcfReader from './IcfReader.svelte';
	import EmailConfirmation from './EmailConfirmation.svelte';
	import Summary from './Summary.svelte';

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
		6: {
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
		},
		7: {
			title: "ICFs have been signed...  (placeholder)",
			component: EmailConfirmation
		},
		8: {
			title: "Summary has been sent... (placeholder)",
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

	let Comp = $derived(questions[formState.step].component);

	$inspect(formState);
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
							<Comp/>
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
						disabled={formState.step === 0}
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