<script>
    import { fade, fly } from 'svelte/transition';
    let {answers = $bindable(), questions, step} = $props();
</script>

<div class="questions-wrapper">
    {#key step}
        <div class="questions-container"
            in:fly={{ x: 100, duration: 400, delay: 300, opacity: 0 }} 
            out:fade={{ duration: 200 }}>
            {#if questions[step].questions}
                {#each questions[step].questions as question}
                    <label class="toggle-button">
                        <input 
                            type="checkbox" 
                            bind:checked={answers[question.id]}
                        >
                        <span class="toggle-slider"></span>
                        <span class="question-label">{question.question}</span>
                    </label>
                {/each}
            {/if}
        </div>
    {/key}
</div>

<style>
    .questions-wrapper {
        flex: 1;
        position: relative;
        overflow: hidden;
        margin-bottom: 64px; /* Height of button container */
    }

    .questions-container {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0 1rem;
        width: 100%;
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