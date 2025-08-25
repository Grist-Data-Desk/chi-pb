<script lang="ts">
	import ServiceLineDiagram from '$lib/components/search/ServiceLineDiagram.svelte';
	import ServiceLineDiagramLoading from '$lib/components/search/ServiceLineDiagramLoading.svelte';
	import {
		multiServiceLineStore,
		serviceLineCount,
		nextServiceLine,
		previousServiceLine
	} from '$lib/stores';
	import type { InventoryData } from '$lib/types';

	interface Props {
		isLoading: boolean;
		error: string | null;
		currentInventoryData: InventoryData;
	}

	let { isLoading, error, currentInventoryData }: Props = $props();
</script>

<div class="flex flex-col gap-3">
	{#if $serviceLineCount > 1}
		<span class="text-earth/80 text-sm font-normal"
			>↳ {$serviceLineCount} lines found at this address</span
		>
	{/if}
	{#if isLoading}
		<ServiceLineDiagramLoading />
	{:else if error}
		<div class="rounded-md border border-orange-200 bg-orange-50 p-2 sm:p-3">
			<div class="flex items-start gap-2">
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 text-orange-500"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<p class="m-0 font-sans text-xs break-words text-orange-700 sm:text-sm">
					{error}
				</p>
			</div>
		</div>
	{:else if currentInventoryData}
		<!-- Visual Service Line Diagram -->
		<div class="mb-0">
			<ServiceLineDiagram
				utilitySideMaterial={currentInventoryData.PublSrvLnMatEPA ||
					currentInventoryData.utilitySideMaterial ||
					'U'}
				gooseneckMaterial={currentInventoryData.Gooseneck || currentInventoryData.gooseneck || 'U'}
				customerSideMaterial={currentInventoryData.PrivateSrvLnMatEPA ||
					currentInventoryData.customerSideMaterial ||
					'U'}
				overallCode={currentInventoryData.OverallSL_Code || currentInventoryData.overallCode || 'U'}
			/>
		</div>
		<!-- Navigation controls for multiple service lines -->
		{#if $serviceLineCount > 1}
			<div class="flex items-center justify-between">
				<button
					onclick={previousServiceLine}
					disabled={$multiServiceLineStore.currentIndex === 0}
					class={[
						'border-earth flex w-20 items-center justify-center gap-1 rounded-xs border px-2 py-1 text-xs font-medium transition-colors',
						$multiServiceLineStore.currentIndex === 0
							? 'text-earth/40 cursor-not-allowed'
							: 'text-earth/80 hover:bg-earth/5'
					]}
				>
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Previous
				</button>
				<span class="text-earth/80 text-xs font-medium">
					Line {$multiServiceLineStore.currentIndex + 1} of {$serviceLineCount}
				</span>
				<button
					onclick={nextServiceLine}
					disabled={$multiServiceLineStore.currentIndex === $serviceLineCount - 1}
					class={[
						'border-earth flex w-20 items-center justify-center gap-1 rounded-xs border px-2 py-1 text-xs font-medium transition-colors',
						$multiServiceLineStore.currentIndex === $serviceLineCount - 1
							? 'text-earth/40 cursor-not-allowed'
							: 'text-earth/80 hover:bg-earth/5'
					]}
				>
					Next
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		{/if}
		<!-- Additional inventory details if needed -->
		{#if currentInventoryData.highRisk === 'Y'}
			<div class="mt-2 space-y-2 font-sans text-xs sm:text-sm">
				<div class="flex items-start gap-2">
					<span class="font-medium text-red-700"
						>⚠️ This address is considered a high-risk property by the city of Chicago.</span
					>
				</div>
			</div>
		{/if}
	{:else}
		<div>
			<div class="flex items-start gap-2">
				<svg class="text-earth/40 mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				<div>
					<p class="text-earth/80 font-sans text-xs sm:text-sm">
						Detailed inventory information is not available for this address.
					</p>
					<p class="text-earth/40 mt-1 font-sans text-xs">
						The basic lead status shown above is based on available data from the geocoded address
						database.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
