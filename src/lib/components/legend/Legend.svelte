<script lang="ts">
	import { getContext } from 'svelte';

	import { messages, type Language } from '$lib/i18n/messages';
	import { removeSelectedFeatureState } from '$lib/state/feature.svelte';
	import { mapState } from '$lib/state/map.svelte';
	import { popup } from '$lib/state/popup.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { AggregationLevel, ChoroplethMode } from '$lib/types';
	import { CHOROPLETH_CATEGORIES } from '$lib/utils/config';
	import {
		fetchQuantileData,
		formatQuantileValue,
		getQuantileColorExpression
	} from '$lib/utils/quantiles';

	// Context.
	const lang = getContext<Language>('lang');

	let CHOROPLETH_MODES = $derived(
		Object.entries(CHOROPLETH_CATEGORIES).map(([key, label]) => {
			const i18nKey = `${label.toLowerCase()}Button` as
				| 'leadButton'
				| 'povertyButton'
				| 'raceButton';

			return {
				value: key,
				label: messages[lang].legend[i18nKey]
			};
		})
	);

	// State.
	let quantileData = $derived(
		fetchQuantileData(visualization.aggregationLevel, visualization.choroplethMode)
	);

	// Event handlers.
	function getVariableDescription(mode: ChoroplethMode) {
		switch (mode) {
			case 'pct_requires_replacement':
				return messages[lang].legend.pctRequiresReplacementLabel;
			case 'pct_poverty':
				return messages[lang].legend.pctPovertyLabel;
			case 'pct_minority':
				return messages[lang].legend.pctRaceLabel;
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
		'floating-panel appear absolute z-20 w-[94%] p-2 shadow-lg sm:p-4 md:top-4 md:right-16 md:bottom-auto md:left-auto md:block md:w-[370px]',
		ui.legendExpanded ? 'right-[3%] bottom-16 left-[3%] md:right-16 md:left-auto' : 'hidden'
	]}
>
	<div class="mb-0 flex items-center gap-1">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 16 16"
			fill="currentColor"
			class="text-earth/80 h-3 w-3"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M0 5.25136V4.2487L0.463236 4.05702L7.71324 1.05702L8 0.938354L8.28676 1.05702L15.5368 4.05702L16 4.2487V5.25136L15.5368 5.44304L8.28676 8.44304L8 8.5617L7.71324 8.44304L0.463236 5.44304L0 5.25136ZM0 8.45825V6.83491L0.536764 7.05702L8 10.1453L15.4632 7.05702L16 6.83491V8.45825L8.28676 11.6499L8 11.7686L7.71324 11.6499L0 8.45825ZM0 11.7083V10.0849L0.536764 10.307L8 13.3953L15.4632 10.307L16 10.0849V11.7083L8.28676 14.8999L8 15.0186L7.71324 14.8999L0 11.7083ZM8 6.93835L2.71154 4.75003L8 2.5617L13.2885 4.75003L8 6.93835Z"
			/>
		</svg>
		<p class="text-earth/80 m-0 font-sans text-xs leading-tight">
			{messages[lang].legend.title}
		</p>
	</div>
	<div class="mb-3">
		<p class="text-2xs text-earth/80 mb-1 font-sans tracking-wider uppercase">
			{messages[lang].legend.aggregationLevelLabel}
		</p>
		<div class="relative grid grid-cols-2 bg-white">
			<div
				class={[
					'bg-earth absolute top-0 left-0 z-10 h-full w-1/2 transition-transform duration-300 ease-in-out',
					visualization.aggregationLevel === 'tract' && 'translate-x-full'
				]}
			></div>
			<div class="border-earth/30 relative border bg-white">
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
						'text-2xs relative z-10 block cursor-pointer py-1 text-center font-sans font-bold transition-colors sm:py-1.5 sm:text-xs',
						visualization.aggregationLevel === 'community'
							? 'text-white'
							: 'text-earth hover:bg-earth/5'
					]}
				>
					Community areas
				</label>
			</div>
			<div class="border-earth/30 relative border border-l-0 bg-white">
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
						'text-2xs relative z-10 block cursor-pointer py-1 text-center font-sans font-bold transition-colors sm:py-1.5 sm:text-xs',
						visualization.aggregationLevel === 'tract'
							? 'text-white'
							: 'text-earth hover:bg-earth/5'
					]}
				>
					Census tracts
				</label>
			</div>
		</div>
	</div>
	<div class="mb-3">
		<p class="text-2xs text-earth/80 mb-1 font-sans tracking-wider uppercase">
			{messages[lang].legend.dataVisualizationLabel}
		</p>
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
				<div class="border-earth/30 relative border bg-white not-last:border-r-0">
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
							'text-2xs relative z-10 block cursor-pointer py-1 text-center font-sans font-bold transition-colors sm:py-1.5 sm:text-xs',
							visualization.choroplethMode === mode.value
								? 'text-white'
								: 'text-earth hover:bg-earth/5'
						]}
					>
						{mode.label}
					</label>
				</div>
			{/each}
		</div>
	</div>
	<div class="mt-3 sm:mt-4">
		<p class="text-2xs text-earth/80 mb-1 font-sans tracking-wider uppercase">
			{getVariableDescription(visualization.choroplethMode)}
		</p>
		{#if quantileData && quantileData.dedupedQuantiles && quantileData.dedupedColors && quantileData.flexValues}
			{@const dedupedLabels = [
				'0%',
				...quantileData.dedupedQuantiles.map(formatQuantileValue),
				'100%'
			]}
			{@const positions = (() => {
				const totalFlex = quantileData.flexValues.reduce((a, b) => a + b, 0);
				const pos = [0];
				let cumulative = 0;
				for (let i = 0; i < quantileData.flexValues.length; i++) {
					cumulative += quantileData.flexValues[i];
					pos.push((cumulative / totalFlex) * 100);
				}
				return pos;
			})()}
			{@const visibleIndices = dedupedLabels
				.map((_, i) => i)
				.filter((i) => i % 2 === 1 && i < dedupedLabels.length - 1)}
			{@const lastVisibleIndex = visibleIndices[visibleIndices.length - 1]}
			<div>
				<!-- Container for color blocks and labels -->
				<div class="relative">
					<!-- Proportionally-sized color blocks -->
					<div class="flex gap-0.5">
						{#each quantileData.dedupedColors as color, i}
							<div
								class="h-3 rounded-xs inset-ring inset-ring-[rgba(0,0,0,0.1)]"
								style="background-color: {color}; opacity: 0.7; flex: {quantileData.flexValues[i]};"
							></div>
						{/each}
					</div>
					<!-- Labels below the color boxes - showing every other label starting from the second, excluding the last -->
					<div class="text-2xs text-earth/80 relative mt-1 h-4">
						{#each dedupedLabels as label, i}
							{#if i % 2 === 1 && i < dedupedLabels.length - 1}
								<span
									class="absolute font-sans whitespace-nowrap"
									style={i === 1
										? 'left: 0; transform: none;'
										: i === lastVisibleIndex &&
											  quantileData.dedupedQuantiles.length < quantileData.quantiles.length
											? `left: ${positions[i]}%; transform: translateX(-50%);`
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
				<p class="text-earth/80 mt-3 mb-0.5 font-sans text-xs leading-tight">
					Color boxes are sized proportionally to the number of {visualization.aggregationLevel ===
					'tract'
						? 'census tracts'
						: 'community areas'} they contain, with finer detail offered for the top and bottom of the
					range.
				</p>
			</div>
		{:else}
			<div class="text-2xs text-earth/80 sm:text-xs">{messages[lang].legend.loadingLabel}</div>
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
