<script lang="ts">
	import type { Map } from 'maplibre-gl';
	import { onDestroy } from 'svelte';

	import ServiceLineDiagram from '$lib/components/search/ServiceLineDiagram.svelte';
	import ServiceLineDiagramLoading from '$lib/components/search/ServiceLineDiagramLoading.svelte';
	import {
		searchState,
		multiServiceLineStore,
		currentServiceLine,
		serviceLineCount,
		nextServiceLine,
		previousServiceLine
	} from '$lib/stores';
	import type { AddressWithServiceLine, CensusTract } from '$lib/types';
	import { COLORS } from '$lib/utils/constants';

	// Props.
	interface Props {
		selectedAddress: AddressWithServiceLine | null;
		inventoryData: any;
		isLoading: boolean;
		error: string | null;
		map: Map | null;
	}

	let { selectedAddress, inventoryData, isLoading, error, map }: Props = $props();

	// State.
	let tractData = $state<CensusTract | null>(null);
	let isTractDataLoading = $state(false);
	let pendingTractQuery = $state<{ lng: number; lat: number } | null>(null);
	let mapMoveEndHandler = $state<(() => void) | null>(null);
	let address = $derived(selectedAddress || $searchState.selectedAddress);
	let currentInventoryData = $derived($currentServiceLine || inventoryData);
	let displayCode = $derived(
		$multiServiceLineStore.inventoryList && $multiServiceLineStore.inventoryList.length > 1
			? getWorstCode($multiServiceLineStore.inventoryList)
			: currentInventoryData?.OverallSL_Code || currentInventoryData?.overallCode || 'U'
	);

	// Helpers.
	async function queryTractDataWithRetry(lng: number, lat: number) {
		setTimeout(() => {
			if (!map?.isMoving()) {
				getTractDataAtPoint(lng, lat);
			}
		}, 100);
	}

	async function getTractDataAtPoint(lng: number, lat: number, retryCount = 0) {
		if (!map || !pendingTractQuery) {
			isTractDataLoading = false;
			return;
		}

		if (pendingTractQuery.lng !== lng || pendingTractQuery.lat !== lat) {
			return;
		}

		const maxRetries = 10;

		try {
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

			const currentCenter = map.getCenter();
			const currentZoom = map.getZoom();
			const distance = Math.sqrt(
				Math.pow(currentCenter.lng - lng, 2) + Math.pow(currentCenter.lat - lat, 2)
			);

			if (distance > 0.1 || currentZoom < 10) {
				console.log(`Map not positioned correctly. Distance: ${distance}, Zoom: ${currentZoom}`);
				if (retryCount < maxRetries) {
					setTimeout(() => {
						getTractDataAtPoint(lng, lat, retryCount + 1);
					}, 500);
					return;
				}
			}

			const point = map.project([lng, lat]);
			const buffer = 5; // pixels
			const features = map.queryRenderedFeatures(
				[
					[point.x - buffer, point.y - buffer],
					[point.x + buffer, point.y + buffer]
				],
				{
					layers: ['census-tracts-fill']
				}
			);

			console.log(
				`Query attempt ${retryCount + 1}: Found ${features.length} features at [${lng}, ${lat}]`
			);

			if (features.length > 0) {
				let closestFeature = features[0];
				if (features.length > 1) {
					closestFeature = features[0];
				}

				tractData = closestFeature.properties as CensusTract;
				isTractDataLoading = false;
				pendingTractQuery = null;
				console.log('Tract data loaded:', tractData.geoid);
			} else if (retryCount < maxRetries) {
				// Retry (the tiles might not be loaded yet)
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

	// Get the worst code when multiple service lines exist
	function getWorstCode(inventoryList: any[]): string {
		// Priority: L > GRR > U > NL
		const codes = inventoryList.map((item) => item.OverallSL_Code || item.overallCode || 'U');

		if (codes.includes('L')) return 'L';
		if (codes.includes('GRR')) return 'GRR';
		if (codes.includes('U')) return 'U';
		return 'NL';
	}

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

	// Effects.
	$effect(() => {
		if (!address) {
			tractData = null;
			isTractDataLoading = false;
			pendingTractQuery = null;
		}
	});

	$effect(() => {
		if (map && address && address.lat && address.long) {
			isTractDataLoading = true;
			tractData = null;
			pendingTractQuery = { lng: address.long, lat: address.lat };
			queryTractDataWithRetry(address.long, address.lat);
		}
	});

	$effect(() => {
		if (map && !mapMoveEndHandler) {
			mapMoveEndHandler = () => {
				if (pendingTractQuery && isTractDataLoading) {
					console.log('Map finished moving, querying tract data...');
					getTractDataAtPoint(pendingTractQuery.lng, pendingTractQuery.lat);
				}
			};
			map.on('moveend', mapMoveEndHandler);
		}
	});

	onDestroy(() => {
		if (map && mapMoveEndHandler) {
			map.off('moveend', mapMoveEndHandler);
		}
	});
</script>

{#if address}
	<div class="scrollbar-thin scrollbar-position mt-4 max-h-[calc(100vh-29rem)] overflow-y-auto">
		<div class="space-y-3 sm:space-y-4">
			<!-- Address Information -->
			<div class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
				<h3 class="font-sans-secondary mt-0 mb-0 text-base font-medium text-slate-800 sm:text-lg">
					Selected address
				</h3>
				<div class="space-y-2 font-sans">
					<div>
						<p class="text-sm font-medium break-words text-slate-800 sm:text-base">
							{address.fullAddress}
						</p>
					</div>

					<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
						<span class="text-xs text-slate-600 sm:text-sm">Lead Status:</span>
						{#if isLoading}
							<span
								class="inline-flex items-center self-start rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:text-sm"
							>
								<svg class="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
										fill="none"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Loading...
							</span>
						{:else if displayCode === 'L'}
							<span
								class="inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
								style="background-color: {COLORS.RED}"
							>
								Lead
							</span>
						{:else if displayCode === 'GRR'}
							<span
								class="inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
								style="background-color: {COLORS.ORANGE}"
							>
								Galvanized (Replace)
							</span>
						{:else if displayCode === 'NL'}
							<span
								class="inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
								style="background-color: {COLORS.TURQUOISE}"
							>
								Non-Lead
							</span>
						{:else}
							<span
								class="inline-flex items-center self-start rounded-full px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
								style="background-color: {COLORS.GOLD}"
							>
								Unknown (Suspected Lead)
							</span>
						{/if}
					</div>

					{#if $serviceLineCount > 1}
						<p class="mt-1 text-xs text-slate-500 italic">
							This address is associated with {$serviceLineCount} service line records. The status shown
							above represents the 'worst-case' scenario across all lines: If suspected lead appears
							in any of the service lines, it'll be noted here. See individual line details below.
						</p>
					{/if}
				</div>
			</div>

			<!-- Service Line Details -->
			<div class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
				<h3 class="font-sans-secondary mt-0 text-base font-medium text-slate-800 sm:text-lg">
					Service line information
					{#if $serviceLineCount > 1}
						<br /><span class="text-sm font-normal text-slate-600"
							>↳ {$serviceLineCount} lines found at this address</span
						>
					{/if}
				</h3>

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
							<p class="font-sans text-xs break-words text-orange-700 sm:text-sm">{error}</p>
						</div>
					</div>
				{:else if currentInventoryData}
					<!-- Navigation controls for multiple service lines -->
					{#if $serviceLineCount > 1}
						<div
							class="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2"
						>
							<button
								onclick={previousServiceLine}
								disabled={$multiServiceLineStore.currentIndex === 0}
								class="flex w-20 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors {$multiServiceLineStore.currentIndex ===
								0
									? 'cursor-not-allowed text-slate-400'
									: 'text-slate-600 hover:bg-slate-200'}"
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

							<span class="text-xs font-medium text-slate-700">
								Line {$multiServiceLineStore.currentIndex + 1} of {$serviceLineCount}
							</span>

							<button
								onclick={nextServiceLine}
								disabled={$multiServiceLineStore.currentIndex === $serviceLineCount - 1}
								class="flex w-20 items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors {$multiServiceLineStore.currentIndex ===
								$serviceLineCount - 1
									? 'cursor-not-allowed text-slate-400'
									: 'text-slate-600 hover:bg-slate-200'}"
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

					<!-- Visual Service Line Diagram -->
					<div class="mb-0">
						<ServiceLineDiagram
							utilitySideMaterial={currentInventoryData.PublSrvLnMatEPA ||
								currentInventoryData.utilitySideMaterial ||
								'U'}
							gooseneckMaterial={currentInventoryData.Gooseneck ||
								currentInventoryData.gooseneck ||
								'U'}
							customerSideMaterial={currentInventoryData.PrivateSrvLnMatEPA ||
								currentInventoryData.customerSideMaterial ||
								'U'}
							overallCode={currentInventoryData.OverallSL_Code ||
								currentInventoryData.overallCode ||
								'U'}
						/>
					</div>

					<!-- Additional inventory details if needed -->
					{#if currentInventoryData.highRisk === 'Y'}
						<div class="mt-2 space-y-2 font-sans text-xs sm:text-sm">
							<div class="flex items-start gap-2">
								<span class="font-medium text-red-700"
									>⚠️ This address is considered a high-risk property by the City of Chicago</span
								>
							</div>
						</div>
					{/if}
				{:else}
					<div class="rounded-md border border-slate-200 bg-slate-50 p-2 sm:p-3">
						<div class="flex items-start gap-2">
							<svg
								class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<p class="font-sans text-xs text-slate-500 sm:text-sm">
									Detailed inventory information is not available for this address.
								</p>
								<p class="mt-1 font-sans text-xs text-slate-400">
									The basic lead status shown above is based on available data from the geocoded
									address database.
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Census Tract Information -->
			<div class="rounded-lg border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
				<h3 class="font-sans-secondary mt-0 text-base font-medium text-slate-800 sm:text-lg">
					Census tract context
				</h3>
				{#if !address}
					<div class="font-sans text-xs text-slate-500 sm:text-sm">
						<p>Select an address to view census tract information.</p>
					</div>
				{:else if tractData}
					<div class="font-sans text-xs sm:text-sm">
						<p class="mt-1 text-xs text-slate-500 italic">
							This address is located in Census tract {tractData.geoid}. Statistics on this tract
							appear below.
						</p>

						{#if (tractData as any).total !== undefined}
							<p class="mb-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
								Service Line Inventory
							</p>

							<div class="mb-3 rounded-sm bg-gray-50 p-2">
								<table class="w-full text-xs">
									<colgroup>
										<col class="w-3/5" />
										<col class="w-1/5" />
										<col class="w-1/5" />
									</colgroup>
									<tbody>
										<tr class="border-b border-gray-200">
											<td class="py-1 text-gray-600">Lead</td>
											<td class="px-2 py-1 text-right font-medium"
												>{formatCount((tractData as any).L)}</td
											>
											<td class="py-1 text-right text-gray-600"
												>{formatPercent((tractData as any).pct_lead)}</td
											>
										</tr>
										<tr class="border-b border-gray-200">
											<td class="py-1 text-gray-600">Galvanized (Replace)</td>
											<td class="px-2 py-1 text-right font-medium"
												>{formatCount((tractData as any).GRR)}</td
											>
											<td class="py-1 text-right text-gray-600"
												>{formatPercent((tractData as any).pct_grr)}</td
											>
										</tr>
										<tr class="border-b border-gray-200">
											<td class="py-1 text-gray-600">Unknown (Suspected Lead)</td>
											<td class="px-2 py-1 text-right font-medium"
												>{formatCount((tractData as any).U)}</td
											>
											<td class="py-1 text-right text-gray-600"
												>{formatPercent((tractData as any).pct_suspected_lead)}</td
											>
										</tr>
										<tr>
											<td class="py-1 text-gray-600">Non-Lead</td>
											<td class="px-2 py-1 text-right font-medium"
												>{formatCount((tractData as any).NL)}</td
											>
											<td class="py-1 text-right text-gray-600"
												>{formatPercent((tractData as any).pct_not_lead)}</td
											>
										</tr>
									</tbody>
								</table>

								<div class="px-2">
									<table class="mt-2 w-full border-t border-gray-200 pt-2 text-xs">
										<colgroup>
											<col class="w-3/5" />
											<col class="w-1/5" />
											<col class="w-1/5" />
										</colgroup>
										<tbody>
											<tr>
												<td class="py-1 text-gray-700">Total</td>
												<td class="px-2 py-1 text-right font-bold"
													>{formatCount((tractData as any).total)}</td
												>
												<td class="py-1"></td>
											</tr>
										</tbody>
									</table>
								</div>

								{#if (tractData as any).requires_replacement !== undefined}
									<div class="mt-2 rounded-sm bg-purple-50 p-2">
										<table class="w-full text-xs">
											<colgroup>
												<col class="w-3/5" />
												<col class="w-1/5" />
												<col class="w-1/5" />
											</colgroup>
											<tbody>
												<tr>
													<td class="font-medium text-purple-700">Requires Replacement</td>
													<td class="px-2 text-right font-bold text-purple-900"
														>{formatCount((tractData as any).requires_replacement)}</td
													>
													<td class="text-right font-bold text-purple-900"
														>{formatPercent((tractData as any).pct_requires_replacement)}</td
													>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</div>
						{/if}

						<p class="mb-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
							Demographics
						</p>
						<div class="rounded-sm bg-gray-50 p-2">
							<table class="w-full text-xs">
								<tbody>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Median Income</td>
										<td class="py-1 text-right font-medium"
											>{formatCurrency(tractData.median_household_income)}</td
										>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Poverty Rate</td>
										<td class="py-1 text-right font-medium"
											>{formatPercent(tractData.pct_poverty)}</td
										>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Black Population</td>
										<td class="py-1 text-right font-medium"
											>{formatPercent(
												(tractData as any).pct_black_nonhispanic || tractData.pct_black
											)}</td
										>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">White Population</td>
										<td class="py-1 text-right font-medium"
											>{formatPercent((tractData as any).pct_white_nonhispanic)}</td
										>
									</tr>
									<tr class="border-b border-gray-200">
										<td class="py-1 text-gray-600">Asian Population</td>
										<td class="py-1 text-right font-medium"
											>{formatPercent((tractData as any).pct_asian_nonhispanic)}</td
										>
									</tr>
									<tr>
										<td class="py-1 text-gray-600">Minority Population</td>
										<td class="py-1 text-right font-medium"
											>{formatPercent(tractData.pct_minority)}</td
										>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				{:else if isTractDataLoading}
					<div class="font-sans text-xs text-slate-500 sm:text-sm">
						<div class="flex items-center gap-2">
							<div
								class="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
							></div>
							<p>Loading census tract information...</p>
						</div>
					</div>
				{:else}
					<div class="font-sans text-xs text-slate-500 sm:text-sm">
						<p>Census tract information is not available for this location.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.scrollbar-thin {
		/* Reserve space for scrollbar to prevent layout shift */
		scrollbar-gutter: stable;

		/* For Firefox - auto hide */
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0) transparent;
	}

	.scrollbar-thin:hover {
		/* Show scrollbar on hover for Firefox */
		scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
	}

	.scrollbar-position {
		/* Move scrollbar to the right without affecting content width */
		margin-right: 0px;
	}

	/* On mobile, adjust to align with search button */
	@media (max-width: 640px) {
		.scrollbar-position {
			margin-right: 0;
		}
	}

	/* For Webkit browsers */
	.scrollbar-thin::-webkit-scrollbar {
		width: 6px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0);
		border-radius: 3px;
		transition: background 0.2s;
	}

	.scrollbar-thin:hover::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.2);
	}
</style>
