import { schemeReds, schemeBlues, schemePurples } from 'd3-scale-chromatic';
import { QUANTILE_DATA } from './quantile-data';
import { COLORS } from './constants';

export interface QuantileData {
	values: number[];
	quantiles: number[];
	colors: readonly string[];
}

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

export async function fetchQuantileData(
	aggregationLevel: 'tract' | 'community',
	mode: string
): Promise<QuantileData> {
	const key = `${aggregationLevel}-${mode}`;
	const data = QUANTILE_DATA[key as keyof typeof QUANTILE_DATA];

	if (data) {
		return {
			values: [],
			quantiles: [...data.quantiles],
			colors: getColorScheme(mode)
		};
	}

	console.warn(`No quantile data found for ${key}`);
	return {
		values: [],
		quantiles: [20, 40, 60, 80],
		colors: getColorScheme(mode)
	};
}

export function getQuantileColorExpression(
	mode: string,
	quantiles: number[],
	colors: readonly string[]
): any[] {
	const expression: any[] = ['case'];

	expression.push(['==', ['get', mode], null]);
	expression.push(COLORS.SMOG); // Smog color for null values

	if (mode === 'pct_requires_replacement') {
		expression.push(['==', ['get', 'flag'], 'TRUE']);
		expression.push(COLORS.SMOG); // Smog color for flagged areas
	}

	for (let i = 0; i < quantiles.length; i++) {
		expression.push(['<', ['get', mode], quantiles[i]]);
		expression.push(colors[i]);
	}

	expression.push(colors[colors.length - 1]);

	return expression;
}

export function formatQuantileValue(value: number): string {
	return `${Math.round(value)}%`;
}
