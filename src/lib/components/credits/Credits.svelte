<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';

	function toggleCredits() {
		ui.creditsExpanded = !ui.creditsExpanded;
		ui.searchHeaderCollapsed = !ui.searchHeaderCollapsed;
	}
</script>

<div class="relative">
	{#if ui.creditsExpanded}
		<div class="text-2xs mt-2 flex flex-col gap-2 leading-tight text-slate-500">
			<p class="m-0">
				<strong>Note</strong> Data are current as of the 2025 water service line inventory. As per the
				City's practice, service lines marked "Unknown" are suspected to contain some amount of lead.
			</p>
			<p class="m-0">
				<strong>Sources</strong> City of Chicago / Census Bureau
			</p>
			<p class="m-0">
				<strong>Development</strong> Clayton Aldern / Grist. See our
				<a
					href="https://github.com/Grist-Data-Desk/chi-pb"
					target="_blank"
					class="text-emerald-600 no-underline hover:text-emerald-700 hover:underline">methods</a
				>.
			</p>
		</div>
	{/if}
</div>
<div class="absolute -bottom-12 left-0">
	<div class="maplibregl-ctrl maplibregl-ctrl-group">
		<button
			type="button"
			class="flex h-[29px] w-[29px] items-center justify-center bg-white transition-colors hover:bg-slate-50"
			on:click={toggleCredits}
			aria-label={ui.creditsExpanded ? 'Collapse credits' : 'Expand credits'}
		>
			<svg
				class="h-4 w-4 text-slate-600 transition-transform duration-200"
				style="transform: rotate({ui.creditsExpanded ? '180deg' : '0deg'})"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>
</div>
