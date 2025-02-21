<script>
	import { Card } from 'flowbite-svelte';
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="card rounded-lg shadow-lg px-2 sm:px-4 py-4 w-full max-w-[800px] h-[95vh] bg-gradient-to-br from-white to-blue-50/80 backdrop-blur-sm overflow-y-auto">
		<slot></slot>
	</div>
</div>
