<script>	
	import { fade, fly } from 'svelte/transition';
	import { Card } from 'flowbite-svelte';
	import CardCustom from './CardCustom.svelte';
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
		3: {
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
		4: {
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
		5: {
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
		6: {
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
		7: {
			title: "ICFs have been signed...  (placeholder)",
			component: EmailConfirmation
		},
		8: {
			title: "Summary has been sent... (placeholder)",
			component: Summary
		}
	};
	
	let formState = $state({
		answers: {},
		step: 0,
		error: '',
	});

	let Comp = $derived(questions[formState.step].component);

	$inspect(formState);
</script>

<main>
	<div class="content-wrapper">
		<CardCustom>
			<h1 class="step-title">
				{questions[formState.step].title}
			</h1>

			<!-- Progress bar -->
			<div class="progress-container">
				<div 
					class="progress-bar" 
					style="width: {(formState.step / (Object.keys(questions).length - 1)) * 100}%"
				></div>
			</div>

			<!-- Questionnaire or custom component -->
			{#if questions[formState.step].questions}
				<Questionnaire
					questions={questions}
					step={formState.step}
					bind:answers={formState.answers}
				/>
			{:else if questions[formState.step].component}
				<Comp/>
			{/if}

			<!-- Buttons -->
			<div class="button-container">
				<button 
					class="btn-nav" 
					onclick={() => {
						if (formState.step > 0) formState.step--;
					}}
					disabled={formState.step === 0}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M15 18l-6-6 6-6"/>
					</svg>
					Previous
				</button>
				<button 
					class="btn-nav" 
					onclick={() => {
						if (formState.step < Object.keys(questions).length - 1) formState.step++;
					}}
				>
					Next
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 18l6-6-6-6"/>
					</svg>
				</button>
			</div>
		</CardCustom>
	</div>
	 <!-- <div>{JSON.stringify(formState)}</div> -->
</main>


<style>
	main {
		min-height: 100vh;
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.content-wrapper {
		width: 100%;
		margin: 0 auto;
		padding: 1rem;
		height: auto;
	}

	:global(.custom-card) {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	.progress-container {
		width: calc(100% - 2rem); /* Subtract padding */
		height: 8px;
		background-color: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
		margin: 0 1rem 1rem 1rem;
	}

	.progress-bar {
		height: 100%;
		background-color: #007bff;
		transition: width 0.3s ease;
	}

	.button-container {
		height: 64px;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: white;
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
	}

	.btn-nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: clamp(0.875rem, 2.5vw, 1.125rem);
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		font-weight: 600;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		flex: 1;
		justify-content: center;
	}

	.btn-nav:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.btn-nav:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: #e0e0e0;
	}

	.btn-nav svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.step-title {
		font-family: 'Poppins', 'Inter', system-ui, sans-serif;
		font-size: clamp(1.125rem, 3vw, 1.75rem);
		color: #2c3e50;
		text-align: left;
		padding: 1rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
</style>