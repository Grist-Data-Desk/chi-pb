import { writable, derived } from 'svelte/store';
import type { 
	Project, 
	IndexedFeatureCollection, 
	AddressWithServiceLine,
	IndexedAddressCollection,
	IndexedTractCollection,
	CensusTract,
	ChoroplethMode
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
		index: null
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
	addressStore,
	$state => $state.isLoading
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
