<script lang="ts">
	import { onMount } from 'svelte';
	import { searchState, visualState, uiState, selectedAddressTractId } from '$lib/stores';
	import { TABLET_BREAKPOINT } from '$lib/utils/constants';
	import maplibregl from 'maplibre-gl';
	import * as pmtiles from 'pmtiles';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '../app.css';
	import { TractPopup } from '$lib/utils/popup';
	import SearchPanel from '$lib/components/search/SearchPanel.svelte';
	import Legend from '$lib/components/legend/Legend.svelte';
	import {
		SOURCE_CONFIG,
		LAYER_CONFIG,
		DO_SPACES_URL,
		STYLES_PATH,
		getChoroplethColorExpression,
		getQuantileExpression
	} from '$lib/utils/config';
	import { fetchQuantileData } from '$lib/utils/quantiles';
	import ExpandLegend from '$lib/components/legend/ExpandLegend.svelte';
	import Credits from '$lib/components/credits/Credits.svelte';

	let map: maplibregl.Map;
	let innerWidth: number;
	let browser = false;
	let currentPopup: maplibregl.Popup | null = null;
	let tractPopup: TractPopup | null = null;

	$: isTabletOrAbove = innerWidth > TABLET_BREAKPOINT;

	// Close tract popup when an address is selected
	$: if ($selectedAddressTractId && tractPopup) {
		tractPopup.removePopup();
	}

	// Close popups when visualization mode or aggregation level changes
	$: if (tractPopup && ($visualState.choroplethMode || $visualState.aggregationLevel)) {
		tractPopup.removePopup();
	}

	class ResetViewControl {
		onAdd(map: maplibregl.Map) {
			const btn = document.createElement('button');
			btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-geolocate';
			btn.innerHTML = '🔄';
			btn.addEventListener('click', () => {
				map.flyTo({
					center: isTabletOrAbove ? [-87.7298, 41.84] : [-87.7, 42.02],
					zoom: isTabletOrAbove ? 10 : 9
				});

				searchState.set({
					query: '',
					isSearching: false,
					results: [],
					selectedAddress: null
				});

				// Reset UI state to show search header and credits
				uiState.update(state => ({
					...state,
					searchHeaderCollapsed: false,
					creditsExpanded: true
				}));

				// Don't reset the visualState for the legend - let users keep their choropleth mode selection
				// visualState should only be reset if explicitly needed for other functionality

				// Clear address highlight layer
				if (map.getLayer('selected-address-highlight')) {
					map.removeLayer('selected-address-highlight');
				}
				if (map.getSource('selected-address')) {
					map.removeSource('selected-address');
				}

				if (currentPopup) {
					currentPopup.remove();
					currentPopup = null;
				}
			});
			const container = document.createElement('div');
			container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
			container.appendChild(btn);
			return container;
		}
		onRemove() {}
	}

	async function updateMapFilters() {
		if (!map) return;

		// Update Chicago choropleth colors
		const currentChoroplethMode = $visualState.choroplethMode;
		const aggregationLevel = $visualState.aggregationLevel;

		// Handle aggregation level visibility using opacity to keep layers queryable
		if (aggregationLevel === 'tract') {
			// Show tract layers, hide community layers
			map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0.7);
			map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0.8);
			if (map.getLayer('community-areas-fill')) {
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0);
			}
		} else {
			// Show community layers, make tract layers invisible but queryable
			map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0);
			map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0);
			if (map.getLayer('community-areas-fill')) {
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0.7);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0.8);
			}
		}

		// Update choropleth colors for the active aggregation
		if (currentChoroplethMode) {
			try {
				// Fetch quantile data
				const quantileData = await fetchQuantileData(aggregationLevel, currentChoroplethMode);
				const choroplethExpression = getQuantileExpression(
					currentChoroplethMode,
					quantileData.quantiles,
					quantileData.colors
				);

				if (aggregationLevel === 'tract' && map.getLayer('census-tracts-fill')) {
					map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
				} else if (aggregationLevel === 'community' && map.getLayer('community-areas-fill')) {
					map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
				}
			} catch (error) {
				console.error('Error updating map colors:', error);
				// Fallback to interpolation-based colors
				const choroplethExpression = getChoroplethColorExpression(currentChoroplethMode);

				if (aggregationLevel === 'tract' && map.getLayer('census-tracts-fill')) {
					map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
				} else if (aggregationLevel === 'community' && map.getLayer('community-areas-fill')) {
					map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
				}
			}
		}
	}

	$: if (browser && map && $visualState) {
		updateMapFilters();
	}

	onMount(() => {
		const setupMap = async () => {
			browser = true;

			try {
				const protocol = new pmtiles.Protocol();
				maplibregl.addProtocol('pmtiles', protocol.tile);

				await new Promise((resolve) => setTimeout(resolve, 0));

				map = new maplibregl.Map({
					container: 'map-container',
					style: `${DO_SPACES_URL}/${STYLES_PATH}/map-style.json`,
					center: isTabletOrAbove ? [-87.7298, 41.84] : [-87.7, 42.02],
					zoom: isTabletOrAbove ? 10 : 9,
					minZoom: 8,
					maxZoom: 18,
					attributionControl: false
				});

				map.scrollZoom.disable();
				map.scrollZoom.setWheelZoomRate(0);
				map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
				map.addControl(new ResetViewControl(), 'top-right');

				map.on('load', () => {
					Object.values(SOURCE_CONFIG).forEach(({ id, config }) => {
						try {
							if (!map.getSource(id)) {
								map.addSource(id, config);
							}
						} catch (error) {
							console.error(`Error adding source ${id}:`, error);
						}
					});

					try {
						// Add Chicago layers
						if (!map.getLayer(LAYER_CONFIG.censusTractsFill.id)) {
							map.addLayer(LAYER_CONFIG.censusTractsFill);
							// Immediately apply the correct choropleth color expression
							const choroplethExpression = getChoroplethColorExpression(
								$visualState.choroplethMode
							);
							map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
						}
						if (!map.getLayer(LAYER_CONFIG.censusTractsStroke.id)) {
							map.addLayer(LAYER_CONFIG.censusTractsStroke);
						}
						// Add community area layers
						if (!map.getLayer(LAYER_CONFIG.communityAreasFill.id)) {
							map.addLayer(LAYER_CONFIG.communityAreasFill);
							// Set initial opacity based on current mode
							const isCommMode = $visualState.aggregationLevel === 'community';
							map.setPaintProperty('community-areas-fill', 'fill-opacity', isCommMode ? 0.7 : 0);
							
							// Apply choropleth expression if in community mode
							if (isCommMode) {
								const choroplethExpression = getChoroplethColorExpression(
									$visualState.choroplethMode
								);
								map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
							}
						}
						if (!map.getLayer(LAYER_CONFIG.communityAreasStroke.id)) {
							map.addLayer(LAYER_CONFIG.communityAreasStroke);
							// Set initial opacity based on current mode
							const isCommMode = $visualState.aggregationLevel === 'community';
							map.setPaintProperty('community-areas-stroke', 'line-opacity', isCommMode ? 0.8 : 0);
						}
					} catch (error) {
						console.error('Error adding layers:', error);
					}

					// Add census tract event handlers
					tractPopup = new TractPopup(map);

					// Handle tract clicks
					map.on('click', LAYER_CONFIG.censusTractsFill.id, (e) => {
						// Only show census tract popup if we're in tract mode
						if ($visualState.aggregationLevel !== 'tract') return;
						
						if (!e.features?.length) return;

						const feature = e.features[0];
						const tractGeoid = feature.properties?.geoid;
						const selectedTractId = $selectedAddressTractId;

						// Don't show popup if this is the selected address's tract
						if (selectedTractId && tractGeoid === selectedTractId) {
							return;
						}

						// Use tract data directly from the map feature
						// The PMTiles layer should have all the census tract properties
						const tractProperties = feature.properties;

						if (tractProperties && tractProperties.geoid) {
							const lngLat = e.lngLat;
							if (tractPopup) {
								tractPopup.showPopup(lngLat, tractProperties as any);
							}
						}
					});

					// Handle tract hover
					map.on('mouseenter', LAYER_CONFIG.censusTractsFill.id, (e) => {
						// Only change cursor if we're in tract mode
						if ($visualState.aggregationLevel !== 'tract') return;
						
						const feature = e.features?.[0];
						const tractGeoid = feature?.properties?.geoid;
						const selectedTractId = $selectedAddressTractId;

						// Change cursor only if not the selected tract
						if (!selectedTractId || tractGeoid !== selectedTractId) {
							map.getCanvas().style.cursor = 'pointer';
						}
					});

					map.on('mouseleave', LAYER_CONFIG.censusTractsFill.id, () => {
						if ($visualState.aggregationLevel === 'tract') {
							map.getCanvas().style.cursor = '';
						}
					});

					// Community area clicks are now handled by the general click handler
					// which will show census tract data instead

					// Handle community area hover
					map.on('mouseenter', LAYER_CONFIG.communityAreasFill.id, () => {
						if ($visualState.aggregationLevel === 'community') {
							map.getCanvas().style.cursor = 'pointer';
						}
					});

					map.on('mouseleave', LAYER_CONFIG.communityAreasFill.id, () => {
						if ($visualState.aggregationLevel === 'community') {
							map.getCanvas().style.cursor = '';
						}
					});

					// Add community area click handler
					map.on('click', LAYER_CONFIG.communityAreasFill.id, (e) => {
						// Only show community area popup if we're in community mode
						if ($visualState.aggregationLevel !== 'community') return;
						
						if (!e.features?.length) return;

						const feature = e.features[0];
						const communityProperties = feature.properties;

						if (communityProperties && communityProperties.community) {
							const lngLat = e.lngLat;
							if (tractPopup) {
								tractPopup.showPopup(lngLat, communityProperties as any);
							}
						}
					});

					if (!isTabletOrAbove) {
						map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
						const attrib = document.querySelector('.maplibregl-ctrl-attrib');
						attrib?.classList.remove('maplibregl-compact-show');
						attrib?.removeAttribute('open');
					}
				});
			} catch (error) {
				console.error('Error initializing map:', error);
			}
		};

		setupMap();

		return () => {
			if (map) {
				map.remove();
			}
		};
	});
</script>

<svelte:window bind:innerWidth />
<main class="absolute inset-0 flex flex-col overflow-hidden font-['Basis_Grotesque']">
	<div class="relative flex-1" class:blur-sm={$uiState.resultsExpanded}>
		<div id="map-container" class="relative h-full">
			<ExpandLegend />
			<Legend />
			<div class="floating-panel absolute left-[3%] top-4 z-10 w-[94%] p-4 md:left-4 md:w-[400px]">
				<SearchPanel {map} />
				<Credits />
			</div>
		</div>
	</div>

	{#if $uiState.resultsExpanded}
		<div
			class="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px] transition-opacity duration-300"
			on:click={() => uiState.update((state) => ({ ...state, resultsExpanded: false }))}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === 'Space') {
					e.preventDefault();
					uiState.update((state) => ({ ...state, resultsExpanded: false }));
				}
			}}
			role="button"
			tabindex="0"
			aria-label="Close results table"
		></div>
	{/if}
</main>

<div class="logo-container">
	<a href="https://grist.org" target="_blank" rel="noopener noreferrer">
		<img
			src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMyIgdmlld0JveD0iMCAwIDEwMCAxMDMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik04NS4xMSA2NFY4OC4zQzc5LjMxIDkxLjkgNzIuODEgOTQgNjcuMzEgOTRDMzkuOTEgOTQgMTUuMzEgNjQuMSAxNS4zMSAzM0MxNS4zMSAxOC40IDI0LjkxIDYuOSA0MS42MSA2LjlDNTIuMTEgNi45IDcyLjUxIDEzLjYgODcuNjEgMjkuOEM4OC4wNjg4IDMwLjM4IDg4LjY0MzkgMzAuODU3NiA4OS4yOTg0IDMxLjIwMjFDODkuOTUyOCAzMS41NDY1IDkwLjY3MjEgMzEuNzUwMiA5MS40MSAzMS44QzkzLjQxIDMxLjggOTQuNjEgMzAuNSA5NC42MSAyOC4yVjJIOTAuOTFWM0M5MC45MSA2LjYgODguODEgNy42IDgzLjYxIDZDNzMuMTcyNyAyLjUwNDA4IDYyLjIxNTcgMC44MTMxOTMgNTEuMjEgMUMxOC4zMSAxIDAuMjEwMDIyIDI2LjggMC4yMTAwMjIgNTJDMC4yMTAwMjIgODAuOCAyMi4xMSAxMDMgNTEuMjEgMTAzQzYzLjM1OCAxMDIuOTE0IDc1LjE4ODMgOTkuMTEgODUuMTEgOTIuMVYxMDJIOTkuNjFWNTBINDYuNjFWNjRIODUuMTFaIiBmaWxsPSIjM0MzODMwIi8+Cjwvc3ZnPg=="
			alt="Grist G logo"
		/>
	</a>
</div>
