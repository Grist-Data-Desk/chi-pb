import { writable, derived } from 'svelte/store';
import type { 
	Project, 
	IndexedFeatureCollection, 
	AddressWithServiceLine,
	IndexedAddressCollection,
	IndexedTractCollection,
	CensusTract,
	ChoroplethMode,
	MinimalSearchIndex,
	MinimalAddress,
	InventoryData,
	InventoryApiResponse
} from './types';
import { CATEGORIES } from './utils/constants';

// Core data stores for Chicago water service line app
export const tractStore = writable<{
	isLoading: boolean;
	collection: IndexedTractCollection;
}>({
	isLoading: true,
	collection: {
		collection: {
			type: 'FeatureCollection',
			features: []
		},
		index: null
	}
});

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

// Legacy data store (to be removed after refactoring complete)
export const dataStore = writable<{
	isLoading: boolean;
	collection: IndexedFeatureCollection;
}>({
	isLoading: true,
	collection: {
		collection: {
			type: 'FeatureCollection',
			features: []
		},
		index: null
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

// Visualization state for Chicago choropleth

export const visualState = writable<{
	choroplethMode: ChoroplethMode;
	showAddresses: boolean;
	selectedTract: string | null;
}>({
	choroplethMode: 'median_household_income',
	showAddresses: true,
	selectedTract: null
});

// Legacy color mode type (to be removed after refactoring)
export type ColorMode = 'agency' | 'category' | 'fundingSource';


// UI state
export const uiState = writable<{
	legendExpanded: boolean;
	creditsExpanded: boolean;
	resultsExpanded: boolean;
}>({
	legendExpanded: false,
	creditsExpanded: true,
	resultsExpanded: false
});

// Derived states for Chicago water service lines
export const hasSearched = derived(
	searchState,
	$searchState => $searchState.results.length > 0
);

export const hasSelectedAddress = derived(
	searchState,
	$searchState => $searchState.selectedAddress !== null
);

// Filtered address results for Chicago search
export const filteredAddresses = derived(
	[searchState, addressStore],
	([$searchState, $addressStore]) => {
		// If we have search results, return those
		if ($searchState.results.length > 0) {
			return $searchState.results;
		}
		
		// Otherwise return all addresses from the store
		return $addressStore.collection.collection.features.map(f => f.properties);
	}
);

// Legacy filtered results (to be removed after refactoring)
export const filteredResults = derived(
	[searchState, addressStore],
	([$searchState, $addressStore]) => {
		// Return empty array for legacy compatibility during transition
		return [];
	}
);

export const currentCount = derived(
	filteredAddresses,
	$filteredAddresses => $filteredAddresses.length
);

// Convenience exports for Chicago water service lines
export const searchQuery = derived(
	searchState,
	$state => $state.query
);

export const isSearching = derived(
	searchState,
	$state => $state.isSearching
);

export const selectedAddress = derived(
	searchState,
	$state => $state.selectedAddress
);

export const isAddressDataLoading = derived(
	[addressStore, minimalSearchIndexStore],
	([$addressStore, $minimalSearchIndexStore]) => $addressStore.isLoading || $minimalSearchIndexStore.isLoading
);

export const isSearchIndexLoading = derived(
	minimalSearchIndexStore,
	$state => $state.isLoading
);

export const searchIndexError = derived(
	minimalSearchIndexStore,
	$state => $state.error
);

export const isInventoryLoading = derived(
	inventoryDataStore,
	$state => $state.isLoading
);

export const inventoryError = derived(
	inventoryDataStore,
	$state => $state.error
);

export const selectedAddressInventory = derived(
	inventoryDataStore,
	$state => $state.data
);

export const isTractDataLoading = derived(
	tractStore,
	$state => $state.isLoading
);

export const allAddresses = derived(
	addressStore,
	$state => $state.collection
);

export const allTracts = derived(
	tractStore,
	$state => $state.collection
);

export const selectedChoroplethMode = derived(
	visualState,
	$state => $state.choroplethMode
);

export const selectedTract = derived(
	visualState,
	$state => $state.selectedTract
);

export const showAddresses = derived(
	visualState,
	$state => $state.showAddresses
);

// Legacy exports (to be removed after refactoring)
export const isDataLoading = derived(
	dataStore,
	$state => $state.isLoading
);

export const allPoints = derived(
	dataStore,
	$state => $state.collection
);

export const selectedColorMode = derived(
	visualState,
	$state => 'fundingSource' as ColorMode
);

export const activeFilters = derived(
	visualState,
	$state => ({
		fundingSource: new Set<string>()
	})
);

// Inventory-related derived stores


// Load minimal search index for optimized address search
export async function loadMinimalSearchIndex(): Promise<void> {
	minimalSearchIndexStore.update(store => ({ ...store, isLoading: true, error: null }));
	
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
		
		minimalSearchIndexStore.update(store => ({
			...store,
			isLoading: false,
			index: searchIndex,
			error: null
		}));
		
		// Update the legacy addressStore for compatibility (without lead status)
		const legacyAddresses: AddressWithServiceLine[] = searchIndex.addresses.map(addr => ({
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
		
		addressStore.update(store => ({
			...store,
			isLoading: false,
			collection: {
				collection: { type: 'FeatureCollection' as const, features: [] },
				index: null,
				addresses: legacyAddresses
			}
		}));
		
		console.log(`✓ Minimal search index loaded: ${searchIndex.addresses.length} addresses, ${Object.keys(searchIndex.streetNames).length} street entries`);
		console.log(`  Generated: ${searchIndex.metadata.generatedAt}`);
		console.log(`  Version: ${searchIndex.metadata.version}`);
		console.log(`  File size reduction: ~38% vs full index`);
		
	} catch (error) {
		console.error('Error loading minimal search index:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to load minimal search index';
		minimalSearchIndexStore.update(store => ({ 
			...store, 
			isLoading: false, 
			error: errorMessage 
		}));
		addressStore.update(store => ({ ...store, isLoading: false }));
	}
}

// Load inventory data for a specific address via API using row ID
export async function loadInventoryForAddress(address: string, rowId?: number): Promise<void> {
	inventoryDataStore.update(store => ({ 
		...store, 
		isLoading: true, 
		error: null,
		address 
	}));
	
	try {
		console.log(`Loading inventory data for address: ${address}${rowId ? ` (row ID: ${rowId})` : ''}`);
		
		if (!rowId) {
			throw new Error('Row ID is required for inventory lookup');
		}
		
		// Use the live DigitalOcean Function with row ID
		const apiUrl = `https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-f47822c0-7b7f-4248-940b-9249f4f51915/inventory/lookup?id=${rowId}`;
		
		try {
			const response = await fetch(apiUrl);
			
			if (!response.ok) {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}
			
			const data: InventoryApiResponse = await response.json();
			
			if (!data.success) {
				throw new Error(data.error || 'API returned unsuccessful response');
			}
			
			console.log(`✓ Inventory data loaded for row ID ${rowId}:`, data);
			
			inventoryDataStore.update(store => ({
				...store,
				isLoading: false,
				data: data.inventory,
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
				confidence: 'Low - API unavailable',
				highRisk: 'N',
				lastUpdated: 'Mock data - API unavailable',
				additionalNotes: 'API temporarily unavailable, showing placeholder data'
			};
		
			inventoryDataStore.update(store => ({
				...store,
				isLoading: false,
				data: mockInventoryData,
				error: null
			}));
		}
		
	} catch (error) {
		console.error('Error loading inventory data:', error);
		const errorMessage = error instanceof Error ? error.message : 'Failed to load inventory data';
		inventoryDataStore.update(store => ({ 
			...store, 
			isLoading: false, 
			error: errorMessage 
		}));
	}
}

// Legacy function for backward compatibility
export async function loadAddressData(): Promise<void> {
	console.log('loadAddressData() called - redirecting to loadMinimalSearchIndex()');
	return loadMinimalSearchIndex();
}

// Legacy function for backward compatibility
export async function loadSearchIndex(): Promise<void> {
	console.log('loadSearchIndex() called - redirecting to loadMinimalSearchIndex()');
	return loadMinimalSearchIndex();
}

// Legacy inventory loading function - now deprecated in favor of on-demand API
export async function loadInventoryData(): Promise<void> {
	console.log('loadInventoryData() called - inventory now loaded on-demand via API');
	// No longer loads the entire inventory file
	// Individual addresses are fetched via loadInventoryForAddress()
}

