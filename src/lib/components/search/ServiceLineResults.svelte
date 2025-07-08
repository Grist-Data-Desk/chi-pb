<script lang="ts">
	import { searchState, multiServiceLineStore, currentServiceLine, serviceLineCount, nextServiceLine, previousServiceLine } from '$lib/stores';
	import type { AddressWithServiceLine, CensusTract } from '$lib/types';
	import ServiceLineDiagram from './ServiceLineDiagram.svelte';
	import type { Map } from 'maplibre-gl';

	export let selectedAddress: AddressWithServiceLine | null = null;
	export let inventoryData: any = null;
	export let isLoading = false;
	export let error: string | null = null;
	export let map: Map | null = null;

	$: address = selectedAddress || $searchState.selectedAddress;
	
	// Get tract data for the selected address by querying which tract contains the address point
	let tractData: CensusTract | null = null;
	$: if (map && address && address.lat && address.long) {
		getTractDataAtPoint(address.long, address.lat);
	}

	async function getTractDataAtPoint(lng: number, lat: number) {
		if (!map) return;
		
		try {
			// Query the census tract layer at the specific point
			const point = map.project([lng, lat]);
			const features = map.queryRenderedFeatures(point, {
				layers: ['census-tracts-fill']
			});
			
			if (features.length > 0) {
				tractData = features[0].properties as CensusTract;
			} else {
				tractData = null;
			}
		} catch (error) {
			console.error('Error getting tract data at point:', error);
			tractData = null;
		}
	}
	
	// Get lead status from current service line or inventory data
	$: currentInventoryData = $currentServiceLine || inventoryData;
	$: leadStatus = currentInventoryData?.OverallSL_Code ? mapOverallCodeToStatus(currentInventoryData.OverallSL_Code) : 
	               currentInventoryData?.overallCode ? mapOverallCodeToStatus(currentInventoryData.overallCode) : 'UNKNOWN';

	function mapOverallCodeToStatus(code: string): string {
		switch (code) {
			case 'L':
				return 'LEAD';
			case 'GRR':
				return 'GALVANIZED_REQUIRING_REPLACEMENT';
			case 'NL':
				return 'NON_LEAD';
			case 'U':
				return 'UNKNOWN';
			default:
				return 'UNKNOWN';
		}
	}

	// Formatting utilities for Census tract data (from popup.ts)
	function formatCurrency(value: number): string {
		if (!value || value === null) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatPercent(value: number): string {
		if (value === null || value === undefined) return 'N/A';
		return `${value.toFixed(1)}%`;
	}

	function getLeadStatusColor(status: string): string {
		switch (status) {
			case 'LEAD':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'GALVANIZED_REQUIRING_REPLACEMENT':
				return 'text-orange-600 bg-orange-50 border-orange-200';
			case 'NON_LEAD':
				return 'text-emerald-600 bg-emerald-50 border-emerald-200';
			case 'UNKNOWN':
				return 'text-amber-600 bg-amber-50 border-amber-200';
			default:
				return 'text-slate-600 bg-slate-50 border-slate-200';
		}
	}

	function formatLeadStatus(status: string): string {
		switch (status) {
			case 'LEAD':
				return 'Lead';
			case 'GALVANIZED_REQUIRING_REPLACEMENT':
				return 'Galvanized Requiring Replacement';
			case 'NON_LEAD':
				return 'Non-Lead';
			case 'UNKNOWN':
				return 'Unknown';
			default:
				return status.replace('_', ' ');
		}
	}
</script>

{#if address}
	<div class="mt-4 max-h-[400px] overflow-y-auto space-y-3 sm:space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
		<!-- Address Information -->
		<div class="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
			<h3 class="mt-0 font-['PolySans'] text-base sm:text-lg font-medium text-slate-800">
				Selected address
			</h3>
			<div class="space-y-2 font-['Basis_Grotesque']">
				<div>
					<p class="text-sm sm:text-base font-medium text-slate-800 break-words">{address.fullAddress}</p>
				</div>
				
				<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<span class="text-xs sm:text-sm text-slate-600">Lead Status:</span>
					<span 
						class="inline-flex items-center self-start rounded-full border px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium {getLeadStatusColor(leadStatus)}"
					>
						{formatLeadStatus(leadStatus)}
					</span>
				</div>

			</div>
		</div>

		<!-- Service Line Details -->
		<div class="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
			<h3 class="mt-0 font-['PolySans'] text-base sm:text-lg font-medium text-slate-800">
				Service line information
				{#if $serviceLineCount > 1}
					<span class="ml-2 text-sm font-normal text-slate-600">({$serviceLineCount} service lines found)</span>
				{/if}
			</h3>
			
			{#if isLoading}
				<div class="flex items-center gap-2 sm:gap-3 py-6 sm:py-8">
					<div class="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
					<p class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">Loading detailed service line information...</p>
				</div>
			{:else if error}
				<div class="rounded-md border border-orange-200 bg-orange-50 p-2 sm:p-3">
					<div class="flex items-start gap-2">
						<svg class="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
						</svg>
						<p class="font-['Basis_Grotesque'] text-xs sm:text-sm text-orange-700 break-words">{error}</p>
					</div>
				</div>
			{:else if currentInventoryData}
				<!-- Navigation controls for multiple service lines -->
				{#if $serviceLineCount > 1}
					<div class="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2">
						<button 
							on:click={previousServiceLine}
							disabled={$multiServiceLineStore.currentIndex === 0}
							class="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors {$multiServiceLineStore.currentIndex === 0 ? 'cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-200'}"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
							Previous
						</button>
						
						<span class="text-xs font-medium text-slate-700">
							Service Line {$multiServiceLineStore.currentIndex + 1} of {$serviceLineCount}
						</span>
						
						<button 
							on:click={nextServiceLine}
							disabled={$multiServiceLineStore.currentIndex === $serviceLineCount - 1}
							class="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors {$multiServiceLineStore.currentIndex === $serviceLineCount - 1 ? 'cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-200'}"
						>
							Next
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				{/if}
				
				<!-- Visual Service Line Diagram -->
				<div class="mb-4">
					<ServiceLineDiagram 
						utilitySideMaterial={currentInventoryData.PublSrvLnMatEPA || currentInventoryData.utilitySideMaterial || 'U'}
						gooseneckMaterial={currentInventoryData.Gooseneck || currentInventoryData.gooseneck || 'U'}
						customerSideMaterial={currentInventoryData.PrivateSrvLnMatEPA || currentInventoryData.customerSideMaterial || 'U'}
						overallCode={currentInventoryData.OverallSL_Code || currentInventoryData.overallCode || 'U'}
					/>
				</div>
				
				<!-- Additional inventory details if needed -->
				{#if currentInventoryData.confidence || currentInventoryData.lastUpdated || currentInventoryData.additionalNotes}
					<div class="space-y-2 font-['Basis_Grotesque'] text-xs sm:text-sm">
						{#if currentInventoryData.confidence}
							<div class="flex items-start gap-2">
								<span class="font-medium text-slate-700">Confidence:</span>
								<span class="text-slate-600">{currentInventoryData.confidence}</span>
							</div>
						{/if}
						
						{#if currentInventoryData.highRisk === 'Y'}
							<div class="flex items-start gap-2">
								<span class="font-medium text-red-700">⚠️ High Risk</span>
							</div>
						{/if}
						
						{#if currentInventoryData.lastUpdated}
							<div class="flex items-start gap-2">
								<span class="font-medium text-slate-700">Updated:</span>
								<span class="text-slate-600">{currentInventoryData.lastUpdated}</span>
							</div>
						{/if}

						{#if currentInventoryData.additionalNotes}
							<div class="pt-2 border-t border-slate-100">
								<p class="text-slate-600 italic">{currentInventoryData.additionalNotes}</p>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="rounded-md border border-slate-200 bg-slate-50 p-2 sm:p-3">
					<div class="flex items-start gap-2">
						<svg class="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
						</svg>
						<div>
							<p class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">
								Detailed inventory information is not available for this address.
							</p>
							<p class="mt-1 font-['Basis_Grotesque'] text-xs text-slate-400">
								The basic lead status shown above is based on available data from the geocoded address database.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Census Tract Information -->
		<div class="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
			<h3 class="mt-0 font-['PolySans'] text-base sm:text-lg font-medium text-slate-800">
				Census tract context
			</h3>
			{#if tractData}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-700">
					<p class="italic mb-1">You live in Census tract {tractData.geoid}. Statistics on your tract appear below.</p>
					<p class="mb-0"><strong>Median Household Income:</strong> {formatCurrency(tractData.median_household_income)}</p>
					<p class="mb-0"><strong>Black Population:</strong> {formatPercent(tractData.pct_black)}</p>
					<p class="mb-0"><strong>Minority Population:</strong> {formatPercent(tractData.pct_minority)}</p>
					<p class="mb-0"><strong>Poverty Rate:</strong> {formatPercent(tractData.pct_poverty)}</p>
				</div>
			{:else}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">
					<p>Census tract demographic information will be displayed here when available.</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar styling */
	.scrollbar-thin {
		scrollbar-width: thin;
	}
	
	.scrollbar-thin::-webkit-scrollbar {
		width: 6px;
	}
	
	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
		border-radius: 3px;
	}
	
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}
	
	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.4);
	}
</style>