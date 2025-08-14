<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { currentServiceLine, multiServiceLineStore } from '$lib/stores';

	// Button is only active when we have loaded inventory data
	let isActive = $derived(
		$currentServiceLine !== null && !$multiServiceLineStore.isLoading
	);

	function toggleResources() {
		if (isActive) {
			ui.resourcesExpanded = !ui.resourcesExpanded;
		}
	}
</script>

<button
	type="button"
	class="floating-panel flex h-[29px] items-center justify-center gap-1.5 px-3 text-xs font-medium text-slate-600"
	class:opacity-40={!isActive}
	class:cursor-not-allowed={!isActive}
	onclick={toggleResources}
	disabled={!isActive}
	aria-label={ui.resourcesExpanded ? 'Collapse resources' : 'Expand resources'}
	title={!isActive ? 'Select an address to view resources' : 'View available resources'}
>
	<svg
		class="h-3.5 w-3.5 text-slate-600"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
	>
		<circle cx="12" cy="12" r="10" stroke-width="2" />
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01" />
	</svg>
	<span>Available Resources for Selected Address</span>
	<svg
		class="h-3 w-3 text-slate-600 transition-transform duration-200"
		style="transform: rotate({ui.resourcesExpanded ? '180deg' : '0deg'})"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
	</svg>
</button>