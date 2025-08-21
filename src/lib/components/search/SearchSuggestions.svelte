<script lang="ts">
	import { interpolateReds } from 'd3-scale-chromatic';

	import Portal from '$lib/components/shared/portal/Portal.svelte';
	import type { AddressWithServiceLine } from '$lib/types';

	interface Props {
		isFetching: boolean;
		input: HTMLInputElement | null;
		nominatimSuggestions: AddressWithServiceLine[];
		onSuggestionClick: (suggestion: AddressWithServiceLine) => void;
		showSuggestions: boolean;
		suggestions: AddressWithServiceLine[];
		suggestionsContainer: HTMLDivElement | null;
		selectedIndex: number;
	}

	let {
		isFetching,
		input = $bindable(null),
		onSuggestionClick,
		showSuggestions,
		suggestions,
		nominatimSuggestions,
		suggestionsContainer = $bindable(null),
		selectedIndex = $bindable(-1)
	}: Props = $props();
	const highlightColor = interpolateReds(0.15);

	function onSuggestionKeyDown(event: KeyboardEvent, suggestion: AddressWithServiceLine) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSuggestionClick(suggestion);
		}
	}

	function getPortalPosition() {
		if (input) {
			const { top, left, width, height } = input.getBoundingClientRect();
			return `top: ${top + height + 8}px; left: ${left}px; width: ${width}px;`;
		}

		return 'top: 0px; left: 0px; width: 0px;';
	}
</script>

{#if showSuggestions && (suggestions.length > 0 || nominatimSuggestions.length > 0)}
	<Portal
		target={document.getElementById('map-container') ?? document.body}
		class="absolute z-50"
		style={getPortalPosition()}
	>
		<div
			class="border-earth/5 max-h-[300px] w-[150%] overflow-y-auto rounded-md border bg-white shadow-lg"
			bind:this={suggestionsContainer}
		>
			{#if suggestions.length === 0 && nominatimSuggestions.length > 0}
				<div class="text-earth/80 border-earth/5 border-b px-4 py-2 text-xs">
					No inventory results found. Showing general address search:
				</div>
			{/if}
			{#each [...suggestions, ...nominatimSuggestions] as suggestion, index}
				<div
					class="border-earth/5 hover:bg-earth/5 cursor-pointer border-b p-2 text-xs last:border-b-0"
					style={selectedIndex === index ? `background-color: ${highlightColor};` : ''}
					role="button"
					tabindex="0"
					onmousedown={() => onSuggestionClick(suggestion)}
					onkeydown={(e) => onSuggestionKeyDown(e, suggestion)}
					onmouseenter={() => (selectedIndex = index)}
				>
					<div class="text-earth font-medium break-words">
						{suggestion.fullAddress}
					</div>
				</div>
			{/each}
		</div>
	</Portal>
{/if}
