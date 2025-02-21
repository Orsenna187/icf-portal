<script>	
	import { fade, fly } from 'svelte/transition';
	import { Card } from 'flowbite-svelte';
	import CardCustom from './CardCustom.svelte';

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
			title: 'Present the ICFs (placeholder)'
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
			title: "ICFs have been signed...  (placeholder)"
		},
		8: {
			title: "Summary has been sent... (placeholder)"
		}
	};
	
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
			<h1 class="step-title">
				{questions[formState.step].title}
			</h1>
			<div class="progress-container">
				<div 
					class="progress-bar" 
					style="width: {(formState.step / (Object.keys(questions).length - 1)) * 100}%"
				></div>
			</div>
			{#key formState.step}
				<div class="questions-container"
					in:fly={{ x: 100, duration: 400, delay: 300, opacity: 0 }} 
					out:fade={{ duration: 200 }}>
					{#if questions[formState.step].questions}
						{#each questions[formState.step].questions as question}
							<label class="toggle-button">
								<input 
									type="checkbox" 
									bind:checked={formState.answers[question.id]}
								>
								<span class="toggle-slider"></span>
								<span class="question-label">{question.question}</span>
							</label>
						{/each}
					{/if}
				</div>
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
			{/key}
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
		padding-bottom: 64px;
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

	.questions-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0 1rem;
		flex: 1;
		overflow-y: auto;
		margin-bottom: 0;
	}

	.toggle-button {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.5rem 0.75rem;
		background-color: #f8f9fa;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.toggle-button:hover {
		background-color: #e9ecef;
	}

	.toggle-button input[type="checkbox"] {
		display: none;
	}

	.toggle-slider {
		position: relative;
		width: 2.75rem;
		height: 1.5rem;
		background-color: #e0e0e0;
		border-radius: 1rem;
		transition: background-color 0.2s ease;
		flex-shrink: 0;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		left: 0.25rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.toggle-button input[type="checkbox"]:checked + .toggle-slider {
		background-color: #007bff;
	}

	.toggle-button input[type="checkbox"]:checked + .toggle-slider::before {
		transform: translate(1.25rem, -50%);
	}

	.question-label {
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		color: #2c3e50;
		flex: 1;
		line-height: 1.4;
	}

</style>