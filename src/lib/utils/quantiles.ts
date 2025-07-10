import { schemeReds, schemeBlues, schemePurples } from 'd3-scale-chromatic';
import { QUANTILE_DATA } from './quantile-data';
import { COLORS } from './constants';

export interface QuantileData {
	values: number[];
	quantiles: number[];
	colors: readonly string[];
}

// Get color scheme based on mode
export function getColorScheme(mode: string): readonly string[] {
	switch (mode) {
		case 'pct_poverty':
			return schemeReds[5];
		case 'pct_minority':
			return schemeBlues[5];
		case 'pct_requires_replacement':
			return schemePurples[5];
		default:
			return schemePurples[5];
	}
}

// Get quantile data from pre-calculated values
export async function fetchQuantileData(
	aggregationLevel: 'tract' | 'community',
	mode: string
): Promise<QuantileData> {
	const key = `${aggregationLevel}-${mode}`;
	const data = QUANTILE_DATA[key as keyof typeof QUANTILE_DATA];

	if (data) {
		return {
			values: [], // We don't store the full values array to save space
			quantiles: [...data.quantiles],
			colors: getColorScheme(mode)
		};
	}

	// Return default data if not found
	console.warn(`No quantile data found for ${key}`);
	return {
		values: [],
		quantiles: [20, 40, 60, 80],
		colors: getColorScheme(mode)
	};
}

// Get quantile color expression for MapLibre
export function getQuantileColorExpression(
	mode: string,
	quantiles: number[],
	colors: readonly string[]
): any[] {
	const expression: any[] = ['case'];

	// Add null check
	expression.push(['==', ['get', mode], null]);
	expression.push(COLORS.SMOG); // Smog color for null values

	// Add flag check for lead visualization
	if (mode === 'pct_requires_replacement') {
		expression.push(['==', ['get', 'flag'], 'TRUE']);
		expression.push(COLORS.SMOG); // Smog color for flagged areas
	}

	// Add quantile steps
	for (let i = 0; i < quantiles.length; i++) {
		expression.push(['<', ['get', mode], quantiles[i]]);
		expression.push(colors[i]);
	}

	// Final color for values above all quantiles
	expression.push(colors[colors.length - 1]);

	return expression;
}

// Format quantile value for display
export function formatQuantileValue(value: number): string {
	return `${Math.round(value)}%`;
}
