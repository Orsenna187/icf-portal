<script>
	import '../app.css';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	let isMenuOpen = $state(false);
	let { children } = $props();
	let activeUrl = $derived($page.url.pathname);
	import MdiNewspaper from 'virtual:icons/mdi/newspaper';
	import MdiHospitalBuilding from 'virtual:icons/mdi/hospital-building';
	import MdiPatient from 'virtual:icons/mdi/patient';
	import MdiFolderOutline from 'virtual:icons/mdi/folder-outline';
	import MdiShareVariantOutline from 'virtual:icons/mdi/share-variant-outline';
	import MdiCalendarMonthOutline from 'virtual:icons/mdi/calendar-month-outline';

	const studies = [
		'demo-study-1',
		'demo-study-2',
		'demo-study-3',
		'demo-study-4',
		'demo-study-5',
	]
	
	let selectedStudy = $state(studies[0]);

	const topNavItems = [
		{ 
			text: 'Select Study',
			items: studies.map(study => ({
				value: study,
				text: study
			}))
		}
	];

	const sideNavItems = [
		{ 
			href: '/', 
			text: 'Study Newsletters',
			Icon: MdiNewspaper
		},
		{
			href: '/sites',
			text: 'Sites',
			Icon: MdiHospitalBuilding
		},
		{
			href: '/patients',
			text: 'Patients',
			Icon: MdiPatient
		},
		{
			href: '/repository',
			text: "Study Team Repository",
			Icon: MdiFolderOutline
		},
		{
			href: '/shared_documents',
			text: 'Shared With Sites',
			Icon: MdiShareVariantOutline
		},
		{
			href: '/visits',
			text: 'Visit Calculator',
			Icon: MdiCalendarMonthOutline
		},
		{
			href: '/visits',
			text: 'Safety Letters (SUSARS)',
			Icon: MdiCalendarMonthOutline
		},
	];

</script>	

<div class="min-h-screen flex flex-col bg-base-100">
	<!-- Top Navbar -->
	<nav class="navbar border-b border-base-200 shadow-md">
		<div class="flex-1 px-4">
			<a href="/" class="flex items-center gap-2">
				<img src="/medcm.png" class="h-8" alt="Logo" />
				<span class="text-2xl font-bold">MedCM</span>
			</a>
		</div>

		<!-- Desktop Menu -->
		<div class="hidden md:flex gap-4 px-4">
			{#each topNavItems as { text, items }}
				<div class="dropdown dropdown-hover">
					<div tabindex="0" role="button" class="btn btn-ghost m-1 border border-base-content/20 flex gap-2 items-center">
						{selectedStudy.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transform transition-transform duration-200 group-focus:rotate-180"><polyline points="6 9 12 15 18 9"></polyline></svg>
					</div>
					<ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52">
						{#each items as { value, text }}
							<li>
								<button 
									class="w-full text-left {selectedStudy === value ? 'active' : ''}" 
									onclick={() => selectedStudy = value}
								>
									{text}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<!-- Mobile Menu Button -->
		<button 
			class="btn btn-square btn-ghost md:hidden"
			onclick={() => isMenuOpen = !isMenuOpen}
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</nav>

	<!-- Mobile Menu -->
	{#if isMenuOpen}
		<div class="md:hidden border-b border-base-200 shadow-md" transition:slide>
			<div class="flex flex-col p-4">
				{#each topNavItems as { text, items }}
					<div class="collapse collapse-arrow border border-base-content/20 rounded-lg">
						<input type="checkbox" /> 
						<div class="collapse-title text-lg">
							{selectedStudy.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
						</div>
						<div class="collapse-content">
							{#each items as { value, text }}
								<button 
									class="btn btn-ghost w-full justify-start {selectedStudy === value ? 'active' : ''}"
									onclick={() => selectedStudy = value}
								>
									{text}
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex flex-1">
		<!-- Side Navbar -->
		<nav class="hidden md:flex flex-col w-72 border-r border-base-200 shadow-lg p-4">
			{#each sideNavItems as { href, text, Icon }}
				<a 
					{href} 
					class="btn btn-ghost justify-start gap-4 {href === activeUrl ? 'btn-active' : ''}"
				>
					<Icon class="w-6 h-6"/>
					<span>{text}</span>
				</a>
			{/each}
		</nav>

		<!-- Main Content -->
		<main class="flex-1 bg-gradient-to-br from-base-100 via-base-200/50 to-base-300/25">
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

</style>