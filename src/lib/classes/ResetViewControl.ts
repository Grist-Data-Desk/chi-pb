import type { IControl } from 'maplibre-gl';

import { popup } from '$lib/state/popup.svelte';
import { search } from '$lib/state/search.svelte';
import { ui } from '$lib/state/ui.svelte';
import {
	INITIAL_CENTER,
	INITIAL_MOBILE_CENTER,
	INITIAL_ZOOM,
	INITIAL_MOBILE_ZOOM
} from '$lib/utils/config';

export class ResetViewControl implements IControl {
	private isTabletOrAbove: boolean;

	constructor(options: { isTabletOrAbove: boolean }) {
		this.isTabletOrAbove = options.isTabletOrAbove;
	}

	onAdd(map: maplibregl.Map) {
		const btn = document.createElement('button');
		btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-geolocate';
		btn.innerHTML = '🔄';

		btn.addEventListener('click', () => {
			map.flyTo({
				center: this.isTabletOrAbove ? INITIAL_CENTER : INITIAL_MOBILE_CENTER,
				zoom: this.isTabletOrAbove ? INITIAL_ZOOM : INITIAL_MOBILE_ZOOM
			});

			// Reset the search state.
			search.query = '';
			search.isSearching = false;
			search.results = [];
			search.selectedAddress = null;
			search.searchedAddress = null;
			search.clickedServiceLineRow = null;
			search.nearbyServiceLines = [];

			// Reset the UI state.
			ui.searchHeaderCollapsed = false;
			ui.creditsExpanded = true;

			// Do not reset the visualization state for the legend - let users keep
			// their choropleth mode selection.
			if (map.getLayer('selected-address-highlight')) {
				map.removeLayer('selected-address-highlight');
			}

			if (map.getSource('selected-address')) {
				map.removeSource('selected-address');
			}

			if (popup.node) {
				popup.node.removePopup();
			}

			// Remove radius circle
			if (map.getLayer('radius-circle-line')) {
				map.removeLayer('radius-circle-line');
			}
			if (map.getSource('radius-circle')) {
				map.removeSource('radius-circle');
			}

			// Hide and reset service lines
			if (map.getLayer('service-lines')) {
				map.setPaintProperty('service-lines', 'circle-opacity', 0);
				map.setPaintProperty('service-lines', 'circle-stroke-opacity', 0);
				map.setFilter('service-lines', ['==', ['get', 'row'], -1]);
			}
		});

		const container = document.createElement('div');
		container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
		container.appendChild(btn);

		return container;
	}

	onRemove() {}
}
