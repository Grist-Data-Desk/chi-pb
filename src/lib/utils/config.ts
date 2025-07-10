import type { SourceSpecification, AddLayerObject } from 'maplibre-gl';
import { COLORS } from '$lib/utils/constants';
import { interpolateReds, interpolateBlues, interpolatePurples } from 'd3-scale-chromatic';
import { getQuantileColorExpression as getQuantileExpression } from '$lib/utils/quantiles';

export const DO_SPACES_URL = 'https://grist.nyc3.cdn.digitaloceanspaces.com';
export const PMTILES_PATH = 'chi-pb/data/pmtiles';
export const GEOJSON_PATH = 'chi-pb/data/geojson';
export const CSV_PATH = 'chi-pb/data/csv';
export const SEARCH_INDEX_PATH = 'chi-pb/data/search';
export const STYLES_PATH = 'chi-pb/styles';

// Chicago water service line categories based on OverallSL Code values
export const LEAD_STATUS_CATEGORIES = {
	L: 'Lead',
	GRR: 'Galvanized Requiring Replacement',
	U: 'Unknown',
	NL: 'Non-Lead'
};
export const CHOROPLETH_CATEGORIES = {
	pct_requires_replacement: 'Lead',
	pct_poverty: 'Poverty',
	pct_minority: 'Race'
};

export const SOURCE_CONFIG: Record<string, { id: string; config: SourceSpecification }> = {
	// Chicago water service line sources
	censusTracts: {
		id: 'census-tracts',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/chi-tracts-filled.pmtiles?v=${Date.now()}`
		}
	},
	communityAreas: {
		id: 'community-areas',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/chi-comm-areas.pmtiles?v=${Date.now()}`
		}
	}
	// Chicago water service line sources only
};

// Get color scale interpolator based on mode
export function getColorInterpolator(mode: string) {
	switch (mode) {
		case 'pct_poverty':
			return interpolateReds;
		case 'pct_minority':
			return interpolateBlues;
		case 'pct_requires_replacement':
			return interpolatePurples;
		default:
			return interpolatePurples;
	}
}

// Chicago-specific color expressions for choropleth visualization
export function getChoroplethColorExpression(mode: string) {
	const interpolator = getColorInterpolator(mode);
	const steps: [number, string][] = [];

	// Generate 10 color steps (0-90 by 10s)
	for (let i = 0; i <= 90; i += 10) {
		// Map percentage to 0.1-0.9 range for better color visibility
		const t = 0.1 + (i / 90) * 0.8;
		steps.push([i, interpolator(t)]);
	}

	const expression: any[] = ['case'];
	
	// Add null check first
	expression.push(['==', ['get', mode], null]);
	expression.push(COLORS.SMOG);
	
	// Add flag check for lead visualization
	if (mode === 'pct_requires_replacement') {
		expression.push(['==', ['get', 'flag'], 'TRUE']);
		expression.push(COLORS.SMOG);
	}
	
	// Add interpolation for non-null, non-flagged values
	expression.push(['interpolate', ['linear'], ['coalesce', ['get', mode], 0], ...steps.flat()]);
	
	return expression;
}

// Export the quantile-based color expression
export { getQuantileExpression };

// Legacy color expressions (removed - no longer needed)

export const LAYER_CONFIG: Record<string, AddLayerObject> = {
	// Chicago water service line layers
	censusTractsFill: {
		id: 'census-tracts-fill',
		source: 'census-tracts',
		type: 'fill',
		'source-layer': 'chi-tracts-filled',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'fill-color': COLORS.EARTH, // Default color, will be updated reactively
			'fill-opacity': 0.7
		}
	},
	censusTractsStroke: {
		id: 'census-tracts-stroke',
		source: 'census-tracts',
		type: 'line',
		'source-layer': 'chi-tracts-filled',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'line-color': '#ffffff',
			'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1.5],
			'line-opacity': 0.8
		}
	},
	communityAreasFill: {
		id: 'community-areas-fill',
		source: 'community-areas',
		type: 'fill',
		'source-layer': 'chi-comm-areas',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'none' // Initially hidden
		},
		paint: {
			'fill-color': COLORS.EARTH, // Default color, will be updated reactively
			'fill-opacity': 0.7
		}
	},
	communityAreasStroke: {
		id: 'community-areas-stroke',
		source: 'community-areas',
		type: 'line',
		'source-layer': 'chi-comm-areas',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'none' // Initially hidden
		},
		paint: {
			'line-color': '#ffffff',
			'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1.5],
			'line-opacity': 0.8
		}
	}
	// Legacy layers removed to prevent errors - sources don't exist in chi-pb bucket
	// projectsPoints: { ... }
	// reservationsPolygons: { ... }
	// reservationLabels: { ... }
};
