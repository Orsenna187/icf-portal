<script>	
	import { fade, fly } from 'svelte/transition';
	import { Card } from 'flowbite-svelte';
	import CardCustom from './CardCustom.svelte';

	const questions = [
		{
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
		},
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
		{
			question: "Are you the principal investigator?",
			id: "is_principal_investigator",
		},
		{
			question: "Are you the delegated sub-investigator?",
			id: "is_sub_investigator",
		},
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
		},
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
		},
	];
	
	let formState = $state({
		answers: {},
		step: 0,
		error: '',
	});

	$inspect(formState);
</script>

<main>
	<div class="content-wrapper">
		<CardCustom>
			<div class="top-navigation">
				<button 
					class="btn-previous" 
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
			</div>
			<div class="progress-container">
				<div 
					class="progress-bar" 
					style="width: {(formState.step / (questions.length - 1)) * 100}%"
				></div>
			</div>
			{#key formState.step}
				<h1 class="question-text" 
					in:fly={{ x: 100, duration: 400, delay: 200, opacity: 0 }} 
					out:fade={{ duration: 200 }}>
					{questions[formState.step].question}
				</h1>
			{/key}
			<div class="button-container">
				<button class="btn-no" onclick={() => {
					formState.answers[questions[formState.step].id] = false;
					if (formState.step < questions.length - 1) formState.step++;
				}}>No</button>
				<button class="btn-yes" onclick={() => {
					formState.answers[questions[formState.step].id] = true;
					if (formState.step < questions.length - 1) formState.step++;
				}}>Yes</button>
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
		min-height: 500px;
		position: relative;
		padding-bottom: 80px;
	}

	.question-text {
		font-family: 'Poppins', 'Inter', system-ui, sans-serif;
		font-size: clamp(1.5rem, 5vw, 4rem);
		color: #2c3e50;
		text-align: center;
		padding: 1rem;
		line-height: 1.4;
		font-weight: 700;
		flex: 1;
	}

	.progress-container {
		width: 100%;
		height: 8px;
		background-color: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 2rem;
	}

	.progress-bar {
		height: 100%;
		background-color: #007bff;
		transition: width 0.3s ease;
	}

	.button-container {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		padding: 1rem;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: white;
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
	}

	.btn-no, .btn-yes {
		flex: 1;
		padding: clamp(1rem, 3vw, 2rem);
		font-size: clamp(1rem, 3vw, 2rem);
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.btn-no {
		background-color: #f0f0f0;
		color: #2c3e50;
		font-weight: 600;
	}

	.btn-yes {
		background-color: #007bff;
		color: white;
		font-weight: 600;
	}

	.top-navigation {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.btn-previous {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #4B5563;
		background-color: #F3F4F6;
		border: none;
		border-radius: 0.375rem;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.btn-previous:hover:not(:disabled) {
		background-color: #E5E7EB;
		color: #1F2937;
		transform: translateX(-2px);
	}

	.btn-previous:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-previous svg {
		width: 1.25rem;
		height: 1.25rem;
	}
</style>