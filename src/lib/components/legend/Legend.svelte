<script lang="ts">
	import { visualState, uiState } from '$lib/stores';
	import { COLORS } from '$lib/utils/constants';
	import { CHOROPLETH_CATEGORIES } from '$lib/utils/config';
	import { fetchQuantileData, getColorScheme, formatQuantileValue } from '$lib/utils/quantiles';
	import { onMount } from 'svelte';

	// Store quantile data
	let quantileData: { quantiles: number[]; colors: readonly string[] } | null = null;

	// Fetch quantile data when mode or aggregation changes
	$: if ($visualState.choroplethMode && $visualState.aggregationLevel) {
		fetchQuantileData($visualState.aggregationLevel, $visualState.choroplethMode)
			.then((data) => {
				quantileData = data;
			})
			.catch((error) => {
				console.error('Error fetching quantile data:', error);
				// Use default data as fallback
				quantileData = {
					quantiles: [20, 40, 60, 80],
					colors: getColorScheme($visualState.choroplethMode)
				};
			});
	}

	// Get variable description
	function getVariableDescription(mode: string) {
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

	// Choropleth modes
	const choroplethModes = Object.entries(CHOROPLETH_CATEGORIES).map(([key, label]) => ({
		value: key,
		label: label.replace('Household ', '').replace('Percent ', '% ')
	}));

	function handleModeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		visualState.update((state) => ({
			...state,
			choroplethMode: target.value as typeof state.choroplethMode
		}));
	}

	// Fixed panel width
	const panelWidth = 350;

	function handleAggregationChange(event: Event) {
		const target = event.target as HTMLInputElement;
		visualState.update((state) => ({
			...state,
			aggregationLevel: target.value as 'tract' | 'community'
		}));
	}
</script>

<div
	class={[
		'floating-panel absolute z-[15] bg-white px-4 pb-0.5 pt-0.5 shadow-lg md:bottom-auto md:left-auto md:right-[calc(16px+48px)] md:top-4 md:block',
		$uiState.legendExpanded ? 'bottom-[calc(1.5rem+2.5rem)] left-[3%] right-[3%] md:left-auto md:right-[calc(16px+48px)]' : 'hidden'
	]}
	style="width: {panelWidth}px"
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
		<p class="font-['Basis_Grotesque'] text-xs leading-tight text-gray-500">
			Select a data layer to visualize
		</p>
	</div>
	<div class="mb-3">
		<p class="mb-1 font-['Basis_Grotesque'] text-[10px] uppercase tracking-wider text-gray-500">
			Aggregation Level
		</p>
		<div class="aggregation-selector relative grid grid-cols-2">
			<div
				class="aggregation-selector__background"
				class:tract={$visualState.aggregationLevel === 'tract'}
				class:community={$visualState.aggregationLevel === 'community'}
			></div>
			<div class="aggregation-selector__radio-container relative">
				<input
					type="radio"
					value="tract"
					id="tract-radio"
					checked={$visualState.aggregationLevel === 'tract'}
					on:change={handleAggregationChange}
					class="aggregation-selector__radio-input absolute opacity-0"
				/>
				<label
					for="tract-radio"
					class="aggregation-selector__radio-label relative z-10 block cursor-pointer px-2 py-1.5 text-center font-['PolySans'] text-xs"
					class:active={$visualState.aggregationLevel === 'tract'}
				>
					Census Tracts
				</label>
			</div>
			<div class="aggregation-selector__radio-container relative">
				<input
					type="radio"
					value="community"
					id="community-radio"
					checked={$visualState.aggregationLevel === 'community'}
					on:change={handleAggregationChange}
					class="aggregation-selector__radio-input absolute opacity-0"
				/>
				<label
					for="community-radio"
					class="aggregation-selector__radio-label relative z-10 block cursor-pointer px-2 py-1.5 text-center font-['PolySans'] text-xs"
					class:active={$visualState.aggregationLevel === 'community'}
				>
					Community Areas
				</label>
			</div>
		</div>
	</div>
	<div class="mb-3">
		<p class="mb-1 font-['Basis_Grotesque'] text-[10px] uppercase tracking-wider text-gray-500">
			Data Visualization
		</p>
		<div class="mode-selector relative mb-2 grid grid-cols-3">
			<div
				class="mode-selector__background"
				class:replacement={$visualState.choroplethMode === 'pct_requires_replacement'}
				class:poverty={$visualState.choroplethMode === 'pct_poverty'}
				class:minority={$visualState.choroplethMode === 'pct_minority'}
			></div>
			{#each choroplethModes as mode}
				<div class="mode-selector__radio-container relative">
					<input
						type="radio"
						bind:group={$visualState.choroplethMode}
						id="{mode.value}-radio"
						value={mode.value}
						class="mode-selector__radio-input absolute opacity-0"
						on:change={handleModeChange}
					/>
					<label
						for="{mode.value}-radio"
						class="mode-selector__radio-label relative z-10 block cursor-pointer px-2 py-1.5 text-center font-['PolySans'] text-xs"
						class:active={$visualState.choroplethMode === mode.value}
					>
						{mode.label}
					</label>
				</div>
			{/each}
		</div>
	</div>
	<div class="mt-6">
		<p class="mb-1 font-['Basis_Grotesque'] text-[10px] uppercase tracking-wider text-gray-500">
			{getVariableDescription($visualState.choroplethMode)}
		</p>
		{#if quantileData}
			<div class="quantile-legend">
				<div class="quantile-boxes flex gap-0.5">
					{#each quantileData.colors as color}
						<div
							class="quantile-box h-3 flex-1 rounded-sm"
							style="background-color: {color};"
						></div>
					{/each}
				</div>
				<div class="quantile-labels mt-1.5 flex text-[10px] text-gray-600">
					<span class="flex-1 font-['Basis_Grotesque']">0%</span>
					{#each quantileData.quantiles as quantile, i}
						<span class="flex-1 font-['Basis_Grotesque']">
							{i === quantileData.quantiles.length - 1 ? '≥' : ''}{formatQuantileValue(quantile)}
						</span>
					{/each}
				</div>
				<p class="mt-1.5 mb-0.5 font-['Basis_Grotesque'] text-xs italic leading-tight text-gray-500">
					Each color represents 20% of {$visualState.aggregationLevel === 'tract'
						? 'census tracts'
						: 'community areas'} (quintiles)
				</p>
			</div>
		{:else}
			<div class="text-xs text-gray-500">Loading...</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	.aggregation-selector,
	.mode-selector {
		background-color: white;
	}

	/* Aggregation selector styles */
	.aggregation-selector__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 50%;
		height: 100%;
		background-color: theme(colors.earth);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}

	.aggregation-selector__background.tract {
		transform: translateX(0);
	}

	.aggregation-selector__background.community {
		transform: translateX(100%);
	}

	.aggregation-selector__radio-container {
		position: relative;
		background-color: white;
		border: 1px solid theme(colors.gray.200);
	}

	.aggregation-selector__radio-container:not(:last-child) {
		border-right: none;
	}

	.aggregation-selector__radio-label {
		transition-property: color, background-color;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.aggregation-selector__radio-label:hover {
		color: theme(colors.earth);
		background-color: theme(colors.gray.100);
	}

	.aggregation-selector__radio-label.active {
		color: white;
		background-color: transparent;
	}

	.mode-selector__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 33.333%;
		height: 100%;
		background-color: theme(colors.earth);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}

	.mode-selector__background.replacement {
		transform: translateX(0);
	}

	.mode-selector__background.poverty {
		transform: translateX(100%);
	}

	.mode-selector__background.minority {
		transform: translateX(200%);
	}

	.mode-selector__radio-label {
		transition-property: color, background-color;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}

	.mode-selector__radio-label:hover {
		color: theme(colors.earth);
		background-color: theme(colors.gray.100);
	}

	.mode-selector__radio-label.active {
		color: white;
		background-color: transparent;
	}

	.mode-selector__radio-container {
		position: relative;
		background-color: white;
		border: 1px solid theme(colors.gray.200);
	}

	.mode-selector__radio-container:not(:last-child) {
		border-right: none;
	}

	/* Quantile legend styles */
	.quantile-legend {
		padding: 0.5rem 0;
	}

	.quantile-box {
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
	}
</style>
