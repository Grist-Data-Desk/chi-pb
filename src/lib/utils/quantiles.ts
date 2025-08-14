import { schemeReds, schemeBlues, schemePurples } from 'd3-scale-chromatic';
import type { AggregationLevel, ChoroplethMode } from '$lib/types';
import { QUANTILE_DATA } from './quantile-data';
import { COLORS } from './constants';
import type { ExpressionSpecification } from 'maplibre-gl';

export interface QuantileData {
	values: number[];
	quantiles: number[];
	colors: readonly string[];
}

export function getColorScheme(mode: ChoroplethMode): readonly string[] {
	switch (mode) {
		case 'pct_minority':
			return schemePurples[9];
		case 'pct_poverty':
			return schemeBlues[9];
		case 'pct_requires_replacement':
			return schemeReds[9];
	}
}

export function fetchQuantileData(
	aggregationLevel: AggregationLevel,
	mode: ChoroplethMode
): QuantileData {
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
		quantiles: [1, 5, 20, 40, 60, 80, 95, 99],
		colors: getColorScheme(mode)
	};
}

export function getQuantileColorExpression(
	mode: string,
	quantiles: number[],
	colors: readonly string[]
): ExpressionSpecification[] {
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
