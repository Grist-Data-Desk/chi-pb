import type { AggregationLevel, ChoroplethMode } from '$lib/types';

interface VisualizationState {
	aggregationLevel: AggregationLevel;
	choroplethMode: ChoroplethMode;
	selectedTract: string | null;
	showAddresses: boolean;
}

export const visualization = $state<VisualizationState>({
	aggregationLevel: 'community',
	choroplethMode: 'pct_requires_replacement',
	selectedTract: null,
	showAddresses: true
});
