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
			class="max-h-[300px] w-[150%] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
			bind:this={suggestionsContainer}
		>
			{#if suggestions.length === 0 && nominatimSuggestions.length > 0}
				<div class="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
					No inventory results found. Showing general address search:
				</div>
			{/if}
			{#each [...suggestions, ...nominatimSuggestions] as suggestion, index}
				<div
					class="cursor-pointer border-b border-slate-100 p-2 text-xs last:border-b-0 hover:bg-slate-50"
					style={selectedIndex === index ? `background-color: ${highlightColor};` : ''}
					role="button"
					tabindex="0"
					onmousedown={() => onSuggestionClick(suggestion)}
					onkeydown={(e) => onSuggestionKeyDown(e, suggestion)}
					onmouseenter={() => (selectedIndex = index)}
				>
					<div class="font-medium break-words text-slate-800">
						{suggestion.fullAddress}
						{#if suggestion.row !== -1 && suggestion.serviceLineCount && suggestion.serviceLineCount > 1}
							<span class="ml-2 text-xs text-slate-500"
								>({suggestion.serviceLineCount} service lines)</span
							>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</Portal>
{/if}
