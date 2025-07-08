<script lang="ts">
	import { visualState, uiState } from '$lib/stores';
	import { COLORS, VIRIDIS } from '$lib/utils/constants';
	import { CHOROPLETH_CATEGORIES, LEAD_STATUS_CATEGORIES } from '$lib/utils/config';

	const colorOrder = [
		COLORS.ORANGE,
		COLORS.COBALT,
		COLORS.TURQUOISE,
		COLORS.TEAL,
		COLORS.FUCHSIA,
		COLORS.RED,
		COLORS.GOLD
	];

	// Chicago choropleth legend items - continuous scales with viridis colors
	const choroplethLegendItems = {
		median_household_income: [
			{ color: VIRIDIS.DARK_PURPLE, label: 'Low', range: '$0 - $50K' },
			{ color: VIRIDIS.BLUE, label: 'Medium', range: '$50K - $100K' },
			{ color: VIRIDIS.TEAL, label: 'High', range: '$100K - $150K' },
			{ color: VIRIDIS.YELLOW, label: 'Very High', range: '$150K+' }
		],
		pct_black: [
			{ color: VIRIDIS.DARK_PURPLE, label: 'Low', range: '0% - 25%' },
			{ color: VIRIDIS.BLUE, label: 'Medium', range: '25% - 50%' },
			{ color: VIRIDIS.TEAL, label: 'High', range: '50% - 75%' },
			{ color: VIRIDIS.YELLOW, label: 'Very High', range: '75% - 100%' }
		],
		pct_minority: [
			{ color: VIRIDIS.DARK_PURPLE, label: 'Low', range: '0% - 25%' },
			{ color: VIRIDIS.BLUE, label: 'Medium', range: '25% - 50%' },
			{ color: VIRIDIS.TEAL, label: 'High', range: '50% - 75%' },
			{ color: VIRIDIS.YELLOW, label: 'Very High', range: '75% - 100%' }
		],
		pct_poverty: [
			{ color: VIRIDIS.DARK_PURPLE, label: 'Low', range: '0% - 10%' },
			{ color: VIRIDIS.BLUE, label: 'Medium', range: '10% - 20%' },
			{ color: VIRIDIS.TEAL, label: 'High', range: '20% - 30%' },
			{ color: VIRIDIS.YELLOW, label: 'Very High', range: '30%+' }
		]
	};

	// Choropleth modes
	const choroplethModes = Object.entries(CHOROPLETH_CATEGORIES).map(([key, label]) => ({
		value: key,
		label: label.replace('Household ', '').replace('Percent ', '% ')
	}));

	function handleModeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		visualState.update(state => ({ 
			...state, 
			choroplethMode: target.value as typeof state.choroplethMode
		}));
	}

	// No filtering for choropleth - it's a continuous visualization
	// Individual legend items are just informational

	const longestLabel = Math.max(
		...Object.values(choroplethLegendItems).flatMap((items) => items.map((item) => `${item.label} ${item.range}`.length))
	);

	const minPanelWidth = longestLabel * 6 + 20;
</script>

<div
	class={[
		'floating-panel absolute z-[15] bg-white px-2 pb-2 pt-0.5 shadow-lg md:bottom-auto md:left-auto md:right-[calc(3%+48px)] md:top-4 md:block',
		$uiState.legendExpanded ? 'bottom-[calc(40px+0.5rem)] left-[calc(3%+5rem)]' : 'hidden'
	]}
	style="min-width: {minPanelWidth}px"
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
			Census tract data visualization
		</p>
	</div>
	<div class="mode-selector relative mb-2 grid grid-cols-4">
		<div
			class="mode-selector__background"
			class:income={$visualState.choroplethMode === 'median_household_income'}
			class:poverty={$visualState.choroplethMode === 'pct_poverty'}
			class:black={$visualState.choroplethMode === 'pct_black'}
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
					class="mode-selector__radio-label relative z-10 block cursor-pointer py-1.5 px-2 text-center font-['PolySans'] text-xs"
					class:active={$visualState.choroplethMode === mode.value}
				>
					{mode.label}
				</label>
			</div>
		{/each}
	</div>
	<div class="space-y-0.5">
		{#each choroplethLegendItems[$visualState.choroplethMode] as item}
			<div class="flex w-full items-center gap-2 rounded border border-gray-200 bg-slate-50/90 px-1.5 py-0.5">
				<div class="h-2 w-2 rounded-full" style="background-color: {item.color}"></div>
				<div class="flex-1">
					<span class="font-['Basis_Grotesque'] text-xs font-medium">{item.label}</span>
					<span class="font-['Basis_Grotesque'] text-xs text-gray-500 ml-1">{item.range}</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.mode-selector {
		background-color: white;
	}

	.mode-selector__background {
		position: absolute;
		top: 0;
		left: 0;
		width: 25%;
		height: 100%;
		background-color: theme(colors.earth);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
	}

	.mode-selector__background.income {
		transform: translateX(0);
	}

	.mode-selector__background.black {
		transform: translateX(100%);
	}

	.mode-selector__background.minority {
		transform: translateX(200%);
	}

	.mode-selector__background.poverty {
		transform: translateX(300%);
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
</style>
