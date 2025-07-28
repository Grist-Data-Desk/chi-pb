<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import * as pmtiles from 'pmtiles';
	import { onMount } from 'svelte';

	import Credits from '$lib/components/credits/Credits.svelte';
	import ExpandLegend from '$lib/components/legend/ExpandLegend.svelte';
	import Legend from '$lib/components/legend/Legend.svelte';
	import SearchPanel from '$lib/components/search/SearchPanel.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import { searchState, selectedAddressTractId } from '$lib/stores';
	import {
		SOURCE_CONFIG,
		LAYER_CONFIG,
		DO_SPACES_URL,
		STYLES_PATH,
		getChoroplethColorExpression,
		getQuantileExpression
	} from '$lib/utils/config';
	import { TABLET_BREAKPOINT } from '$lib/utils/constants';
	import { TractPopup } from '$lib/utils/popup';
	import { fetchQuantileData } from '$lib/utils/quantiles';

	// State.
	let map = $state<maplibregl.Map | null>(null);
	let browser = $state(false);
	let currentPopup = $state<maplibregl.Popup | null>(null);
	let tractPopup = $state<TractPopup | null>(null);
	let innerWidth = $state<number>(0);
	let isTabletOrAbove = $derived(innerWidth > TABLET_BREAKPOINT);

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

				ui.searchHeaderCollapsed = false;
				ui.creditsExpanded = true;

				// Don't reset the visualization state for the legend - let users keep
				// their choropleth mode selection.

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

		const currentChoroplethMode = visualization.choroplethMode;
		const aggregationLevel = visualization.aggregationLevel;

		if (aggregationLevel === 'tract') {
			map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0.7);
			map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0.8);
			if (map.getLayer('community-areas-fill')) {
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0);
			}
		} else {
			map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0);
			map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0);
			if (map.getLayer('community-areas-fill')) {
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0.7);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0.8);
			}
		}

		if (currentChoroplethMode) {
			try {
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
				const choroplethExpression = getChoroplethColorExpression(currentChoroplethMode);

				if (aggregationLevel === 'tract' && map.getLayer('census-tracts-fill')) {
					map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
				} else if (aggregationLevel === 'community' && map.getLayer('community-areas-fill')) {
					map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
				}
			}
		}
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
					maxZoom: 18
				});

				map.scrollZoom.disable();
				map.scrollZoom.setWheelZoomRate(0);
				map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
				map.addControl(new ResetViewControl(), 'top-right');

				map.on('load', (e) => {
					const m = e.target;

					Object.values(SOURCE_CONFIG).forEach(({ id, config }) => {
						try {
							if (!m.getSource(id)) {
								m.addSource(id, config);
							}
						} catch (error) {
							console.error(`Error adding source ${id}:`, error);
						}
					});

					try {
						if (!m.getLayer(LAYER_CONFIG.censusTractsFill.id)) {
							m.addLayer(LAYER_CONFIG.censusTractsFill, 'road-label-simple');
							const choroplethExpression = getChoroplethColorExpression(
								visualization.choroplethMode
							);
							m.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);
						}
						if (!m.getLayer(LAYER_CONFIG.censusTractsStroke.id)) {
							m.addLayer(LAYER_CONFIG.censusTractsStroke, 'road-label-simple');
						}
						if (!m.getLayer(LAYER_CONFIG.communityAreasFill.id)) {
							m.addLayer(LAYER_CONFIG.communityAreasFill, 'road-label-simple');
							const isCommMode = visualization.aggregationLevel === 'community';
							m.setPaintProperty('community-areas-fill', 'fill-opacity', isCommMode ? 0.7 : 0);

							if (isCommMode) {
								const choroplethExpression = getChoroplethColorExpression(
									visualization.choroplethMode
								);
								m.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
							}
						}
						if (!m.getLayer(LAYER_CONFIG.communityAreasStroke.id)) {
							m.addLayer(LAYER_CONFIG.communityAreasStroke, 'road-label-simple');
							const isCommMode = visualization.aggregationLevel === 'community';
							m.setPaintProperty('community-areas-stroke', 'line-opacity', isCommMode ? 0.8 : 0);
						}
					} catch (error) {
						console.error('Error adding layers:', error);
					}

					tractPopup = new TractPopup(m);

					m.on('click', LAYER_CONFIG.censusTractsFill.id, (e) => {
						if (visualization.aggregationLevel !== 'tract') return;

						if (!e.features?.length) return;

						const feature = e.features[0];
						const tractGeoid = feature.properties?.geoid;
						const selectedTractId = $selectedAddressTractId;

						if (selectedTractId && tractGeoid === selectedTractId) {
							return;
						}

						const tractProperties = feature.properties;

						if (tractProperties && tractProperties.geoid) {
							const lngLat = e.lngLat;
							if (tractPopup) {
								tractPopup.showPopup(lngLat, tractProperties as any);
							}
						}
					});

					m.on('mouseenter', LAYER_CONFIG.censusTractsFill.id, (e) => {
						if (visualization.aggregationLevel !== 'tract') return;

						const feature = e.features?.[0];
						const tractGeoid = feature?.properties?.geoid;
						const selectedTractId = $selectedAddressTractId;

						if (!selectedTractId || tractGeoid !== selectedTractId) {
							m.getCanvas().style.cursor = 'pointer';
						}
					});

					m.on('mouseleave', LAYER_CONFIG.censusTractsFill.id, () => {
						if (visualization.aggregationLevel === 'tract') {
							m.getCanvas().style.cursor = '';
						}
					});

					m.on('mouseenter', LAYER_CONFIG.communityAreasFill.id, () => {
						if (visualization.aggregationLevel === 'community') {
							m.getCanvas().style.cursor = 'pointer';
						}
					});

					m.on('mouseleave', LAYER_CONFIG.communityAreasFill.id, () => {
						if (visualization.aggregationLevel === 'community') {
							m.getCanvas().style.cursor = '';
						}
					});

					m.on('click', LAYER_CONFIG.communityAreasFill.id, (e) => {
						if (visualization.aggregationLevel !== 'community') return;

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

	// Effects.
	$effect(() => {
		if (browser && map && visualization) {
			updateMapFilters();
		}
	});

	$effect(() => {
		if ($selectedAddressTractId && tractPopup) {
			tractPopup.removePopup();
		}
	});

	$effect(() => {
		if (tractPopup && (visualization.choroplethMode || visualization.aggregationLevel)) {
			tractPopup.removePopup();
		}
	});
</script>

<svelte:window bind:innerWidth />
<main class="absolute inset-0 flex flex-col overflow-hidden font-sans">
	<div class="relative flex-1">
		<div id="map-container" class="relative h-full">
			<ExpandLegend />
			<Legend />
			<div class="floating-panel absolute top-4 left-[3%] z-10 w-[94%] p-4 md:left-4 md:w-[400px]">
				<SearchPanel {map} />
				<Credits />
			</div>
		</div>
	</div>
</main>

<div class="logo-container">
	<a href="https://grist.org" target="_blank" rel="noopener noreferrer">
		<img
			src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMyIgdmlld0JveD0iMCAwIDEwMCAxMDMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik04NS4xMSA2NFY4OC4zQzc5LjMxIDkxLjkgNzIuODEgOTQgNjcuMzEgOTRDMzkuOTEgOTQgMTUuMzEgNjQuMSAxNS4zMSAzM0MxNS4zMSAxOC40IDI0LjkxIDYuOSA0MS42MSA2LjlDNTIuMTEgNi45IDcyLjUxIDEzLjYgODcuNjEgMjkuOEM4OC4wNjg4IDMwLjM4IDg4LjY0MzkgMzAuODU3NiA4OS4yOTg0IDMxLjIwMjFDODkuOTUyOCAzMS41NDY1IDkwLjY3MjEgMzEuNzUwMiA5MS40MSAzMS44QzkzLjQxIDMxLjggOTQuNjEgMzAuNSA5NC42MSAyOC4yVjJIOTAuOTFWM0M5MC45MSA2LjYgODguODEgNy42IDgzLjYxIDZDNzMuMTcyNyAyLjUwNDA4IDYyLjIxNTcgMC44MTMxOTMgNTEuMjEgMUMxOC4zMSAxIDAuMjEwMDIyIDI2LjggMC4yMTAwMjIgNTJDMC4yMTAwMjIgODAuOCAyMi4xMSAxMDMgNTEuMjEgMTAzQzYzLjM1OCAxMDIuOTE0IDc1LjE4ODMgOTkuMTEgODUuMTEgOTIuMVYxMDJIOTkuNjFWNTBINDYuNjFWNjRIODUuMTFaIiBmaWxsPSIjM0MzODMwIi8+Cjwvc3ZnPg=="
			alt="Grist G logo"
		/>
	</a>
</div>
