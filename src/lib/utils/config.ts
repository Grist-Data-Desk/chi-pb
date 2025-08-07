import type {
	FillLayerSpecification,
	LineLayerSpecification,
	CircleLayerSpecification,
	SourceSpecification
} from 'maplibre-gl';

import { COLORS, SERVICE_LINE_COLOR_EXPRESSION } from '$lib/utils/constants';

export const DO_SPACES_URL = 'https://grist.nyc3.cdn.digitaloceanspaces.com';
export const PMTILES_PATH = 'chi-pb/data/pmtiles';
export const GEOJSON_PATH = 'chi-pb/data/geojson';
export const CSV_PATH = 'chi-pb/data/csv';
export const SEARCH_INDEX_PATH = 'chi-pb/data/search';
export const STYLES_PATH = 'chi-pb/styles';

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

export const INITIAL_MOBILE_CENTER = [-87.7, 42.02] as [number, number];
export const INITIAL_CENTER = [-87.7298, 41.84] as [number, number];
export const INITIAL_MOBILE_ZOOM = 9;
export const INITIAL_ZOOM = 10;

export const SOURCE_CONFIG: Record<string, { id: string; config: SourceSpecification }> = {
	censusTracts: {
		id: 'census-tracts',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/chi-tracts-filled.pmtiles?v=${Date.now()}`,
			promoteId: 'geoid'
		}
	},
	communityAreas: {
		id: 'community-areas',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/chi-comm-areas.pmtiles?v=${Date.now()}`,
			promoteId: 'community'
		}
	},
	serviceLines: {
		id: 'service-lines',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/service-lines.pmtiles?v=${Date.now()}`
		}
	}
};

export const LAYER_CONFIG: Record<
	string,
	FillLayerSpecification | LineLayerSpecification | CircleLayerSpecification
> = {
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
			'fill-color': COLORS.EARTH,
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
			'line-width': [
				'interpolate',
				['linear'],
				['zoom'],
				8,
				['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.25],
				12,
				['case', ['boolean', ['feature-state', 'selected'], false], 3, 1]
			],
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
			visibility: 'visible'
		},
		paint: {
			'fill-color': COLORS.EARTH,
			'fill-opacity': 0
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
			visibility: 'visible'
		},
		paint: {
			'line-color': '#ffffff',
			'line-width': [
				'interpolate',
				['linear'],
				['zoom'],
				8,
				['case', ['boolean', ['feature-state', 'selected'], false], 1, 0.25],
				12,
				['case', ['boolean', ['feature-state', 'selected'], false], 3, 1]
			],
			'line-opacity': 0
		}
	},
	serviceLines: {
		id: 'service-lines',
		source: 'service-lines',
		type: 'circle',
		'source-layer': 'service-lines',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8],
			'circle-color': SERVICE_LINE_COLOR_EXPRESSION,
			'circle-opacity': 0,
			'circle-stroke-width': 1,
			'circle-stroke-color': '#ffffff',
			'circle-stroke-opacity': 0
		}
	}
};
