import type { SourceSpecification, AddLayerObject } from 'maplibre-gl';
import { COLORS } from '$lib/utils/constants';

export const DO_SPACES_URL = 'https://grist.nyc3.cdn.digitaloceanspaces.com';
export const PMTILES_PATH = 'chi-pb/data/pmtiles';
export const GEOJSON_PATH = 'chi-pb/data/geojson';
export const CSV_PATH = 'chi-pb/data/csv';
export const SEARCH_INDEX_PATH = 'chi-pb/data/search';
export const STYLES_PATH = 'chi-pb/styles';

const colorOrder = [
	COLORS.ORANGE,
	COLORS.COBALT,
	COLORS.TURQUOISE,
	COLORS.TEAL,
	COLORS.FUCHSIA,
	COLORS.RED,
	COLORS.GOLD
];

// Legacy categories (to be removed after refactoring)
const LEGACY_CATEGORIES = {
	agency: [
		'Department of Transportation',
		'Department of Agriculture',
		'Environmental Protection Agency',
		'Department of Energy',
		'Department of Homeland Security',
		'Department of the Interior'
	],
	category: [
		'Transportation',
		'Clean Energy, Buildings, and Manufacturing',
		'Resilience',
		'Clean Water',
		'Environmental Remediation',
		'Broadband'
	],
	fundingSource: ['IRA', 'BIL']
};

// Chicago water service line categories based on OverallSL Code values
export const LEAD_STATUS_CATEGORIES = {
	'L': 'Lead',
	'GRR': 'Galvanized Requiring Replacement',
	'U': 'Unknown',
	'NL': 'Non-Lead'
};
export const CHOROPLETH_CATEGORIES = {
	median_household_income: 'Median Household Income',
	pct_black: 'Percent Black',
	pct_minority: 'Percent Minority', 
	pct_poverty: 'Percent in Poverty'
};

export const SOURCE_CONFIG: Record<string, { id: string; config: SourceSpecification }> = {
	// Chicago water service line sources
	censusTracts: {
		id: 'census-tracts',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/chi-acs-filled.pmtiles?v=${Date.now()}`
		}
	},
	addresses: {
		id: 'addresses',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/geocoded-addresses.pmtiles?v=${Date.now()}`
		}
	}
	// Legacy sources removed to prevent 403 errors - these files don't exist in chi-pb bucket
	// projects: { ... }
	// reservations: { ... } 
	// reservationLabels: { ... }
};

// Legacy color expression function
function createColorExpression(field: string, categories: string[]) {
	return [
		'match',
		['get', field],
		...categories.map((name, i) => [name, colorOrder[i]]).flat(),
		COLORS.EARTH
	] as any;
}

// Chicago-specific color expressions for choropleth visualization
export function getChoroplethColorExpression(mode: string) {
	switch (mode) {
		case 'median_household_income':
			return [
				'case',
				['!=', ['get', 'median_household_income'], null],
				[
					'interpolate',
					['linear'],
					['coalesce', ['get', 'median_household_income'], 0],
					0, COLORS.RED,
					50000, COLORS.GOLD,
					100000, COLORS.TURQUOISE,
					150000, COLORS.COBALT
				],
				COLORS.EARTH // fallback for null values
			] as any;
		case 'pct_black':
			return [
				'case',
				['!=', ['get', 'pct_black'], null],
				[
					'interpolate',
					['linear'],
					['coalesce', ['get', 'pct_black'], 0],
					0, COLORS.EARTH,
					25, COLORS.ORANGE,
					50, COLORS.RED,
					100, COLORS.FUCHSIA
				],
				COLORS.EARTH // fallback for null values
			] as any;
		case 'pct_minority':
			return [
				'case',
				['!=', ['get', 'pct_minority'], null],
				[
					'interpolate',
					['linear'],
					['coalesce', ['get', 'pct_minority'], 0],
					0, COLORS.EARTH,
					25, COLORS.GOLD,
					50, COLORS.ORANGE,
					100, COLORS.RED
				],
				COLORS.EARTH // fallback for null values
			] as any;
		case 'pct_poverty':
			return [
				'case',
				['!=', ['get', 'pct_poverty'], null],
				[
					'interpolate',
					['linear'],
					['coalesce', ['get', 'pct_poverty'], 0],
					0, COLORS.TURQUOISE,
					10, COLORS.GOLD,
					20, COLORS.ORANGE,
					40, COLORS.RED
				],
				COLORS.EARTH // fallback for null values
			] as any;
		default:
			return COLORS.EARTH;
	}
}

// Address point color expression based on OverallSL Code from inventory data
export function getAddressColorExpression() {
	return [
		'match',
		['get', 'overallSLCode'],
		'L', COLORS.RED,        // Lead service line
		'GRR', COLORS.ORANGE,   // Galvanized Requiring Replacement
		'U', COLORS.GOLD,       // Unknown status
		'NL', COLORS.TURQUOISE, // Non-lead service line
		COLORS.EARTH            // Default for null/missing values
	] as any;
}

// Legacy color expressions (to be removed after refactoring)
export function getCurrentColorExpressions() {
	return {
		agency: createColorExpression('Agency Name', LEGACY_CATEGORIES.agency),
		category: createColorExpression('Category', LEGACY_CATEGORIES.category),
		fundingSource: createColorExpression('Funding Source', LEGACY_CATEGORIES.fundingSource)
	};
}

export const LAYER_CONFIG: Record<string, AddLayerObject> = {
	// Chicago water service line layers
	censusTractsFill: {
		id: 'census-tracts-fill',
		source: 'census-tracts',
		type: 'fill',
		'source-layer': 'chi-acs-filled',
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
		'source-layer': 'chi-acs-filled',
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
	addressesPoints: {
		id: 'addresses-points',
		source: 'addresses',
		type: 'circle',
		'source-layer': 'geocoded-addresses',
		minzoom: 12,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 18, 8],
			'circle-color': getAddressColorExpression(),
			'circle-stroke-width': 1,
			'circle-stroke-color': '#ffffff',
			'circle-opacity': 0.8
		}
	}
	// Legacy layers removed to prevent errors - sources don't exist in chi-pb bucket
	// projectsPoints: { ... }
	// reservationsPolygons: { ... }
	// reservationLabels: { ... }
};
