<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import * as pmtiles from 'pmtiles';
	import * as turf from '@turf/turf';
	import { onMount } from 'svelte';

	import { Popup } from '$lib/classes/Popup';
	import { ResetViewControl } from '$lib/classes/ResetViewControl';
	import Credits from '$lib/components/credits/Credits.svelte';
	import ExpandCredits from '$lib/components/credits/ExpandCredits.svelte';
	import Resources from '$lib/components/resources/Resources.svelte';
	import ExpandResources from '$lib/components/resources/ExpandResources.svelte';
	import ExpandLegend from '$lib/components/legend/ExpandLegend.svelte';
	import Legend from '$lib/components/legend/Legend.svelte';
	import GristLogo from '$lib/components/logos/GristLogo.svelte';
	import ICNLogo from '$lib/components/logos/ICNLogo.svelte';
	import WBEZLogo from '$lib/components/logos/WBEZLogo.svelte';
	import SearchPanel from '$lib/components/search/SearchPanel.svelte';
	import { removeSelectedFeatureState, setSelectedFeatureState } from '$lib/state/feature.svelte';
	import { mapState } from '$lib/state/map.svelte';
	import { popup } from '$lib/state/popup.svelte';
	import { search } from '$lib/state/search.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import {
		spatialIndex,
		loadServiceLineSpatialIndex,
		findServiceLinesWithinRadius,
		buildSpatialIndexFromCombined
	} from '$lib/state/spatial-index.svelte';
	import { loadCombinedIndex, combinedIndexStore } from '$lib/stores';
	import {
		SOURCE_CONFIG,
		LAYER_CONFIG,
		DO_SPACES_URL,
		STYLES_PATH,
		INITIAL_CENTER,
		INITIAL_MOBILE_CENTER,
		INITIAL_ZOOM,
		INITIAL_MOBILE_ZOOM
	} from '$lib/utils/config';
	import { TABLET_BREAKPOINT, COLORS } from '$lib/utils/constants';
	import { fetchQuantileData, getQuantileColorExpression } from '$lib/utils/quantiles';
	
	// Helper function to check if a polygon should be interactive (clickable/hoverable)
	function isPolygonInteractive(
		properties: any,
		aggregationLevel: 'tract' | 'community'
	): boolean {
		if (!properties) return false;
		
		// Check if this is the searched address polygon
		if (search.selectedAddress) {
			if (aggregationLevel === 'tract' && properties.geoid === search.selectedAddressTractId) {
				return false;
			}
			if (aggregationLevel === 'community' && properties.community === search.selectedAddressCommunityName) {
				return false;
			}
		}
		
		// Check if value is null/undefined for current mode
		const currentMode = visualization.choroplethMode;
		const modeValue = properties[currentMode];
		if (modeValue === null || modeValue === undefined) {
			return false;
		}
		
		// Check if flagged in replacement mode
		if (currentMode === 'pct_requires_replacement' && properties.flag === true) {
			return false;
		}
		
		return true;
	}
	
	// State.
	let innerWidth = $state<number>(0);
	let isTabletOrAbove = $derived(innerWidth > TABLET_BREAKPOINT);
	let resourcesPanelRef = $state<HTMLDivElement | null>(null);

	// Close resources panel when clicking outside
	$effect(() => {
		if (ui.resourcesExpanded && resourcesPanelRef) {
			const handleClickOutside = (event: MouseEvent) => {
				const target = event.target as HTMLElement;
				// Check if click is outside the resources panel and not on the toggle button
				if (
					!resourcesPanelRef?.contains(target) &&
					!target.closest('button[aria-label*="resources"]')
				) {
					ui.resourcesExpanded = false;
				}
			};

			// Close on any map interaction
			const handleMapInteraction = () => {
				ui.resourcesExpanded = false;
			};

			document.addEventListener('click', handleClickOutside);
			mapState.map?.on('click', handleMapInteraction);
			mapState.map?.on('dragstart', handleMapInteraction);
			mapState.map?.on('zoomstart', handleMapInteraction);

			return () => {
				document.removeEventListener('click', handleClickOutside);
				mapState.map?.off('click', handleMapInteraction);
				mapState.map?.off('dragstart', handleMapInteraction);
				mapState.map?.off('zoomstart', handleMapInteraction);
			};
		}
	});

	onMount(() => {
		const protocol = new pmtiles.Protocol();
		maplibregl.addProtocol('pmtiles', protocol.tile);

		// Load combined index and build spatial index from it
		loadCombinedIndex()
			.then(() => {
				const combinedIndex = $combinedIndexStore.index;
				if (combinedIndex) {
					buildSpatialIndexFromCombined(combinedIndex);
				}
			})
			.catch(() => {
				console.warn('Failed to load combined index, falling back to separate spatial index');
				loadServiceLineSpatialIndex();
			});

		mapState.map = new maplibregl.Map({
			container: 'map-container',
			style: `${DO_SPACES_URL}/${STYLES_PATH}/map-style.json`,
			center: isTabletOrAbove ? INITIAL_CENTER : INITIAL_MOBILE_CENTER,
			zoom: isTabletOrAbove ? INITIAL_ZOOM : INITIAL_MOBILE_ZOOM,
			minZoom: 8,
			maxZoom: 18
		});

		mapState.map.scrollZoom.disable();
		mapState.map.scrollZoom.setWheelZoomRate(0);
		mapState.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
		mapState.map.addControl(new ResetViewControl({ isTabletOrAbove }), 'top-right');

		mapState.map.on('load', (e) => {
			const map = e.target;

			Object.values(SOURCE_CONFIG).forEach(({ id, config }) => {
				map.addSource(id, config);
			});

			// Add the Census tracts layer.
			map.addLayer(LAYER_CONFIG.censusTractsFill, 'road-label-simple');

			const quantileData = fetchQuantileData(
				visualization.aggregationLevel,
				visualization.choroplethMode
			);
			const choroplethExpression = getQuantileColorExpression(
				visualization.choroplethMode,
				quantileData.quantiles,
				quantileData.colors
			);
			map.setPaintProperty('census-tracts-fill', 'fill-color', choroplethExpression);

			// Add the Census tracts stroke layer.
			map.addLayer(LAYER_CONFIG.censusTractsStroke, 'road-label-simple');

			// Add the Community areas layer.
			map.addLayer(LAYER_CONFIG.communityAreasFill, 'road-label-simple');

			// Add the Community areas stroke layer.
			map.addLayer(LAYER_CONFIG.communityAreasStroke, 'road-label-simple');

			// Add the Service lines layer.
			map.addLayer(LAYER_CONFIG.serviceLines, 'road-label-simple');

			// Trigger the service layer ready state
			serviceLayerReady = true;

			// Set initial layer visibility based on default aggregation level (community)
			if (visualization.aggregationLevel === 'community') {
				// Show community areas
				map.setPaintProperty('community-areas-fill', 'fill-color', choroplethExpression);
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0.7);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0.8);
				// Hide census tracts
				map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0);
				map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0);
			} else {
				// Show census tracts
				map.setPaintProperty('census-tracts-fill', 'fill-opacity', 0.7);
				map.setPaintProperty('census-tracts-stroke', 'line-opacity', 0.8);
				// Hide community areas
				map.setPaintProperty('community-areas-fill', 'fill-opacity', 0);
				map.setPaintProperty('community-areas-stroke', 'line-opacity', 0);
			}

			// Initialize the popup.
			popup.node = new Popup(map, isTabletOrAbove);

			if (!isTabletOrAbove) {
				const attrib = document.querySelector('.maplibregl-ctrl-attrib');
				attrib?.classList.remove('maplibregl-compact-show');
				attrib?.removeAttribute('open');
			}
		});

		// Add click handlers for Census tracts and Community areas.
		mapState.map.on('click', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel !== 'tract' || !e.features?.length) return;

			const feature = e.features[0];
			const tractProperties = feature.properties;

			if (tractProperties && tractProperties.geoid && isPolygonInteractive(tractProperties, 'tract')) {
				// Reset the selected feature, if it exists.
				removeSelectedFeatureState();

				const lngLat = e.lngLat;
				popup.node?.showPopup(lngLat, tractProperties as any);
				setSelectedFeatureState(
					feature.id! as string,
					LAYER_CONFIG.censusTractsFill.source,
					LAYER_CONFIG.censusTractsFill['source-layer']!
				);
			}
		});

		mapState.map.on('click', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel !== 'community' || !e.features?.length) return;

			const feature = e.features[0];
			const communityProperties = feature.properties;

			if (communityProperties && communityProperties.community && isPolygonInteractive(communityProperties, 'community')) {
				// Reset the selected feature, if it exists.
				removeSelectedFeatureState();

				const lngLat = e.lngLat;
				popup.node?.showPopup(lngLat, communityProperties as any);
				setSelectedFeatureState(
					feature.id! as string,
					LAYER_CONFIG.communityAreasFill.source,
					LAYER_CONFIG.communityAreasFill['source-layer']!
				);
			}
		});

		// Add mouseenter and mouseleave handlers for census tracts and community areas.
		mapState.map.on('mouseenter', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel !== 'tract' || !e.features?.length) return;
			
			const feature = e.features[0];
			const properties = feature.properties;
			const map = e.target;
			
			map.getCanvas().style.cursor = isPolygonInteractive(properties, 'tract') ? 'pointer' : '';
		});

		mapState.map.on('mouseleave', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel === 'tract') {
				const map = e.target;
				map.getCanvas().style.cursor = '';
			}
		});

		// Add mousemove handler to catch transitions between features
		mapState.map.on('mousemove', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel !== 'tract' || !e.features?.length) return;
			
			const feature = e.features[0];
			const properties = feature.properties;
			const map = e.target;
			const currentCursor = map.getCanvas().style.cursor;
			const shouldHavePointer = isPolygonInteractive(properties, 'tract');
			
			// Update cursor if needed
			if (!shouldHavePointer && currentCursor === 'pointer') {
				map.getCanvas().style.cursor = '';
			} else if (shouldHavePointer && currentCursor !== 'pointer') {
				map.getCanvas().style.cursor = 'pointer';
			}
		});

		mapState.map.on('mouseenter', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel !== 'community' || !e.features?.length) return;
			
			const feature = e.features[0];
			const properties = feature.properties;
			const map = e.target;
			
			map.getCanvas().style.cursor = isPolygonInteractive(properties, 'community') ? 'pointer' : '';
		});

		mapState.map.on('mouseleave', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel === 'community') {
				const map = e.target;
				map.getCanvas().style.cursor = '';
			}
		});

		// Add mousemove handler to catch transitions between features
		mapState.map.on('mousemove', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel !== 'community' || !e.features?.length) return;
			
			const feature = e.features[0];
			const properties = feature.properties;
			const map = e.target;
			const currentCursor = map.getCanvas().style.cursor;
			const shouldHavePointer = isPolygonInteractive(properties, 'community');
			
			// Update cursor if needed
			if (!shouldHavePointer && currentCursor === 'pointer') {
				map.getCanvas().style.cursor = '';
			} else if (shouldHavePointer && currentCursor !== 'pointer') {
				map.getCanvas().style.cursor = 'pointer';
			}
		});

		// Add click handler for service lines
		mapState.map.on('click', LAYER_CONFIG.serviceLines.id, (e) => {
			if (!e.features?.length) return;

			const feature = e.features[0];
			const clickedRow = feature.properties?.row;

			if (clickedRow !== undefined && clickedRow !== null) {
				// Update the clicked service line row
				search.clickedServiceLineRow = clickedRow;

				// Don't change the map view or search query
				e.preventDefault();
			}
		});

		// Add hover effect for service lines
		mapState.map.on('mouseenter', LAYER_CONFIG.serviceLines.id, (e) => {
			const map = e.target;
			map.getCanvas().style.cursor = 'pointer';
		});

		mapState.map.on('mouseleave', LAYER_CONFIG.serviceLines.id, (e) => {
			const map = e.target;
			map.getCanvas().style.cursor = '';
		});

		mapState.map.on('move', () => {
			popup.node?.removePopup();
			removeSelectedFeatureState();
		});

		mapState.map.on('zoom', () => {
			popup.node?.removePopup();
			removeSelectedFeatureState();
		});

		mapState.map.on('click', (e) => {
			const map = e.target;
			const features = map.queryRenderedFeatures(e.point, {
				layers:
					visualization.aggregationLevel === 'tract'
						? [LAYER_CONFIG.censusTractsFill.id, LAYER_CONFIG.censusTractsStroke.id]
						: [LAYER_CONFIG.communityAreasFill.id, LAYER_CONFIG.communityAreasStroke.id]
			});

			if (features.length === 0) {
				removeSelectedFeatureState();
			}
		});

		return () => {
			mapState.map?.remove();
		};
	});

	$effect(() => {
		if (search.selectedAddress && popup.node) {
			popup.node.removePopup();
		}
	});

	// Create a reactive state for tracking if the layer is ready
	let serviceLayerReady = $state(false);

	// Check when service layer is ready
	$effect(() => {
		if (mapState.map && mapState.map.getLayer('service-lines')) {
			serviceLayerReady = true;
		}
	});

	$effect(() => {
		if (!mapState.map || !serviceLayerReady || !spatialIndex.isReady) {
			return;
		}

		if (search.searchedAddress) {
			// When an address is selected from search, wait for the zoom animation to complete
			// then show service lines within radius
			const handleMoveEnd = () => {
				if (!mapState.map) return;
				if (!mapState.map.getLayer('service-lines')) return;

				// Find service lines within 500 feet
				const radiusInFeet = 500;
				const radiusInMeters = radiusInFeet * 0.3048;
				// Always use the searched address for the radius center, not clicked dots
				const center = turf.point([search.searchedAddress!.long, search.searchedAddress!.lat]);

				// Create radius circle
				const radiusCircle = turf.circle(center, radiusInMeters, {
					steps: 64,
					units: 'meters'
				});

				// Add or update radius circle source and layer
				const radiusSourceId = 'radius-circle';
				const radiusLayerId = 'radius-circle-line';

				if (mapState.map.getSource(radiusSourceId)) {
					(mapState.map.getSource(radiusSourceId) as maplibregl.GeoJSONSource).setData(
						radiusCircle
					);
				} else {
					mapState.map.addSource(radiusSourceId, {
						type: 'geojson',
						data: radiusCircle
					});

					mapState.map.addLayer({
						id: radiusLayerId,
						type: 'line',
						source: radiusSourceId,
						layout: {},
						paint: {
							'line-color': COLORS.EARTH,
							'line-width': 2,
							'line-dasharray': [4, 4],
							'line-opacity': 0.6
						}
					});
				}

				const nearbyServiceLines = findServiceLinesWithinRadius(
					search.searchedAddress!.long,
					search.searchedAddress!.lat,
					radiusInFeet
				);

				// Create filter expression to show only nearby service lines
				if (nearbyServiceLines.length > 0) {
					const rowIds = nearbyServiceLines.map((p) => p.row);
					mapState.map.setFilter('service-lines', ['in', ['get', 'row'], ['literal', rowIds]]);

					// Show service lines layer
					mapState.map.setPaintProperty('service-lines', 'circle-opacity', 0.8);
					mapState.map.setPaintProperty('service-lines', 'circle-stroke-opacity', 0.9);

					// Store nearby service lines in state for click handling
					search.nearbyServiceLines = nearbyServiceLines;
				} else {
					// No service lines within radius
					mapState.map.setFilter('service-lines', ['==', ['get', 'row'], -1]); // Show nothing
					search.nearbyServiceLines = [];
				}

				// Remove the listener after it's triggered once
				mapState.map.off('moveend', handleMoveEnd);
			};

			// Add listener for when map movement ends
			mapState.map.on('moveend', handleMoveEnd);

			// Also check if map is already idle (not moving)
			if (!mapState.map.isMoving()) {
				handleMoveEnd();
			}
		} else {
			// Hide service lines immediately when no address is selected
			if (mapState.map.getLayer('service-lines')) {
				// Hide first, then clear filter to prevent flashing
				mapState.map.setPaintProperty('service-lines', 'circle-opacity', 0);
				mapState.map.setPaintProperty('service-lines', 'circle-stroke-opacity', 0);
				// Clear filter after hiding
				mapState.map.setFilter('service-lines', ['==', ['get', 'row'], -1]);
				// Clear nearby service lines and clicked service line
				search.nearbyServiceLines = [];
				search.clickedServiceLineRow = null;
				search.searchedAddress = null;
			}

			// Remove radius circle
			if (mapState.map.getLayer('radius-circle-line')) {
				mapState.map.removeLayer('radius-circle-line');
			}
			if (mapState.map.getSource('radius-circle')) {
				mapState.map.removeSource('radius-circle');
			}
		}
	});

	// Update service line dot stroke based on selection
	$effect(() => {
		if (!mapState.map || !serviceLayerReady) return;

		const layer = mapState.map.getLayer('service-lines');
		if (!layer) return;

		// Only the clicked service line gets visual changes, not the searched address
		const clickedRow = search.clickedServiceLineRow;

		// Update circle radius - searched address stays large, others normal
		// Use a single interpolate with case expressions inside for the values
		mapState.map.setPaintProperty('service-lines', 'circle-radius', [
			'interpolate',
			['linear'],
			['zoom'],
			10,
			[
				'case',
				['==', ['get', 'row'], search.searchedAddress?.row ?? -1],
				4, // Larger for searched at zoom 10
				2 // Normal size at zoom 10
			],
			16,
			[
				'case',
				['==', ['get', 'row'], search.searchedAddress?.row ?? -1],
				12, // Larger for searched at zoom 16
				8 // Normal size at zoom 16
			]
		]);

		// Update stroke width - only clicked dots get thicker stroke
		mapState.map.setPaintProperty('service-lines', 'circle-stroke-width', [
			'case',
			['==', ['get', 'row'], clickedRow ?? -1],
			3, // Thicker stroke for clicked
			1 // Normal stroke
		]);
	});
</script>

<svelte:window bind:innerWidth />
<main class="absolute inset-0 flex flex-col overflow-hidden font-sans">
	<div class="relative flex-1">
		<div id="map-container" class="relative h-full">
			<ExpandLegend />
			<Legend />
			<div class="absolute top-4 left-[3%] z-10 flex w-[94%] flex-col gap-2 sm:left-4 sm:w-[400px]">
				<div
					class="floating-panel scrollbar-thin scrollbar-position max-h-[60svh] overflow-y-auto p-3 sm:max-h-[calc(100vh-4rem)] sm:p-4"
				>
					<SearchPanel map={mapState.map} />
					{#if ui.creditsExpanded}
						<Credits />
					{/if}
				</div>
				<div class="flex justify-between">
					<ExpandCredits />
					<ExpandResources />
				</div>
				{#if ui.resourcesExpanded && !isTabletOrAbove}
					<div
						bind:this={resourcesPanelRef}
						class="floating-panel scrollbar-thin scrollbar-position max-h-[calc(50svh-8rem)] overflow-y-auto p-3"
					>
						<Resources />
					</div>
				{/if}
			</div>
			{#if ui.resourcesExpanded && isTabletOrAbove}
				<div
					class="floating-panel scrollbar-thin scrollbar-position absolute top-4 left-[calc(400px+2rem)] z-10 hidden h-fit max-h-[calc(50svh+2rem)] w-[320px] overflow-y-auto p-4 sm:block"
					bind:this={resourcesPanelRef}
				>
					<Resources />
				</div>
			{/if}
		</div>
	</div>
</main>
<div
	class="fixed bottom-6 left-[calc(3%+5rem)] z-10 flex items-center justify-center gap-2 sm:right-4 sm:bottom-14 sm:left-auto"
>
	<GristLogo />
	<WBEZLogo />
	<ICNLogo />
</div>

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
