import type { AddressWithServiceLine, ServiceLinePoint } from '$lib/types';

interface SearchState {
	query: string;
	isSearching: boolean;
	results: AddressWithServiceLine[];
	selectedAddress: AddressWithServiceLine | null;
	searchedAddress: AddressWithServiceLine | null; // Address from search, not clicks
	clickedServiceLineRow: number | null;
	nearbyServiceLines: ServiceLinePoint[];
	selectedAddressTractId: string | null;
	selectedAddressCommunityName: string | null;
	noInventoryResults: boolean; // Flag when inventory search returns 0 results
	isNominatimAddress: boolean; // Flag when selected address is from Nominatim
}

export const search = $state<SearchState>({
	query: '',
	isSearching: false,
	results: [],
	selectedAddress: null,
	searchedAddress: null,
	clickedServiceLineRow: null,
	nearbyServiceLines: [],
	selectedAddressTractId: null,
	selectedAddressCommunityName: null,
	noInventoryResults: false,
	isNominatimAddress: false
});
