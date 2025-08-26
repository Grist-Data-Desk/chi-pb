<script lang="ts">
	import { getContext } from 'svelte';

	import { messages, type Language } from '$lib/i18n/messages';
	import { ui } from '$lib/state/ui.svelte';

	const lang = getContext<Language>('lang');

	function toggleCredits() {
		ui.creditsExpanded = !ui.creditsExpanded;
	}
</script>

<button
	type="button"
	class="floating-panel text-earth/80 flex h-[29px] items-center justify-center gap-1 px-3 text-xs"
	onclick={toggleCredits}
	aria-label={ui.creditsExpanded ? 'Collapse notes' : 'Expand notes'}
>
	<span>{messages[lang].notesButton}</span>
	<svg
		class="text-earth/80 h-3 w-3 transition-transform duration-200"
		style="transform: rotate({ui.creditsExpanded ? '180deg' : '0deg'})"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
	</svg>
</button>
