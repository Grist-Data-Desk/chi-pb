<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import * as pmtiles from 'pmtiles';
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
	import { TABLET_BREAKPOINT } from '$lib/utils/constants';
	import { fetchQuantileData, getQuantileColorExpression } from '$lib/utils/quantiles';

	// State.
	let innerWidth = $state<number>(0);
	let isTabletOrAbove = $derived(innerWidth > TABLET_BREAKPOINT);

	onMount(() => {
		const protocol = new pmtiles.Protocol();
		maplibregl.addProtocol('pmtiles', protocol.tile);

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
			if (visualization.aggregationLevel === 'tract') {
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
			if (visualization.aggregationLevel === 'community') {
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
