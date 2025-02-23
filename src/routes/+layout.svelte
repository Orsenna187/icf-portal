<script>
	import '../app.css';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	let isMenuOpen = $state(false);
	let { children } = $props();
	let activeUrl = $derived($page.url.pathname);
	import { NewspaperOutline, BuildingOutline, UserOutline, FolderOutline, ShareNodesOutline, CalendarWeekOutline } from 'flowbite-svelte-icons'

	// Add base path handling for GitHub Pages
	const dev = process.env.NODE_ENV === 'development';
	const basePath = dev ? '' : '/icf-portal';

	const topNavItems = [
		{ href: '/', text: 'Button1' },
		{ href: '/about', text: 'Button2' },
		{ href: '/pricing', text: 'Button3' },
	];

	const sideNavItems = [
		{ 
			href: '/', 
			text: 'Newsletters',
			Icon: NewspaperOutline
		},
		{
			href: '/sites',
			text: 'Sites',
			Icon: BuildingOutline
		},
		{
			href: '/patients',
			text: 'Patients',
			Icon: UserOutline
		},
		{
			href: '/repository',
			text: 'Repository',
			Icon: FolderOutline
		},
		{
			href: '/documents',
			text: 'Shared Documents',
			Icon: ShareNodesOutline
		},
		{
			href: '/visits',
			text: 'Visits',
			Icon: CalendarWeekOutline
		},
	];

</script>	

<div class="min-h-screen flex flex-col">
	<!-- Top Navbar -->
	<nav class="bg-white/80 shadow-lg backdrop-blur-sm border-b border-gray-200">
		<div class="flex items-center justify-between px-4">
			<!-- Logo and Brand -->
			<a href="/" class="flex items-center py-4">
				<img src="{basePath}/medcm.png" class="h-8 sm:h-8" alt="Logo" />
				<span class="text-2xl font-bold text-gray-700 ml-2">MedCM</span>
			</a>

			<!-- Desktop Menu -->
			<div class="hidden md:flex items-center space-x-8">
				{#each topNavItems as { href, text }}
					<a {href} class="text-gray-600 hover:text-blue-600 transition-colors text-lg font-medium">{text}</a>
				{/each}
			</div>

			<!-- Mobile Menu Button -->
			<button 
				class="md:hidden py-4"
				on:click={() => isMenuOpen = !isMenuOpen}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</div>

		<!-- Mobile Menu -->
		{#if isMenuOpen}
			<div class="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4">
				<div class="flex flex-col space-y-4 px-6">
					{#each topNavItems as { href, text }}
						<a {href} class="text-gray-600 hover:text-blue-600 transition-colors text-lg font-medium">{text}</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>

	<div class="flex flex-1">
		<!-- Side Navbar -->
		<nav class="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 space-y-2">
			{#each sideNavItems as { href, text, Icon }}
				<a 
					{href} 
					class="flex items-center space-x-4 p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600 {href === activeUrl ? 'bg-blue-50 text-blue-600' : ''}"
				>
					<Icon/>
					<span class="font-medium">{text}</span>
				</a>
			{/each}
		</nav>

		<!-- Main Content -->
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}

	:global(*::-webkit-scrollbar) {
		display: none;
	}

	:global(*) {
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}

	:global(.flowbite-svelte-icons) {
		@apply flex-shrink-0;
	}
</style>