<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';

	function toggleCredits() {
		ui.creditsExpanded = !ui.creditsExpanded;
	}
</script>

<button
	type="button"
	class="floating-panel flex! h-[29px] w-[29px] items-center justify-center"
	onclick={toggleCredits}
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
