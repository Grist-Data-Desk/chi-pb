<script lang="ts">
	import { currentServiceLine } from '$lib/stores';
	import { qualifiesForWaterFilter } from '$lib/utils/resources';
	import { ui } from '$lib/state/ui.svelte';

	let serviceLine = $derived($currentServiceLine);

	let overallCode = $derived(serviceLine?.OverallSL_Code || serviceLine?.overallCode || 'U');

	let qualifiesForFilter = $derived(qualifiesForWaterFilter(overallCode));
</script>

<div class="relative w-full">
	<button
		class="bg-smog absolute top-0 right-0 z-10 flex h-6 w-6 items-center justify-center border-none transition-opacity hover:opacity-70"
		onclick={() => (ui.resourcesExpanded = false)}
		aria-label="Close resources"
	>
		<svg class="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
	<h3 class="font-sans-secondary mt-0 mb-3 pr-6 text-base font-medium text-slate-800 sm:text-lg">
		What can I do?
	</h3>

	<p class="mb-3 font-sans text-xs text-slate-600 sm:text-sm">
		Based on your service line result, the following {qualifiesForFilter
			? 'resources are'
			: 'resource is'} available to you:
	</p>

	<div class="space-y-2">
		<div class="rounded-sm border border-blue-200 bg-blue-50 p-2">
			<p class="mt-0 mb-1 font-sans text-xs font-semibold text-blue-900">Free Water Testing Kit</p>
			<p class="mb-2 font-sans text-xs text-blue-800">
				All Chicago residents can request a free water testing kit to check lead levels.
			</p>
			<a
				href="https://311.chicago.gov/s/new-service-request?typecodeid=a1Pt0000000Q7fiEAC&language=en_US"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 font-sans text-xs font-medium text-blue-700 underline hover:text-blue-900"
			>
				Request a free water testing kit
				<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</a>
		</div>

		{#if qualifiesForFilter}
			<div class="rounded-sm border border-red-200 bg-red-50 p-2">
				<p class="mt-0 mb-1 font-sans text-xs font-semibold text-red-900">Free Water Filter</p>
				<p class="mb-2 font-sans text-xs text-red-800">
					Check if your address qualifies for a free water filter from the city of Chicago.
				</p>
				<a
					href="https://chicagowaterquality.org/filters"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 font-sans text-xs font-medium text-red-700 underline hover:text-red-900"
				>
					Register for a free water filter
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		{/if}

		{#if qualifiesForFilter}
			<div class="rounded-sm border border-green-200 bg-green-50 p-2">
				<p class="mt-0 mb-1 font-sans text-xs font-semibold text-green-900">
					Lead Pipe Replacement Assistance
				</p>
				<p class="mb-2 font-sans text-xs text-green-800">
					Depending on your household income, you may qualify for free lead pipe replacement.
				</p>
				<a
					href="https://www.chicagowaterquality.org/LSLREquity"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 font-sans text-xs font-medium text-green-700 underline hover:text-green-900"
				>
					Apply for replacement assistance
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		{/if}
	</div>
</div>
