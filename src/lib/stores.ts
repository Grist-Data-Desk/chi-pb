import { writable, derived } from 'svelte/store';
import KDBush from 'kdbush';

import { DO_SPACES_URL, SEARCH_INDEX_PATH } from '$lib/utils/config';
import type {
	AddressWithServiceLine,
	IndexedAddressCollection,
	MinimalSearchIndex,
	InventoryData,
	ServiceLineSpatialIndex,
	CombinedIndex
} from '$lib/types';

// Minimal search index store for optimized address search
export const minimalSearchIndexStore = writable<{
	isLoading: boolean;
	index: MinimalSearchIndex | null;
	error: string | null;
}>({
	isLoading: false,
	index: null,
	error: null
});

// Combined index store (search + spatial data)
export const combinedIndexStore = writable<{
	isLoading: boolean;
	index: CombinedIndex | null;
	error: string | null;
}>({
	isLoading: false,
	index: null,
	error: null
});

// Legacy address store (maintained for compatibility during transition)
export const addressStore = writable<{
	isLoading: boolean;
	collection: IndexedAddressCollection;
}>({
	isLoading: true,
	collection: {
		collection: {
			type: 'FeatureCollection',
			features: []
		},
		index: null,
		addresses: [] // Now populated from search index
	}
});

export const isAddressDataLoading = derived(
	[addressStore, minimalSearchIndexStore, combinedIndexStore],
	([$addressStore, $minimalSearchIndexStore, $combinedIndexStore]) =>
		$addressStore.isLoading || $minimalSearchIndexStore.isLoading || $combinedIndexStore.isLoading
);

// Load minimal search index for optimized address search
export async function loadMinimalSearchIndex(): Promise<void> {
	minimalSearchIndexStore.update((store) => ({ ...store, isLoading: true, error: null }));

	try {
		console.log('Loading minimal search index...');
		const cacheBuster = Date.now(); // Force cache refresh
		const indexUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/minimal-search-index.json.br?v=${cacheBuster}`;
		const response = await fetch(indexUrl);
		if (!response.ok) {
			throw new Error(`Failed to load minimal search index: ${response.statusText}`);
		}

		// Handle brotli-compressed response
		const arrayBuffer = await response.arrayBuffer();

		let searchIndex: MinimalSearchIndex;
		try {
			// Try direct JSON parsing first (for uncompressed fallback)
			const text = new TextDecoder().decode(arrayBuffer);
			searchIndex = JSON.parse(text);
		} catch {
			// If that fails, fall back to uncompressed version
			console.warn('Falling back to uncompressed minimal search index');
			const fallbackUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/minimal-search-index.json?v=${cacheBuster}`;
			const fallbackResponse = await fetch(fallbackUrl);
			if (!fallbackResponse.ok) {
				throw new Error('Failed to load fallback minimal search index');
			}
			const text = await fallbackResponse.text();
			searchIndex = JSON.parse(text);
		}

		minimalSearchIndexStore.update((store) => ({
			...store,
			isLoading: false,
			index: searchIndex,
			error: null
		}));

		// Update the legacy addressStore for compatibility (without lead status)
		const legacyAddresses: AddressWithServiceLine[] = searchIndex.addresses.map((addr) => ({
			row: addr.row, // Use the actual row ID from CSV
			fullAddress: addr.display,
			isIntersection: false,
			stnum1: addr.num1,
			stnum2: addr.num2,
			stdir: '',
			stname: addr.street,
			sttype: '',
			zip: addr.zip,
			geocoder: 'minimal-search-index',
			lat: 0,
			long: 0,
			geoid: '',
			leadStatus: 'UNKNOWN', // Will be fetched on-demand via API
			hasLead: false, // Will be updated after API call
			// Matched fields
			mIsIntersection: false,
			mStnum1: addr.num1,
			mStnum2: addr.num2,
			mStdir: '',
			mStname: addr.street,
			mZip: addr.zip
		}));

		addressStore.update((store) => ({
			...store,
			isLoading: false,
			collection: {
				collection: { type: 'FeatureCollection' as const, features: [] },
				index: null,
				addresses: legacyAddresses
			}
		}));

		console.log(
			`✓ Minimal search index loaded: ${searchIndex.addresses.length} addresses, ${Object.keys(searchIndex.streetNames).length} street entries`
		);
		console.log(`  Generated: ${searchIndex.metadata.generatedAt}`);
		console.log(`  Version: ${searchIndex.metadata.version}`);
		console.log(`  File size reduction: ~38% vs full index`);
	} catch (error) {
		console.error('Error loading minimal search index:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Failed to load minimal search index';
		minimalSearchIndexStore.update((store) => ({
			...store,
			isLoading: false,
			error: errorMessage
		}));
		addressStore.update((store) => ({ ...store, isLoading: false }));
	}
}

// Load combined index (search + spatial data)
export async function loadCombinedIndex(): Promise<void> {
	combinedIndexStore.update((store) => ({ ...store, isLoading: true, error: null }));

	try {
		console.log('Loading combined index...');
		const cacheBuster = Date.now();
		const indexUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/combined-index.json.br?v=${cacheBuster}`;
		const response = await fetch(indexUrl);
		if (!response.ok) {
			throw new Error(`Failed to load combined index: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		let combinedIndex: CombinedIndex;
		
		try {
			const text = new TextDecoder().decode(arrayBuffer);
			combinedIndex = JSON.parse(text);
		} catch {
			console.warn('Falling back to uncompressed combined index');
			const fallbackUrl = `${DO_SPACES_URL}/${SEARCH_INDEX_PATH}/combined-index.json?v=${cacheBuster}`;
			const fallbackResponse = await fetch(fallbackUrl);
			if (!fallbackResponse.ok) {
				throw new Error('Failed to load fallback combined index');
			}
			const text = await fallbackResponse.text();
			combinedIndex = JSON.parse(text);
		}

		combinedIndexStore.update((store) => ({
			...store,
			isLoading: false,
			index: combinedIndex,
			error: null
		}));

		console.log(
			`✓ Combined index loaded: ${combinedIndex.addresses.length} addresses, ${Object.keys(combinedIndex.streets).length} street entries`
		);
		console.log(`  Generated: ${combinedIndex.metadata.generatedAt}`);
		console.log(`  Version: ${combinedIndex.metadata.version}`);
		
		// Update addressStore to indicate loading is complete
		addressStore.update((store) => ({ ...store, isLoading: false }));
	} catch (error) {
		console.error('Error loading combined index:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to load combined index';
		combinedIndexStore.update((store) => ({
			...store,
			isLoading: false,
			error: errorMessage
		}));
		// Also update addressStore on error
		addressStore.update((store) => ({ ...store, isLoading: false }));
	}
}

// Multi-service line inventory store
export const multiServiceLineStore = writable<{
	isLoading: boolean;
	inventoryList: InventoryData[];
	currentIndex: number;
	error: string | null;
	address: string | null;
}>({
	isLoading: false,
	inventoryList: [],
	currentIndex: 0,
	error: null,
	address: null
});

// Derived store for current service line
export const currentServiceLine = derived(
	multiServiceLineStore,
	($store) => $store.inventoryList[$store.currentIndex] || null
);

// Derived store for total service line count
export const serviceLineCount = derived(
	multiServiceLineStore,
	($store) => $store.inventoryList.length
);

// Navigate to next service line
export function nextServiceLine(): void {
	multiServiceLineStore.update((store) => ({
		...store,
		currentIndex: Math.min(store.currentIndex + 1, store.inventoryList.length - 1)
	}));
}

// Navigate to previous service line
export function previousServiceLine(): void {
	multiServiceLineStore.update((store) => ({
		...store,
		currentIndex: Math.max(store.currentIndex - 1, 0)
	}));
}
