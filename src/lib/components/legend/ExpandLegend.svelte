<script lang="ts">
	import { ui } from '$lib/state/ui.svelte';
	import { popup } from '$lib/state/popup.svelte';

	function onClick() {
		ui.legendExpanded = !ui.legendExpanded;
		popup.node?.removePopup();
	}
</script>

<div
	class="border-earth bg-smog absolute bottom-6 left-[3%] z-10 rounded-sm border shadow-sm backdrop-blur-sm md:hidden"
>
	<button
		class="flex h-8 items-center justify-center gap-1 border-0 bg-transparent px-2"
		onclick={onClick}
		aria-label="Expand legend"
	>
		<svg
			height="16"
			stroke-linejoin="round"
			viewBox="0 0 16 16"
			width="16"
			class="text-gray-500"
			fill="currentColor"
		>
			<path d="M3.5 1.5L5.25 4.5H1.75L3.5 1.5Z" />
			<rect x="7.5" y="2.75" width="6.5" height="1" rx="0.25" />
			<rect x="1.75" y="6.25" width="3.5" height="3.5" />
			<rect x="7.5" y="7.5" width="6.5" height="1" rx="0.25" />
			<circle cx="3.5" cy="12.5" r="1.75" />
			<rect x="7.5" y="12" width="6.5" height="1" rx="0.25" />
		</svg>
		<span class="font-sans text-xs">Legend</span>
	</button>
</div>
