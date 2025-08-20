import { schemeReds, schemeBlues, schemePurples } from 'd3-scale-chromatic';
import type { AggregationLevel, ChoroplethMode } from '$lib/types';
import { QUANTILE_DATA } from './quantile-data';
import { COLORS } from './constants';
import type { ExpressionSpecification } from 'maplibre-gl';

const MAX_COLORS = 9;

export interface QuantileData {
	values: number[];
	quantiles: number[];
	colors: readonly string[];
	dedupedQuantiles?: number[];
	dedupedColors?: readonly string[];
	flexValues?: number[];
}

export function getColorScheme(
	mode: ChoroplethMode,
	count: number = MAX_COLORS
): readonly string[] {
	switch (mode) {
		case 'pct_minority':
			return schemePurples[count];
		case 'pct_poverty':
			return schemeBlues[count];
		case 'pct_requires_replacement':
			return schemeReds[count];
	}
}

function deduplicateQuantiles(quantiles: number[]): {
	dedupedQuantiles: number[];
	flexValues: number[];
} {
	// The percentile ranges for each box
	const percentileRanges = [
		1, // 0-1
		4, // 1-5
		15, // 5-20
		20, // 20-40
		20, // 40-60
		20, // 60-80
		15, // 80-95
		4, // 95-99
		1 // 99-100
	];

	const dedupedQuantiles: number[] = [];
	const flexValues: number[] = [];
	const tolerance = 0.01;

	// Track which box we're currently processing
	let currentBoxIndex = 0;

	// Process each quantile
	let i = 0;
	while (i < quantiles.length) {
		// Find consecutive equal quantiles
		let j = i;
		while (j < quantiles.length - 1 && Math.abs(quantiles[j] - quantiles[j + 1]) < tolerance) {
			j++;
		}

		// Add the unique quantile value
		dedupedQuantiles.push(quantiles[i]);

		// If we found duplicates (j > i), combine the corresponding boxes
		if (j > i) {
			// When quantiles[i] through quantiles[j] are equal,
			// we need to combine boxes from (i+1) through (j+1)
			let combinedFlex = 0;
			for (let boxIdx = i + 1; boxIdx <= j + 1 && boxIdx < percentileRanges.length; boxIdx++) {
				combinedFlex += percentileRanges[boxIdx];
			}

			// Add the box before the duplicate group
			flexValues.push(percentileRanges[currentBoxIndex]);
			currentBoxIndex++;

			// Add the combined box (if it exists)
			if (combinedFlex > 0) {
				flexValues.push(combinedFlex);
				currentBoxIndex = j + 2; // Skip past the combined boxes
			}

			i = j + 1;
		} else {
			// No duplicates, just add the current box
			flexValues.push(percentileRanges[currentBoxIndex]);
			currentBoxIndex++;
			i++;
		}
	}

	// Add any remaining boxes (including the last box if needed)
	while (currentBoxIndex < percentileRanges.length) {
		flexValues.push(percentileRanges[currentBoxIndex]);
		currentBoxIndex++;
	}

	return { dedupedQuantiles, flexValues };
}

export function fetchQuantileData(
	aggregationLevel: AggregationLevel,
	mode: ChoroplethMode
): QuantileData {
	const key = `${aggregationLevel}-${mode}`;
	const data = QUANTILE_DATA[key as keyof typeof QUANTILE_DATA];

	if (data) {
		const quantiles = [...data.quantiles];
		const { dedupedQuantiles, flexValues } = deduplicateQuantiles(quantiles);
		const colorCount = flexValues.length;
		const colors = getColorScheme(mode, Math.min(colorCount, MAX_COLORS));

		return {
			values: [],
			quantiles,
			colors: getColorScheme(mode, MAX_COLORS), // Original colors for the expression
			dedupedQuantiles,
			dedupedColors: colors,
			flexValues
		};
	}

	console.warn(`No quantile data found for ${key}`);
	const quantiles = [1, 5, 20, 40, 60, 80, 95, 99];
	const { dedupedQuantiles, flexValues } = deduplicateQuantiles(quantiles);
	const colorCount = flexValues.length;
	const colors = getColorScheme(mode, Math.min(colorCount, MAX_COLORS));

	return {
		values: [],
		quantiles,
		colors: getColorScheme(mode, MAX_COLORS),
		dedupedQuantiles,
		dedupedColors: colors,
		flexValues
	};
}

export function getQuantileColorExpression(
	mode: string,
	quantiles: number[],
	colors: readonly string[]
): ExpressionSpecification[] {
	const expression: any[] = ['case'];

	// Handle null values
	expression.push(['==', ['get', mode], null]);
	expression.push('transparent');

	// Handle undefined/NaN values (when property doesn't exist or is NaN)
	expression.push(['!', ['has', mode]]);
	expression.push('transparent');

	// Only apply flag filter for pct_requires_replacement
	if (mode === 'pct_requires_replacement') {
		expression.push(['==', ['get', 'flag'], true]);
		expression.push('transparent'); // transparent flagged areas
	}

	for (let i = 0; i < quantiles.length; i++) {
		expression.push(['<', ['get', mode], quantiles[i]]);
		expression.push(colors[i]);
	}

	expression.push(colors[colors.length - 1]);

	return expression;
}

export function formatQuantileValue(value: number): string {
	const rounded = Math.round(value);
	// If rounding would produce 100%, keep the original value if it's less than 100
	if (rounded === 100 && value < 100) {
		return `${value.toFixed(1)}%`;
	}
	return `${rounded}%`;
}
