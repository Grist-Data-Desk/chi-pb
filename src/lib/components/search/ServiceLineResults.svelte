<script lang="ts">
	import type { Map } from 'maplibre-gl';
	import { onDestroy } from 'svelte';

	import Tabs from '$lib/components/shared/tabs/Tabs.svelte';
	import TabItem from '$lib/components/shared/tabs/TabItem.svelte';
	import { multiServiceLineStore, currentServiceLine, serviceLineCount } from '$lib/stores';
	import { search } from '$lib/state/search.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { AddressWithServiceLine, CensusTract } from '$lib/types';
	import { DISPLAY_CODES_TO_MATERIAL_LABELS, getMaterialColor } from '$lib/utils/constants';
	import ServiceLineDetails from '../data/ServiceLineDetails.svelte';
	import Demographics from '../data/Demographics.svelte';
	import ServiceLineInventory from '../data/ServiceLineInventory.svelte';

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
	let communityData = $state<any | null>(null);
	let isTractDataLoading = $state(false);
	let isCommunityDataLoading = $state(false);
	let pendingTractQuery = $state<{ lng: number; lat: number } | null>(null);
	let pendingCommunityQuery = $state<{ lng: number; lat: number } | null>(null);
	let mapMoveEndHandler = $state<(() => void) | null>(null);
	let address = $derived(
		search.clickedServiceLineRow !== null && $multiServiceLineStore.address
			? { ...search.selectedAddress, fullAddress: $multiServiceLineStore.address }
			: selectedAddress || search.selectedAddress
	);
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

	async function queryCommunityDataWithRetry(lng: number, lat: number) {
		setTimeout(() => {
			if (!map?.isMoving()) {
				getCommunityDataAtPoint(lng, lat);
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

				// Update search state with the tract ID for the selected address
				if (search.selectedAddress) {
					search.selectedAddressTractId = tractData.geoid;
				}
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

	async function getCommunityDataAtPoint(lng: number, lat: number, retryCount = 0) {
		if (!map || !pendingCommunityQuery) {
			isCommunityDataLoading = false;
			return;
		}

		if (pendingCommunityQuery.lng !== lng || pendingCommunityQuery.lat !== lat) {
			return;
		}

		const maxRetries = 10;

		try {
			if (!map.getLayer('community-areas-fill')) {
				console.log('Community area layer not yet loaded');
				if (retryCount < maxRetries) {
					setTimeout(() => {
						getCommunityDataAtPoint(lng, lat, retryCount + 1);
					}, 200);
				} else {
					isCommunityDataLoading = false;
					pendingCommunityQuery = null;
				}
				return;
			}

			const point = map.project([lng, lat]);
			const buffer = 5; // pixels
			const features = map.queryRenderedFeatures(
				[
					[point.x - buffer, point.y - buffer],
					[point.x + buffer, point.y + buffer]
				],
				{
					layers: ['community-areas-fill']
				}
			);

			if (features.length > 0) {
				communityData = features[0].properties;
				isCommunityDataLoading = false;
				pendingCommunityQuery = null;

				// Update search state with the community name for the selected address
				if (search.selectedAddress && communityData.community) {
					search.selectedAddressCommunityName = communityData.community;
				}
			} else if (retryCount < maxRetries) {
				setTimeout(() => {
					getCommunityDataAtPoint(lng, lat, retryCount + 1);
				}, 300);
			} else {
				communityData = null;
				isCommunityDataLoading = false;
				pendingCommunityQuery = null;
			}
		} catch (error) {
			console.error('Error getting community data at point:', error);
			if (retryCount < maxRetries) {
				setTimeout(() => {
					getCommunityDataAtPoint(lng, lat, retryCount + 1);
				}, 300);
			} else {
				communityData = null;
				isCommunityDataLoading = false;
				pendingCommunityQuery = null;
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

	// Effects.
	$effect(() => {
		if (!address) {
			tractData = null;
			communityData = null;
			isTractDataLoading = false;
			isCommunityDataLoading = false;
			pendingTractQuery = null;
			pendingCommunityQuery = null;
			// Clear the tract/community info when no address is selected
			search.selectedAddressTractId = null;
			search.selectedAddressCommunityName = null;
		}
	});

	$effect(() => {
		if (map && address && address.lat && address.long) {
			isTractDataLoading = true;
			tractData = null;
			pendingTractQuery = { lng: address.long, lat: address.lat };
			queryTractDataWithRetry(address.long, address.lat);

			// Also query for community area data
			isCommunityDataLoading = true;
			communityData = null;
			pendingCommunityQuery = { lng: address.long, lat: address.lat };
			queryCommunityDataWithRetry(address.long, address.lat);
		}
	});

	$effect(() => {
		if (map && !mapMoveEndHandler) {
			mapMoveEndHandler = () => {
				if (pendingTractQuery && isTractDataLoading) {
					console.log('Map finished moving, querying tract data...');
					getTractDataAtPoint(pendingTractQuery.lng, pendingTractQuery.lat);
				}
				if (pendingCommunityQuery && isCommunityDataLoading) {
					console.log('Map finished moving, querying community data...');
					getCommunityDataAtPoint(pendingCommunityQuery.lng, pendingCommunityQuery.lat);
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
	<div
		class="scrollbar-thin scrollbar-position flex max-h-[40svh] flex-col gap-3 overflow-y-auto sm:max-h-none sm:gap-6"
	>
		<div class="flex flex-col gap-1 font-sans sm:gap-2">
			<h3 class="font-sans-secondary mt-0 mb-0 text-base font-medium text-slate-800 sm:text-lg">
				Selected address
			</h3>
			<p class="m-0 text-sm font-medium break-words text-slate-800 sm:text-base">
				{address.fullAddress}
			</p>
			{#if search.isNominatimAddress}
				<div class="rounded-md border border-amber-200 bg-amber-50 pr-3 pl-3">
					<div class="flex items-start gap-2">
						<div>
							<p class="font-sans text-sm font-medium text-amber-800">
								The address you searched is not in the city of Chicago's water service line
								inventory. However, you can click on a nearby service line dot to view its
								corresponding inventory entry.
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-1 sm:gap-2">
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
					{:else if displayCode === 'L' || displayCode === 'GRR' || displayCode === 'NL'}
						<span
							class="inline-flex items-center self-start rounded-full border-2 border-white px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
							style="background-color: {getMaterialColor(displayCode)}"
						>
							{DISPLAY_CODES_TO_MATERIAL_LABELS[displayCode]}
						</span>
					{:else}
						<span
							class="inline-flex items-center self-start rounded-full border-2 border-white px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
							style="background-color: {getMaterialColor('U')}"
						>
							Suspected Lead
						</span>
					{/if}
				</div>
				{#if $serviceLineCount > 1}
					<p class="m-0 text-xs text-slate-500 italic">
						This address is associated with {$serviceLineCount} service line records. The status shown
						above represents the 'worst-case' scenario across all lines: If suspected lead appears in
						any of the service lines, it'll be noted here. See individual line details below.
					</p>
				{/if}
			{/if}
		</div>
		{#if !search.isNominatimAddress}
			<Tabs>
				<TabItem title="Service line information" open={true}>
					<ServiceLineDetails {isLoading} {error} {currentInventoryData} />
				</TabItem>
				<TabItem title="Service line inventory" open={false}>
					<ServiceLineInventory
						data={visualization.aggregationLevel === 'tract' ? tractData : communityData}
						loading={visualization.aggregationLevel === 'tract'
							? isTractDataLoading
							: isCommunityDataLoading}
					/>
				</TabItem>
				<TabItem title="Demographics" open={false}>
					<Demographics
						data={visualization.aggregationLevel === 'tract' ? tractData : communityData}
						loading={visualization.aggregationLevel === 'tract'
							? isTractDataLoading
							: isCommunityDataLoading}
					/>
				</TabItem>
			</Tabs>
		{/if}
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
