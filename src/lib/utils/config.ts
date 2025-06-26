import type { SourceSpecification, AddLayerObject } from 'maplibre-gl';
import { COLORS } from '$lib/utils/constants';

export const DO_SPACES_URL = 'https://grist.nyc3.cdn.digitaloceanspaces.com';
export const PMTILES_PATH = 'chi-pb/data/pmtiles';
export const GEOJSON_PATH = 'chi-pb/data/geojson';
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

// Chicago water service line categories
export const LEAD_STATUS_CATEGORIES = ['LEAD', 'NON_LEAD', 'UNKNOWN'];
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
	},
	// Legacy sources (to be removed after refactoring)
	projects: {
		id: 'projects',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/projects.pmtiles?v=${Date.now()}`
		}
	},
	reservations: {
		id: 'reservations',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/reservations.pmtiles?v=${Date.now()}`
		}
	},
	reservationLabels: {
		id: 'reservation-labels',
		config: {
			type: 'vector',
			url: `pmtiles://${DO_SPACES_URL}/${PMTILES_PATH}/reservation-labels.pmtiles?v=${Date.now()}`
		}
	}
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
				'interpolate',
				['linear'],
				['get', 'median_household_income'],
				0, COLORS.RED,
				50000, COLORS.GOLD,
				100000, COLORS.TURQUOISE,
				150000, COLORS.COBALT
			] as any;
		case 'pct_black':
			return [
				'interpolate',
				['linear'],
				['get', 'pct_black'],
				0, COLORS.EARTH,
				25, COLORS.ORANGE,
				50, COLORS.RED,
				100, COLORS.FUCHSIA
			] as any;
		case 'pct_minority':
			return [
				'interpolate',
				['linear'],
				['get', 'pct_minority'],
				0, COLORS.EARTH,
				25, COLORS.GOLD,
				50, COLORS.ORANGE,
				100, COLORS.RED
			] as any;
		case 'pct_poverty':
			return [
				'interpolate',
				['linear'],
				['get', 'pct_poverty'],
				0, COLORS.TURQUOISE,
				10, COLORS.GOLD,
				20, COLORS.ORANGE,
				40, COLORS.RED
			] as any;
		default:
			return COLORS.EARTH;
	}
}

// Address point color expression based on lead status
export function getAddressColorExpression() {
	return [
		'match',
		['get', 'leadStatus'],
		'LEAD', COLORS.RED,
		'NON_LEAD', COLORS.TURQUOISE,
		'UNKNOWN', COLORS.GOLD,
		COLORS.EARTH
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
			'fill-color': getChoroplethColorExpression('median_household_income'),
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
	},
	// Legacy layers (to be removed after refactoring)
	projectsPoints: {
		id: 'projects-points',
		source: 'projects',
		type: 'circle',
		'source-layer': 'projects',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 22, 12],
			'circle-color': createColorExpression('Funding Source', LEGACY_CATEGORIES.fundingSource),
			'circle-stroke-width': 2,
			'circle-stroke-color': '#ffffff',
			'circle-opacity': 0.7
		}
	},
	reservationsPolygons: {
		id: 'reservations-polygons',
		source: 'reservations',
		type: 'fill',
		'source-layer': 'reservations',
		minzoom: 0,
		maxzoom: 22,
		layout: {
			visibility: 'visible'
		},
		paint: {
			'fill-color': COLORS.GREEN,
			'fill-opacity': 0.2
		}
	},
	reservationLabels: {
		id: 'reservation-labels',
		source: 'reservation-labels',
		type: 'symbol',
		'source-layer': 'reservation-labels',
		minzoom: 6,
		maxzoom: 22,
		layout: {
			'text-field': ['concat', ['get', 'reservation_name'], ' Reservation'],
			'text-font': ['Basis Grotesque Pro Italic'],
			'text-size': ['interpolate', ['linear'], ['zoom'], 6, 12, 12, 16],
			'text-max-width': 7,
			'text-letter-spacing': 0.1
		},
		paint: {
			'text-color': COLORS.GREEN,
			'text-halo-color': 'hsla(0, 0%, 100%, 0.85)',
			'text-halo-width': 1.5
		}
	}
};
