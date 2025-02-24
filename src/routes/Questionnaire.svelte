<script>
    let {answers = $bindable(), questions, step} = $props();
</script>

<div class="flex-1 relative overflow-hidden mb-16">
    <div class="relative flex flex-col gap-2 px-4">
        {#if questions[step].questions}
            {#each questions[step].questions as question}
                <label class="flex items-center gap-3 p-3 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300">
                    <input type="checkbox" class="toggle toggle-primary" bind:checked={answers[question.id]} />
                    <span>{question.question}</span>
                </label>
            {/each}
        {/if}
    </div>
</div>
