<script lang="ts">
	import { searchState, multiServiceLineStore, currentServiceLine, serviceLineCount, nextServiceLine, previousServiceLine } from '$lib/stores';
	import type { AddressWithServiceLine, CensusTract } from '$lib/types';
	import ServiceLineDiagram from './ServiceLineDiagram.svelte';
	import type { Map } from 'maplibre-gl';
	import { COLORS } from '$lib/utils/constants';
	import { onMount, onDestroy } from 'svelte';

	export let selectedAddress: AddressWithServiceLine | null = null;
	export let inventoryData: any = null;
	export let isLoading = false;
	export let error: string | null = null;
	export let map: Map | null = null;

	$: address = selectedAddress || $searchState.selectedAddress;
	
	// Get tract data for the selected address by querying which tract contains the address point
	let tractData: CensusTract | null = null;
	let isTractDataLoading = false;
	let pendingTractQuery: { lng: number; lat: number } | null = null;
	
	// Reset tract data when address is cleared
	$: if (!address) {
		tractData = null;
		isTractDataLoading = false;
		pendingTractQuery = null;
	}
	
	// Update tract data when address changes
	$: if (map && address && address.lat && address.long) {
		// Set loading state and clear previous data
		isTractDataLoading = true;
		tractData = null;
		pendingTractQuery = { lng: address.long, lat: address.lat };
		// Wait for map to move to the new location before querying
		queryTractDataWithRetry(address.long, address.lat);
	}
	
	// Set up map event listeners
	let mapMoveEndHandler: (() => void) | null = null;
	
	$: if (map && !mapMoveEndHandler) {
		mapMoveEndHandler = () => {
			// If we have a pending query, execute it now that the map has stopped moving
			if (pendingTractQuery && isTractDataLoading) {
				console.log('Map finished moving, querying tract data...');
				getTractDataAtPoint(pendingTractQuery.lng, pendingTractQuery.lat);
			}
		};
		map.on('moveend', mapMoveEndHandler);
	}
	
	onDestroy(() => {
		if (map && mapMoveEndHandler) {
			map.off('moveend', mapMoveEndHandler);
		}
	});

	async function queryTractDataWithRetry(lng: number, lat: number) {
		// Simply wait a bit for the map to start moving, then we'll query on moveend
		setTimeout(() => {
			if (!map?.isMoving()) {
				// If map isn't moving, query immediately
				getTractDataAtPoint(lng, lat);
			}
			// Otherwise, the moveend handler will take care of it
		}, 100);
	}

	async function getTractDataAtPoint(lng: number, lat: number, retryCount = 0) {
		if (!map || !pendingTractQuery) {
			isTractDataLoading = false;
			return;
		}
		
		// Only process if this is still the pending query
		if (pendingTractQuery.lng !== lng || pendingTractQuery.lat !== lat) {
			return;
		}
		
		const maxRetries = 10;
		
		try {
			// Ensure the layer exists before querying
			if (!map.getLayer('census-tracts-fill')) {
				console.log('Census tract layer not yet loaded');
				if (retryCount < maxRetries) {
					setTimeout(() => {
						getTractDataAtPoint(lng, lat, retryCount + 1);
					}, 200);
				} else {
					isTractDataLoading = false;
					pendingTractQuery = null;
				}
				return;
			}
			
			// First, ensure we're at the right zoom level and location
			const currentCenter = map.getCenter();
			const currentZoom = map.getZoom();
			const distance = Math.sqrt(
				Math.pow(currentCenter.lng - lng, 2) + 
				Math.pow(currentCenter.lat - lat, 2)
			);
			
			// If we're too far from the point or zoom is too low, the features might not be rendered
			if (distance > 0.1 || currentZoom < 10) {
				console.log(`Map not positioned correctly. Distance: ${distance}, Zoom: ${currentZoom}`);
				if (retryCount < maxRetries) {
					setTimeout(() => {
						getTractDataAtPoint(lng, lat, retryCount + 1);
					}, 500);
					return;
				}
			}
			
			// Query with a small buffer around the point to account for any precision issues
			const point = map.project([lng, lat]);
			const buffer = 5; // pixels
			const features = map.queryRenderedFeatures([
				[point.x - buffer, point.y - buffer],
				[point.x + buffer, point.y + buffer]
			], {
				layers: ['census-tracts-fill']
			});
			
			console.log(`Query attempt ${retryCount + 1}: Found ${features.length} features at [${lng}, ${lat}]`);
			
			if (features.length > 0) {
				// If multiple features, find the closest one
				let closestFeature = features[0];
				if (features.length > 1) {
					// Simple distance check - in production you'd use proper point-in-polygon
					closestFeature = features[0];
				}
				
				tractData = closestFeature.properties as CensusTract;
				isTractDataLoading = false;
				pendingTractQuery = null;
				console.log('Tract data loaded:', tractData.geoid);
			} else if (retryCount < maxRetries) {
				// Retry - the tiles might not be loaded yet
				console.log(`No features found, retrying... (attempt ${retryCount + 1}/${maxRetries})`);
				setTimeout(() => {
					getTractDataAtPoint(lng, lat, retryCount + 1);
				}, 300);
			} else {
				console.log('Max retries reached, no tract data found');
				tractData = null;
				isTractDataLoading = false;
				pendingTractQuery = null;
			}
		} catch (error) {
			console.error('Error getting tract data at point:', error);
			if (retryCount < maxRetries) {
				setTimeout(() => {
					getTractDataAtPoint(lng, lat, retryCount + 1);
				}, 300);
			} else {
				tractData = null;
				isTractDataLoading = false;
				pendingTractQuery = null;
			}
		}
	}
	
	// Get lead status from current service line or inventory data
	$: currentInventoryData = $currentServiceLine || inventoryData;
	
	// Get the worst code when multiple service lines exist
	function getWorstCode(inventoryList: any[]): string {
		// Priority: L > GRR > U > NL
		const codes = inventoryList.map(item => item.OverallSL_Code || item.overallCode || 'U');
		
		if (codes.includes('L')) return 'L';
		if (codes.includes('GRR')) return 'GRR';
		if (codes.includes('U')) return 'U';
		return 'NL';
	}
	
	// Get the overall code to display
	$: displayCode = $multiServiceLineStore.inventoryList && $multiServiceLineStore.inventoryList.length > 1
		? getWorstCode($multiServiceLineStore.inventoryList)
		: currentInventoryData?.OverallSL_Code || currentInventoryData?.overallCode || 'U';

	// Formatting utilities for Census tract data (from popup.ts)
	function formatCurrency(value: number | null | undefined): string {
		if (!value || value === null || value === undefined) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatPercent(value: number | null | undefined): string {
		if (value === null || value === undefined) return 'N/A';
		return `${value.toFixed(1)}%`;
	}

	function formatCount(value: number | null | undefined): string {
		if (value === null || value === undefined) return 'N/A';
		return value.toLocaleString();
	}
</script>

{#if address}
	<div class="mt-4 max-h-[calc(100vh-29rem)] overflow-y-auto space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
		<!-- Address Information -->
		<div class="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
			<h3 class="mt-0 mb-0 font-['PolySans'] text-base sm:text-lg font-medium text-slate-800">
				Selected address
			</h3>
			<div class="space-y-2 font-['Basis_Grotesque']">
				<div>
					<p class="text-sm sm:text-base font-medium text-slate-800 break-words">{address.fullAddress}</p>
				</div>
				
				<div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<span class="text-xs sm:text-sm text-slate-600">Lead Status:</span>
					{#if isLoading}
						<span class="inline-flex items-center self-start rounded-full border px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 border-slate-200">
							<svg class="h-3 w-3 animate-spin mr-1" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Loading...
						</span>
					{:else if displayCode === 'L'}
						<span class="inline-flex items-center self-start rounded-full px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium text-white" style="background-color: {COLORS.RED}">
							Lead
						</span>
					{:else if displayCode === 'GRR'}
						<span class="inline-flex items-center self-start rounded-full px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium text-white" style="background-color: {COLORS.ORANGE}">
							Galvanized (Replace)
						</span>
					{:else if displayCode === 'NL'}
						<span class="inline-flex items-center self-start rounded-full px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium text-white" style="background-color: {COLORS.TURQUOISE}">
							Non-Lead
						</span>
					{:else}
						<span class="inline-flex items-center self-start rounded-full px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium text-white" style="background-color: {COLORS.GOLD}">
							Unknown (Suspected Lead)
						</span>
					{/if}
				</div>
				
				{#if $serviceLineCount > 1}
					<p class="mt-1 text-xs text-slate-500 italic">
						This address is associated with {$serviceLineCount} service line records. The status shown above represents the 'worst-case' scenario across all lines: If lead appears in any of the service lines, it'll be noted here. See individual line details below.
					</p>
				{/if}

			</div>
		</div>

		<!-- Service Line Details -->
		<div class="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
			<h3 class="mt-0 font-['PolySans'] text-base sm:text-lg font-medium text-slate-800">
				Service line information
				{#if $serviceLineCount > 1}
					<br><span class="text-sm font-normal text-slate-600">↳ {$serviceLineCount} lines found at this address</span>
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
							class="flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors w-20 {$multiServiceLineStore.currentIndex === 0 ? 'cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-200'}"
						>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
							Previous
						</button>
						
						<span class="text-xs font-medium text-slate-700">
							Line {$multiServiceLineStore.currentIndex + 1} of {$serviceLineCount}
						</span>
						
						<button 
							on:click={nextServiceLine}
							disabled={$multiServiceLineStore.currentIndex === $serviceLineCount - 1}
							class="flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors w-20 {$multiServiceLineStore.currentIndex === $serviceLineCount - 1 ? 'cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-200'}"
						>
							Next
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				{/if}
				
				<!-- Visual Service Line Diagram -->
				<div class="mb-0">
					<ServiceLineDiagram 
						utilitySideMaterial={currentInventoryData.PublSrvLnMatEPA || currentInventoryData.utilitySideMaterial || 'U'}
						gooseneckMaterial={currentInventoryData.Gooseneck || currentInventoryData.gooseneck || 'U'}
						customerSideMaterial={currentInventoryData.PrivateSrvLnMatEPA || currentInventoryData.customerSideMaterial || 'U'}
						overallCode={currentInventoryData.OverallSL_Code || currentInventoryData.overallCode || 'U'}
					/>
				</div>
				
				<!-- Additional inventory details if needed -->
				{#if currentInventoryData.highRisk === 'Y'}
					<div class="space-y-2 mt-2 font-['Basis_Grotesque'] text-xs sm:text-sm">						
							<div class="flex items-start gap-2">
								<span class="font-medium text-red-700">⚠️ This address is considered a high-risk property by the City of Chicago</span>
							</div>
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
			{#if !address}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">
					<p>Select an address to view census tract information.</p>
				</div>
			{:else if tractData}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm">
					<p class="mt-1 text-xs text-slate-500 italic">This address is located in Census tract {tractData.geoid}. Statistics on this tract appear below.</p>
					
					{#if (tractData as any).total !== undefined}
						<p class="font-semibold text-[10px] uppercase tracking-wider text-gray-500 mb-1">Service Line Inventory</p>
						
						<div class="bg-gray-50 rounded p-2 mb-3">
							<table class="w-full text-xs">
								<colgroup>
									<col class="w-3/5">
									<col class="w-1/5">
									<col class="w-1/5">
								</colgroup>
								<tbody>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Lead</td>
										<td class="py-1 px-2 text-right font-medium">{formatCount((tractData as any).L)}</td>
										<td class="py-1 text-right text-gray-600">{formatPercent((tractData as any).pct_lead)}</td>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Galvanized (Replace)</td>
										<td class="py-1 px-2 text-right font-medium">{formatCount((tractData as any).GRR)}</td>
										<td class="py-1 text-right text-gray-600">{formatPercent((tractData as any).pct_grr)}</td>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Unknown (Suspected Lead)</td>
										<td class="py-1 px-2 text-right font-medium">{formatCount((tractData as any).U)}</td>
										<td class="py-1 text-right text-gray-600">{formatPercent((tractData as any).pct_suspected_lead)}</td>
									</tr>
									<tr>
										<td class="py-1 text-gray-600">Non-Lead</td>
										<td class="py-1 px-2 text-right font-medium">{formatCount((tractData as any).NL)}</td>
										<td class="py-1 text-right text-gray-600">{formatPercent((tractData as any).pct_not_lead)}</td>
									</tr>
								</tbody>
							</table>
							
							<div class="px-2">
								<table class="w-full text-xs mt-2 pt-2 border-t border-gray-200">
									<colgroup>
										<col class="w-3/5">
										<col class="w-1/5">
										<col class="w-1/5">
									</colgroup>
									<tbody>
										<tr>
											<td class="py-1 text-gray-700">Total</td>
											<td class="py-1 px-2 text-right font-bold">{formatCount((tractData as any).total)}</td>
											<td class="py-1"></td>
										</tr>
									</tbody>
								</table>
							</div>
							
							{#if (tractData as any).requires_replacement !== undefined}
								<div class="mt-2 p-2 bg-purple-50 rounded">
									<table class="w-full text-xs">
										<colgroup>
											<col class="w-3/5">
											<col class="w-1/5">
											<col class="w-1/5">
										</colgroup>
										<tbody>
											<tr>
												<td class="text-purple-700 font-medium">Requires Replacement</td>
												<td class="px-2 text-right font-bold text-purple-900">{formatCount((tractData as any).requires_replacement)}</td>
												<td class="text-right font-bold text-purple-900">{formatPercent((tractData as any).pct_requires_replacement)}</td>
											</tr>
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
					
					<p class="font-semibold text-[10px] uppercase tracking-wider text-gray-500 mb-1">Demographics</p>
					<div class="bg-gray-50 rounded p-2">
						<table class="w-full text-xs">
							<tbody>
								<tr class="border-b border-gray-200">
									<td class="py-1 text-gray-600">Median Income</td>
									<td class="py-1 text-right font-medium">{formatCurrency(tractData.median_household_income)}</td>
								</tr>
								<tr class="border-b border-gray-200">
									<td class="py-1 text-gray-600">Poverty Rate</td>
									<td class="py-1 text-right font-medium">{formatPercent(tractData.pct_poverty)}</td>
								</tr>
								<tr class="border-b border-gray-200">
									<td class="py-1 text-gray-600">Black Population</td>
									<td class="py-1 text-right font-medium">{formatPercent((tractData as any).pct_black_nonhispanic || tractData.pct_black)}</td>
								</tr>
								<tr class="border-b border-gray-200">
									<td class="py-1 text-gray-600">White Population</td>
									<td class="py-1 text-right font-medium">{formatPercent((tractData as any).pct_white_nonhispanic)}</td>
								</tr>
								<tr class="border-b border-gray-200">
									<td class="py-1 text-gray-600">Asian Population</td>
									<td class="py-1 text-right font-medium">{formatPercent((tractData as any).pct_asian_nonhispanic)}</td>
								</tr>
								<tr>
									<td class="py-1 text-gray-600">Minority Population</td>
									<td class="py-1 text-right font-medium">{formatPercent(tractData.pct_minority)}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			{:else if isTractDataLoading}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
						<p>Loading census tract information...</p>
					</div>
				</div>
			{:else}
				<div class="font-['Basis_Grotesque'] text-xs sm:text-sm text-slate-500">
					<p>Census tract information is not available for this location.</p>
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