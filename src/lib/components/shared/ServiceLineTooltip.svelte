<script lang="ts">
	import {
		type ServiceLineClassification,
		SERVICE_LINE_DEFINITIONS,
		calculateTooltipPosition,
		type TooltipPosition
	} from '$lib/utils/tooltips';

	interface Props {
		classification: ServiceLineClassification;
		children?: any;
	}

	let { classification, children }: Props = $props();

	let showTooltip = $state(false);
	let iconRef = $state<HTMLElement | null>(null);
	let tooltipPosition = $state<TooltipPosition>({ top: 0, left: 0 });

	$effect(() => {
		if (showTooltip && iconRef) {
			const rect = iconRef.getBoundingClientRect();
			tooltipPosition = calculateTooltipPosition(rect);
		}
	});
</script>

<div class="inline-flex items-center gap-0.5">
	{@render children?.()}
	<span
		bind:this={iconRef}
		class="inline-flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors ml-0.5"
		onmouseenter={() => (showTooltip = true)}
		onmouseleave={() => (showTooltip = false)}
		style="cursor: help;"
		tabindex="0"
		role="button"
		aria-label={`Information about ${classification} classification`}
	>
		<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
			<path
				fill-rule="evenodd"
				d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
				clip-rule="evenodd"
			/>
		</svg>
	</span>
</div>

{#if showTooltip}
	<div
		class="fixed w-64 rounded-md bg-slate-800 px-3 py-2 text-xs text-white shadow-lg pointer-events-none"
		role="tooltip"
		style="z-index: 99999; top: {tooltipPosition.top}px; left: {tooltipPosition.left}px;"
	>
		{SERVICE_LINE_DEFINITIONS[classification]}
	</div>
{/if}