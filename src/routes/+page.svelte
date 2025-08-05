<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import * as pmtiles from 'pmtiles';
	import * as turf from '@turf/turf';
	import { onMount } from 'svelte';

	import { Popup } from '$lib/classes/Popup';
	import { ResetViewControl } from '$lib/classes/ResetViewControl';
	import Credits from '$lib/components/credits/Credits.svelte';
	import ExpandLegend from '$lib/components/legend/ExpandLegend.svelte';
	import Legend from '$lib/components/legend/Legend.svelte';
	import SearchPanel from '$lib/components/search/SearchPanel.svelte';
	import { mapState } from '$lib/state/map.svelte';
	import { popup } from '$lib/state/popup.svelte';
	import { search } from '$lib/state/search.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import { spatialIndex, loadServiceLineSpatialIndex, findServiceLinesWithinRadius, buildSpatialIndexFromCombined } from '$lib/state/spatial-index.svelte';
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

	// State.
	let innerWidth = $state<number>(0);
	let isTabletOrAbove = $derived(innerWidth > TABLET_BREAKPOINT);

	onMount(() => {
		const protocol = new pmtiles.Protocol();
		maplibregl.addProtocol('pmtiles', protocol.tile);
		
		// Load combined index and build spatial index from it
		loadCombinedIndex().then(() => {
			const combinedIndex = $combinedIndexStore.index;
			if (combinedIndex) {
				buildSpatialIndexFromCombined(combinedIndex);
			}
		}).catch(() => {
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
			popup.node = new Popup(map);

			if (!isTabletOrAbove) {
				const attrib = document.querySelector('.maplibregl-ctrl-attrib');
				attrib?.classList.remove('maplibregl-compact-show');
				attrib?.removeAttribute('open');
			}
		});

		// Add click handlers for Census tracts and Community areas.
		mapState.map.on('click', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel !== 'tract' || !e.features?.length) return;
			
			// Don't show popup if an address is selected
			if (search.selectedAddress) return;

			const feature = e.features[0];
			const tractProperties = feature.properties;

			if (tractProperties && tractProperties.geoid) {
				const lngLat = e.lngLat;
				if (popup.node) {
					popup.node.showPopup(lngLat, tractProperties as any);
				}
			}
		});

		mapState.map.on('click', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel !== 'community' || !e.features?.length) return;
			
			// Don't show popup if an address is selected
			if (search.selectedAddress) return;

			const feature = e.features[0];
			const communityProperties = feature.properties;

			if (communityProperties && communityProperties.community) {
				const lngLat = e.lngLat;
				if (popup.node) {
					popup.node.showPopup(lngLat, communityProperties as any);
				}
			}
		});

		// Add mouseenter and mouseleave handlers for Census tracts and Community areas.
		mapState.map.on('mouseenter', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel === 'tract' && !search.selectedAddress) {
				const map = e.target;
				map.getCanvas().style.cursor = 'pointer';
			}
		});

		mapState.map.on('mouseleave', LAYER_CONFIG.censusTractsFill.id, (e) => {
			if (visualization.aggregationLevel === 'tract') {
				const map = e.target;
				map.getCanvas().style.cursor = '';
			}
		});

		mapState.map.on('mouseenter', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel === 'community' && !search.selectedAddress) {
				const map = e.target;
				map.getCanvas().style.cursor = 'pointer';
			}
		});

		mapState.map.on('mouseleave', LAYER_CONFIG.communityAreasFill.id, (e) => {
			if (visualization.aggregationLevel === 'community') {
				const map = e.target;
				map.getCanvas().style.cursor = '';
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

		return () => {
			if (mapState.map) {
				mapState.map.remove();
			}
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
					(mapState.map.getSource(radiusSourceId) as maplibregl.GeoJSONSource).setData(radiusCircle);
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
					const rowIds = nearbyServiceLines.map(p => p.row);
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

	// Update service line dot sizes based on selection
	$effect(() => {
		if (!mapState.map || !mapState.map.getLayer('service-lines')) return;
		
		const selectedRow = search.clickedServiceLineRow ?? search.selectedAddress?.row;
		
		// Update circle radius to show selected state
		mapState.map.setPaintProperty('service-lines', 'circle-radius', [
			'case',
			['==', ['get', 'row'], selectedRow ?? -1],
			['interpolate', ['linear'], ['zoom'], 10, 4, 16, 12], // Larger for selected
			['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8]   // Normal size
		]);
		
		// Update stroke width for selected
		mapState.map.setPaintProperty('service-lines', 'circle-stroke-width', [
			'case',
			['==', ['get', 'row'], selectedRow ?? -1],
			2, // Thicker stroke for selected
			1  // Normal stroke
		]);
	});
</script>

<svelte:window bind:innerWidth />
<main class="absolute inset-0 flex flex-col overflow-hidden font-sans">
	<div class="relative flex-1">
		<div id="map-container" class="relative h-full">
			<ExpandLegend />
			<Legend />
			<div class="floating-panel absolute top-4 left-[3%] z-10 w-[94%] p-4 md:left-4 md:w-[400px]">
				<SearchPanel map={mapState.map} />
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
