import type { AddressWithServiceLine, ServiceLinePoint } from '$lib/types';

interface SearchState {
	query: string;
	isSearching: boolean;
	results: AddressWithServiceLine[];
	selectedAddress: AddressWithServiceLine | null;
	searchedAddress: AddressWithServiceLine | null; // Address from search, not clicks
	clickedServiceLineRow: number | null;
	nearbyServiceLines: ServiceLinePoint[];
}

export const search = $state<SearchState>({
	query: '',
	isSearching: false,
	results: [],
	selectedAddress: null,
	searchedAddress: null,
	clickedServiceLineRow: null,
	nearbyServiceLines: []
});
