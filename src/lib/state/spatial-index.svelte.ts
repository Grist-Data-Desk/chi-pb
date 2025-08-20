import KDBush from 'kdbush';
import * as turf from '@turf/turf';
import { DO_SPACES_URL, SEARCH_INDEX_PATH } from '$lib/utils/config';
import type { ServiceLineSpatialIndex, ServiceLinePoint, CombinedIndex } from '$lib/types';
import { combinedIndexStore } from '$lib/stores';

interface SpatialIndexState {
	isLoading: boolean;
	index: ServiceLineSpatialIndex | null;
	kdbush: KDBush | null;
	error: string | null;
}

// Create reactive state using Svelte 5 runes
let state = $state<SpatialIndexState>({
	isLoading: false,
	index: null,
	kdbush: null,
	error: null
});

// Load service lines spatial index
export async function loadServiceLineSpatialIndex(): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		console.log('Loading service lines spatial index...');
		const cacheBuster = Date.now();
		const indexUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/service-lines-spatial-index.json.br?v=${cacheBuster}`;
		const response = await fetch(indexUrl);

		if (!response.ok) {
			throw new Error(`Failed to load spatial index: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		let spatialIndex: ServiceLineSpatialIndex;

		try {
			// Try direct JSON parsing first
			const text = new TextDecoder().decode(arrayBuffer);
			spatialIndex = JSON.parse(text);
		} catch {
			// Fall back to uncompressed version
			console.warn('Falling back to uncompressed spatial index');
			const fallbackUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/service-lines-spatial-index.json?v=${cacheBuster}`;
			const fallbackResponse = await fetch(fallbackUrl);
			if (!fallbackResponse.ok) {
				throw new Error('Failed to load fallback spatial index');
			}
			const text = await fallbackResponse.text();
			spatialIndex = JSON.parse(text);
		}

		// Build KDBush spatial index
		// KDBush expects: new KDBush(numItems, nodeSize, ArrayType)
		// Then you call kdbush.add(x, y) for each point
		const kdbush = new KDBush(spatialIndex.points.length, 64, Float32Array);

		// Add all points to the index
		for (const point of spatialIndex.points) {
			kdbush.add(point.long, point.lat);
		}

		// Finish building the index
		kdbush.finish();

		state.index = spatialIndex;
		state.kdbush = kdbush;
		state.isLoading = false;

		console.log(`✓ Service lines spatial index loaded: ${spatialIndex.points.length} points`);
		console.log(`  Generated: ${spatialIndex.metadata.generatedAt}`);
		console.log(`  Version: ${spatialIndex.metadata.version}`);
	} catch (error) {
		console.error('Error loading service lines spatial index:', error);
		state.error = error instanceof Error ? error.message : 'Failed to load spatial index';
		state.isLoading = false;
	}
}

// Find service lines within radius of a point
export function findServiceLinesWithinRadius(
	centerLng: number,
	centerLat: number,
	radiusInFeet: number
): ServiceLinePoint[] {
	if (!state.kdbush || !state.index) {
		return [];
	}

	const radiusInMeters = radiusInFeet * 0.3048;
	const center = turf.point([centerLng, centerLat]);

	// Use KDBush to find points within a bounding box first
	// This is an approximation to reduce the number of distance calculations
	const km = radiusInMeters / 1000;
	const degreesDelta = km / 111; // Rough approximation

	const indices = state.kdbush.range(
		centerLng - degreesDelta,
		centerLat - degreesDelta,
		centerLng + degreesDelta,
		centerLat + degreesDelta
	);

	// Filter to exact radius using Turf.js
	const pointsWithinRadius: ServiceLinePoint[] = [];

	for (const idx of indices) {
		const point = state.index.points[idx];
		const pointFeature = turf.point([point.long, point.lat]);
		const distance = turf.distance(center, pointFeature, { units: 'meters' });

		if (distance <= radiusInMeters) {
			pointsWithinRadius.push(point);
		}
	}

	return pointsWithinRadius;
}

// Build spatial index from combined index data
export function buildSpatialIndexFromCombined(combinedIndex: CombinedIndex): void {
	try {
		console.log('Building spatial index from combined data...');

		// Convert combined addresses to service line points
		const points: ServiceLinePoint[] = combinedIndex.addresses.map((addr) => ({
			row: addr.r,
			lat: addr.la,
			long: addr.lo,
			material: addr.m
		}));

		// Build KDBush spatial index
		const kdbush = new KDBush(points.length, 64, Float32Array);

		// Add all points to the index
		for (const point of points) {
			kdbush.add(point.long, point.lat);
		}

		// Finish building the index
		kdbush.finish();

		// Create spatial index object
		const spatialIndex: ServiceLineSpatialIndex = {
			points,
			metadata: {
				totalPoints: points.length,
				generatedAt: combinedIndex.metadata.generatedAt,
				version: combinedIndex.metadata.version
			}
		};

		state.index = spatialIndex;
		state.kdbush = kdbush;
		state.isLoading = false;
		state.error = null;

		console.log(`✓ Spatial index built from combined data: ${points.length} points`);
	} catch (error) {
		console.error('Error building spatial index from combined data:', error);
		state.error = error instanceof Error ? error.message : 'Failed to build spatial index';
		state.isLoading = false;
	}
}

// Export reactive getters
export const spatialIndex = {
	get isLoading() {
		return state.isLoading;
	},
	get index() {
		return state.index;
	},
	get kdbush() {
		return state.kdbush;
	},
	get error() {
		return state.error;
	},
	get isReady() {
		return !state.isLoading && state.index !== null && state.kdbush !== null;
	}
};
