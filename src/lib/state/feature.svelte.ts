import { mapState } from '$lib/state/map.svelte';

import { LAYER_CONFIG } from '$lib/utils/config';

export const selectedFeature = $state<{ id: string | null }>({ id: null });

/**
 * Set the 'selected' feature state for the currently selected feature.
 * @param id - The id of the feature to select.
 * @param source - The source the feature belongs to.
 * @param sourceLayer - The source layer the feature belongs to.
 */
export function setSelectedFeatureState(id: string, source: string, sourceLayer: string) {
	selectedFeature.id = id;

	mapState.map?.setFeatureState(
		{
			source,
			sourceLayer,
			id
		},
		{
			selected: true
		}
	);
}

/**
 * Remove the 'selected' feature state from all sources.
 */
export function removeSelectedFeatureState() {
	// Remove the feature state on all sources.
	Object.values(LAYER_CONFIG).forEach((layer) => {
		if (selectedFeature.id && mapState.map) {
			mapState.map.removeFeatureState({
				source: layer.source,
				sourceLayer: layer['source-layer']!,
				id: selectedFeature.id
			});
		}
	});

	selectedFeature.id = null;
}
