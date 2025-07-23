import { writable, derived } from 'svelte/store';
import type {
	AddressWithServiceLine,
	IndexedAddressCollection,
	MinimalSearchIndex,
	InventoryData,
	InventoryApiResponse
} from './types';

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

// Individual inventory data store (on-demand loading)
export const inventoryDataStore = writable<{
	isLoading: boolean;
	data: InventoryData | null;
	error: string | null;
	address: string | null;
}>({
	isLoading: false,
	data: null,
	error: null,
	address: null
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

// Address search state for Chicago water service lines
export const searchState = writable<{
	query: string;
	isSearching: boolean;
	results: AddressWithServiceLine[];
	selectedAddress: AddressWithServiceLine | null;
}>({
	query: '',
	isSearching: false,
	results: [],
	selectedAddress: null
});

// Derived store for the tract ID of the selected address
export const selectedAddressTractId = derived(
	searchState,
	($state) => $state.selectedAddress?.geoid || null
);

export const isAddressDataLoading = derived(
	[addressStore, minimalSearchIndexStore],
	([$addressStore, $minimalSearchIndexStore]) =>
		$addressStore.isLoading || $minimalSearchIndexStore.isLoading
);

export const isInventoryLoading = derived(inventoryDataStore, ($state) => $state.isLoading);

export const inventoryError = derived(inventoryDataStore, ($state) => $state.error);

export const selectedAddressInventory = derived(inventoryDataStore, ($state) => $state.data);

// Load minimal search index for optimized address search
export async function loadMinimalSearchIndex(): Promise<void> {
	minimalSearchIndexStore.update((store) => ({ ...store, isLoading: true, error: null }));

	try {
		// Import the config to get the CDN path
		const { DO_SPACES_URL, SEARCH_INDEX_PATH } = await import('$lib/utils/config');

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

// Load inventory data for a specific address via API using row ID
export async function loadInventoryForAddress(address: string, rowId?: number): Promise<void> {
	// Clear previous data immediately when starting a new search
	inventoryDataStore.update((store) => ({
		...store,
		isLoading: true,
		error: null,
		data: null, // Clear previous data
		address
	}));

	multiServiceLineStore.update((store) => ({
		...store,
		isLoading: true,
		error: null,
		inventoryList: [], // Clear previous inventory list
		currentIndex: 0,
		address
	}));

	try {
		console.log(
			`Loading inventory data for address: ${address}${rowId ? ` (row ID: ${rowId})` : ''}`
		);

		// Use the v2 DigitalOcean Function with address parameter for multiple service lines
		const encodedAddress = encodeURIComponent(address);
		const apiUrl = `https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-f47822c0-7b7f-4248-940b-9249f4f51915/inventory/lookup-v2?address=${encodedAddress}`;

		try {
			const response = await fetch(apiUrl);

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}

			const data: InventoryApiResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'API returned unsuccessful response');
			}

			console.log(`✓ Inventory data loaded for address ${address}:`, data);

			// Update multi-service line store
			multiServiceLineStore.update((store) => ({
				...store,
				isLoading: false,
				inventoryList: data.inventoryList || [],
				error: null
			}));

			// Update legacy store for backward compatibility
			inventoryDataStore.update((store) => ({
				...store,
				isLoading: false,
				data: data.inventory || (data.inventoryList && data.inventoryList[0]) || null,
				error: null
			}));
		} catch (apiError) {
			console.warn('API call failed, using mock data:', apiError);

			// Fallback to mock data if API fails
			const mockInventoryData: InventoryData = {
				fullAddress: address,
				serviceLineMaterial: 'Unknown - API unavailable',
				customerSideMaterial: 'Unknown - API unavailable',
				utilitySideMaterial: 'Unknown - API unavailable',
				overallCode: 'Unknown',
				gooseneck: 'Unknown',
				highRisk: 'N',
				lastUpdated: 'Mock data - API unavailable',
				additionalNotes: 'API temporarily unavailable, showing placeholder data'
			};

			multiServiceLineStore.update((store) => ({
				...store,
				isLoading: false,
				inventoryList: [mockInventoryData],
				error: null
			}));

			inventoryDataStore.update((store) => ({
				...store,
				isLoading: false,
				data: mockInventoryData,
				error: null
			}));
		}
	} catch (error) {
		console.error('Error loading inventory data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to load inventory data';

		multiServiceLineStore.update((store) => ({
			...store,
			isLoading: false,
			error: errorMessage
		}));

		inventoryDataStore.update((store) => ({
			...store,
			isLoading: false,
			error: errorMessage
		}));
	}
}

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
