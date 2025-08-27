<script lang="ts">
	import type { Map, MapMouseEvent } from 'maplibre-gl';
	import { onMount, getContext } from 'svelte';

	import DemographicContext from '$lib/components/data/DemographicContext.svelte';
	import ServiceLineDetails from '$lib/components/data/ServiceLineDetails.svelte';
	import ServiceLineInventory from '$lib/components/data/ServiceLineInventory.svelte';
	import Tabs from '$lib/components/shared/tabs/Tabs.svelte';
	import TabItem from '$lib/components/shared/tabs/TabItem.svelte';
	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';
	import { multiServiceLineStore, currentServiceLine, serviceLineCount } from '$lib/stores';
	import { search } from '$lib/state/search.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { AddressWithServiceLine, CensusTract, CommunityArea } from '$lib/types';
	import { LAYER_CONFIG } from '$lib/utils/config';
	import { getMaterialColor, COLORS } from '$lib/utils/constants';
	import { social } from '$lib/state/social.svelte';

	// Context.
	const lang = getContext<() => Language>('lang');

	// Props.
	interface Props {
		selectedAddress: AddressWithServiceLine | null;
		inventoryData: any;
		isLoading: boolean;
		error: string | null;
		map: Map;
	}

	let { selectedAddress, inventoryData, isLoading, error, map }: Props = $props();

	// State.
	let tractData = $state<CensusTract | null>(null);
	let communityData = $state<CommunityArea | null>(null);
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
	let messages = $derived(i18nMessages[lang()]);

	onMount(() => {
		function handleMapMoveEnd() {
			if (address && address.long && address.lat) {
				getTractDataAtPoint(address.long, address.lat);
				getCommunityDataAtPoint(address.long, address.lat);
			}
		}

		map?.on('moveend', handleMapMoveEnd);

		function handleServiceLineClick(e: MapMouseEvent) {
			const { lng, lat } = e.lngLat;
			getTractDataAtPoint(lng, lat);
			getCommunityDataAtPoint(lng, lat);
		}

		map?.on('click', LAYER_CONFIG.serviceLines.id, handleServiceLineClick);

		return () => {
			map?.off('moveend', handleMapMoveEnd);
			map?.off('click', LAYER_CONFIG.serviceLines.id, handleServiceLineClick);
		};
	});

	function getDataAtPoint(lng: number, lat: number, layer: string) {
		const point = map.project([lng, lat]);
		const features = map.queryRenderedFeatures(point, {
			layers: [layer]
		});

		return features;
	}

	function getTractDataAtPoint(lng: number, lat: number) {
		const features = getDataAtPoint(lng, lat, LAYER_CONFIG.censusTractsFill.id);

		features.length > 0 ? (tractData = features[0].properties as CensusTract) : (tractData = null);

		// Update search state with the tract ID for the selected address
		if (search.selectedAddress && tractData?.geoid) {
			search.selectedAddressTractId = tractData.geoid;
		}
	}

	function getCommunityDataAtPoint(lng: number, lat: number) {
		const features = getDataAtPoint(lng, lat, LAYER_CONFIG.communityAreasFill.id);

		features.length > 0
			? (communityData = features[0].properties as CommunityArea)
			: (communityData = null);

		// Update search state with the community name for the selected address
		if (search.selectedAddress && communityData?.community) {
			search.selectedAddressCommunityName = communityData.community;
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

	// Handle share button click
	async function shareResults() {
		const community = communityData?.community || search.selectedAddressCommunityName;
		await social.generateShareImage(displayCode, community, lang());
	}

	// Effects.
	$effect(() => {
		if (!address) {
			tractData = null;
			communityData = null;

			// Clear the tract/community info when no address is selected
			search.selectedAddressTractId = null;
			search.selectedAddressCommunityName = null;
		}
	});

	// Cleanup social state on component destroy
	$effect(() => {
		return () => {
			social.cleanup();
		};
	});
</script>

{#if address}
	<div class="flex flex-col gap-3 sm:gap-6">
		<div class="flex flex-col gap-1 font-sans">
			<h3 class="font-sans-secondary text-earth mt-0 mb-0 text-base font-medium sm:text-xl">
				{messages.selectedAddress.label}
			</h3>
			<p class="text-earth m-0 text-sm font-medium break-words sm:text-base">
				{address.fullAddress}
			</p>
			{#if search.isNominatimAddress}
				<div class="rounded-md border border-amber-200 bg-amber-50 pr-3 pl-3">
					<div class="flex items-start gap-2">
						<div>
							<p class="font-sans text-sm font-medium text-amber-800">
								{messages.selectedAddress.addressNotFound}
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-1 sm:gap-2">
					<span class="text-earth text-xs sm:text-sm"
						>{messages.selectedAddress.leadStatus.label}:</span
					>
					{#if isLoading}
						<span
							class="text-earth/80 border-earth/30 bg-earth/5 inline-flex items-center self-start rounded-full border-2 px-2 py-0.5 text-xs font-medium sm:px-2.5 sm:text-sm"
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
							{messages.selectedAddress.leadStatus.loading}
						</span>
					{:else if displayCode === 'L' || displayCode === 'GRR' || displayCode === 'NL'}
						<span
							class="inline-flex items-center self-start rounded-full border-2 border-white px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
							style="background-color: {getMaterialColor(displayCode)}"
						>
							{messages.selectedAddress.leadStatus[displayCode]}
						</span>
					{:else}
						<span
							class="inline-flex items-center self-start rounded-full border-2 border-white px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:text-sm"
							style="background-color: {getMaterialColor('U')}"
						>
							{messages.selectedAddress.leadStatus.U}
						</span>
					{/if}
					{#if !isLoading}
						<button
							onclick={shareResults}
							class="inline-flex cursor-pointer items-center self-start rounded-full border-2 border-white px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:px-2.5 sm:text-sm"
							style="background-color: {COLORS.EARTH}"
							title="Share your results"
						>
							<svg class="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
								/>
							</svg>
							{messages.selectedAddress.share.button}
						</button>
					{/if}
				</div>
				{#if $serviceLineCount > 1}
					<p class="text-earth/80 m-0 font-sans text-xs">
						{messages.selectedAddress.multipleServiceLines({
							count: $serviceLineCount
						})}
					</p>
				{/if}
			{/if}
		</div>
		{#if !search.isNominatimAddress}
			<Tabs>
				<TabItem title={messages.tabs.serviceLineInformationTabTitle} open={true}>
					<ServiceLineDetails {isLoading} {error} {currentInventoryData} />
				</TabItem>
				<TabItem title={messages.tabs.serviceLineInventoryTabTitle} open={false}>
					<ServiceLineInventory
						data={visualization.aggregationLevel === 'tract' ? tractData : communityData}
					/>
				</TabItem>
				<TabItem title={messages.tabs.demographicContextTabTitle} open={false}>
					<DemographicContext
						data={visualization.aggregationLevel === 'tract' ? tractData : communityData}
					/>
				</TabItem>
			</Tabs>
		{/if}
	</div>
{/if}
