<script lang="ts">
	import { getContext } from 'svelte';
	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';

	import { currentServiceLine } from '$lib/stores';
	import { qualifiesForWaterFilter } from '$lib/utils/resources';
	import { ui } from '$lib/state/ui.svelte';

	// Context.
	const lang = getContext<() => Language>('lang');

	// State.
	let serviceLine = $derived($currentServiceLine);
	let overallCode = $derived(serviceLine?.OverallSL_Code || serviceLine?.overallCode || 'U');
	let qualifiesForFilter = $derived(qualifiesForWaterFilter(overallCode));
	let messages = $derived(i18nMessages[lang()]);
</script>

<div class="relative w-full">
	<button
		class="bg-smog absolute top-0 right-0 z-10 flex h-6 w-6 items-center justify-center border-none transition-opacity hover:opacity-70"
		onclick={() => (ui.resourcesExpanded = false)}
		aria-label="Close resources"
	>
		<svg class="text-earth/80 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
	<h3 class="font-sans-secondary text-earth mt-0 mb-3 pr-6 text-base font-medium sm:text-lg">
		{messages.resources.title}
	</h3>

	<p class="text-earth/80 mb-3 font-sans text-xs sm:text-sm">
		{messages.resources.resultDescription({ plural: qualifiesForFilter })}
	</p>

	<div class="space-y-2">
		<div class="rounded-sm border border-blue-200 bg-blue-50 p-2">
			<p class="mt-0 mb-1 font-sans text-xs font-semibold text-blue-900">
				{messages.resources.freeWaterTestingKit.label}
			</p>
			<p class="mb-2 font-sans text-xs text-blue-800">
				{messages.resources.freeWaterTestingKit.description}
			</p>
			<a
				href="https://311.chicago.gov/s/new-service-request?typecodeid=a1Pt0000000Q7fiEAC&language=en_US"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 font-sans text-xs font-medium text-blue-700 underline hover:text-blue-900"
			>
				{messages.resources.freeWaterTestingKit.CTA}
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
				<p class="mt-0 mb-1 font-sans text-xs font-semibold text-red-900">
					{messages.resources.freeWaterFilter.label}
				</p>
				<p class="mb-2 font-sans text-xs text-red-800">
					{messages.resources.freeWaterFilter.description}
				</p>
				<a
					href="https://chicagowaterquality.org/filters"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 font-sans text-xs font-medium text-red-700 underline hover:text-red-900"
				>
					{messages.resources.freeWaterFilter.CTA}
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
					{messages.resources.leadPipeReplacementAssistance.label}
				</p>
				<p class="mb-2 font-sans text-xs text-green-800">
					{messages.resources.leadPipeReplacementAssistance.description}
				</p>
				<a
					href="https://www.chicagowaterquality.org/LSLREquity"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 font-sans text-xs font-medium text-green-700 underline hover:text-green-900"
				>
					{messages.resources.leadPipeReplacementAssistance.CTA}
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
