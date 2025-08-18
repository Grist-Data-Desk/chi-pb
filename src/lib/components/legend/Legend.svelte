<script lang="ts">
	import { removeSelectedFeatureState } from '$lib/state/feature.svelte';
	import { mapState } from '$lib/state/map.svelte';
	import { popup } from '$lib/state/popup.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { AggregationLevel, ChoroplethMode } from '$lib/types';
	import { CHOROPLETH_CATEGORIES, LAYER_CONFIG, SOURCE_CONFIG } from '$lib/utils/config';
	import {
		fetchQuantileData,
		formatQuantileValue,
		getQuantileColorExpression
	} from '$lib/utils/quantiles';
	// Constants.
	const CHOROPLETH_MODES = Object.entries(CHOROPLETH_CATEGORIES).map(([key, label]) => ({
		value: key,
		label: label.replace('Household ', '').replace('Percent ', '% ')
	}));

	// State.
	let quantileData = $derived<{ quantiles: number[]; colors: readonly string[] }>(
		fetchQuantileData(visualization.aggregationLevel, visualization.choroplethMode)
	);

	// Event handlers.
	function getVariableDescription(mode: ChoroplethMode) {
		switch (mode) {
			case 'pct_requires_replacement':
				return 'Percentage of service lines requiring replacement';
			case 'pct_poverty':
				return 'Percentage of population below poverty line';
			case 'pct_minority':
				return 'Percentage of population that is non-white';
			default:
				return '';
		}
	}

	function updateLayers() {
		const choroplethExpression = getQuantileColorExpression(
			visualization.choroplethMode,
			quantileData.quantiles,
			quantileData.colors
		);

		if (
			visualization.aggregationLevel === 'tract' &&
			mapState.map?.getLayer('census-tracts-fill')
		) {
			mapState.map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
			mapState.map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0.7);
			mapState.map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0.8);
			mapState.map.setPaintProperty('community-areas-fill', 'fill-opacity', 0);
			mapState.map.setPaintProperty('community-areas-stroke', 'line-opacity', 0);
		} else if (
			visualization.aggregationLevel === 'community' &&
			mapState.map?.getLayer('community-areas-fill')
		) {
			mapState.map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
			mapState.map.setPaintProperty('community-areas-fill', 'fill-opacity', 0.7);
			mapState.map.setPaintProperty('community-areas-stroke', 'line-opacity', 0.8);
			mapState.map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0);
			mapState.map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0);
		}
	}

	function handleModeChange(event: Event & { currentTarget: HTMLInputElement }) {
		const target = event.currentTarget;
		visualization.choroplethMode = target.value as ChoroplethMode;

		updateLayers();
	}

	function handleAggregationChange(event: Event & { currentTarget: HTMLInputElement }) {
		const target = event.currentTarget;
		visualization.aggregationLevel = target.value as AggregationLevel;

		updateLayers();
		popup.node?.removePopup();
		removeSelectedFeatureState();
	}
</script>

<div
	class={[
		'floating-panel appear absolute z-15 w-[94%] p-2 shadow-lg sm:p-4 md:top-4 md:right-16 md:bottom-auto md:left-auto md:block md:w-[370px]',
		ui.legendExpanded ? 'right-[3%] bottom-16 left-[3%] md:right-16 md:left-auto' : 'hidden'
	]}
>
	<div class="mb-0 flex items-center gap-1">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="h-3 w-3 text-gray-500"
		>
			<path
				fill-rule="evenodd"
				d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
				clip-rule="evenodd"
			/>
		</svg>
		<p class="m-0 font-sans text-xs leading-tight text-gray-500">
			Select a data layer to visualize
		</p>
	</div>
	<div class="mb-3">
		<p class="text-2xs mb-1 font-sans tracking-wider text-gray-500 uppercase">Aggregation Level</p>
		<div class="relative grid grid-cols-2 bg-white">
			<div
				class={[
					'bg-earth absolute top-0 left-0 z-10 h-full w-1/2 transition-transform duration-300 ease-in-out',
					visualization.aggregationLevel === 'tract' && 'translate-x-full'
				]}
			></div>
			<div class="relative border border-gray-200 bg-white">
				<input
					type="radio"
					value="community"
					id="community-radio"
					checked={visualization.aggregationLevel === 'community'}
					onchange={handleAggregationChange}
					class="absolute opacity-0"
				/>
				<label
					for="community-radio"
					class={[
						'font-sans-secondary text-2xs relative z-10 block cursor-pointer py-1 text-center  transition-colors sm:py-1.5 sm:text-xs',
						visualization.aggregationLevel === 'community'
							? 'text-white'
							: 'text-earth hover:bg-gray-100'
					]}
				>
					Community Areas
				</label>
			</div>
			<div class="relative border border-l-0 border-gray-200 bg-white">
				<input
					type="radio"
					value="tract"
					id="tract-radio"
					checked={visualization.aggregationLevel === 'tract'}
					onchange={handleAggregationChange}
					class="absolute opacity-0"
				/>
				<label
					for="tract-radio"
					class={[
						'font-sans-secondary text-2xs relative z-10 block cursor-pointer py-1 text-center  transition-colors sm:py-1.5 sm:text-xs',
						visualization.aggregationLevel === 'tract'
							? 'text-white'
							: 'text-earth hover:bg-gray-100'
					]}
				>
					Census Tracts
				</label>
			</div>
		</div>
	</div>
	<div class="mb-3">
		<p class="text-2xs mb-1 font-sans tracking-wider text-gray-500 uppercase">Data Visualization</p>
		<div class="relative mb-2 grid grid-cols-3 bg-white">
			<div
				class={[
					'bg-earth absolute top-0 left-0 z-10 h-full w-1/3 transition-transform duration-300 ease-in-out',
					{
						'translate-x-full': visualization.choroplethMode === 'pct_poverty',
						'translate-x-[200%]': visualization.choroplethMode === 'pct_minority'
					}
				]}
			></div>
			{#each CHOROPLETH_MODES as mode}
				<div class="relative border border-gray-200 bg-white not-last:border-r-0">
					<input
						type="radio"
						bind:group={visualization.choroplethMode}
						id="{mode.value}-radio"
						value={mode.value}
						class="absolute opacity-0"
						onchange={handleModeChange}
					/>
					<label
						for="{mode.value}-radio"
						class={[
							'font-sans-secondary text-2xs relative z-10 block cursor-pointer py-1 text-center  transition-colors sm:py-1.5 sm:text-xs',
							visualization.choroplethMode === mode.value
								? 'text-white'
								: 'text-earth hover:bg-gray-100'
						]}
					>
						{mode.label}
					</label>
				</div>
			{/each}
		</div>
	</div>
	<div class="mt-3 sm:mt-4">
		<p class="text-2xs mb-1 font-sans tracking-wider text-gray-500 uppercase">
			{getVariableDescription(visualization.choroplethMode)}
		</p>
		{#if quantileData}
			{@const positions = [0, 1, 5, 20, 40, 60, 80, 95, 99, 100]}
			{@const labels = ['0%', ...quantileData.quantiles.map(formatQuantileValue), '100%']}
			{@const flexValues = [1, 4, 15, 20, 20, 20, 15, 4, 1]}
			{@const visibleIndices = labels
				.map((_, i) => i)
				.filter((i) => i % 2 === 1 && i < labels.length - 1)}
			{@const lastVisibleIndex = visibleIndices[visibleIndices.length - 1]}
			<div>
				<!-- Container for color blocks and labels -->
				<div class="relative">
					<!-- Proportionally-sized color blocks -->
					<div class="flex gap-0.5">
						{#each quantileData.colors as color, i}
							<div
								class="h-3 rounded-xs inset-ring inset-ring-[rgba(0,0,0,0.1)]"
								style="background-color: {color}; opacity: 0.7; flex: {flexValues[i]};"
							></div>
						{/each}
					</div>
					<!-- Labels below the color boxes - showing every other label starting from the second, excluding the last -->
					<div class="text-2xs relative mt-1 h-4 text-gray-500">
						{#each labels as label, i}
							{#if i % 2 === 1 && i < labels.length - 1}
								<span
									class="absolute font-sans whitespace-nowrap"
									style={i === 1
										? 'left: 0; transform: none;'
										: `left: ${positions[i]}%; transform: translateX(-50%);`}
								>
									{i === 1
										? `<${label}`
										: i === lastVisibleIndex && label !== '100%'
											? `≥${label}`
											: label}
								</span>
							{/if}
						{/each}
					</div>
				</div>
				<p class="text-2xs mt-1 mb-0 font-sans leading-tight text-gray-500 italic sm:text-xs">
					Color boxes are sized proportionally to the number of {visualization.aggregationLevel ===
					'tract'
						? 'census tracts'
						: 'community areas'} they contain, with finer detail offered for the top and bottom of the
					range.
				</p>
			</div>
		{:else}
			<div class="text-2xs text-gray-500 sm:text-xs">Loading...</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference 'tailwindcss';

	.appear {
		animation:
			slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
			fade 0.15s ease-out;
	}

	@media (min-width: theme(--breakpoint-sm)) {
		.appear {
			@apply animate-none;
		}
	}

	@keyframes slide {
		from {
			transform: translateY(8px);
		}
		to {
			transform: translateX(0);
		}
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
