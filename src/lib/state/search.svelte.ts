import type { AddressWithServiceLine } from '$lib/types';

interface SearchState {
	query: string;
	isSearching: boolean;
	results: AddressWithServiceLine[];
	selectedAddress: AddressWithServiceLine | null;
}

export const search = $state<SearchState>({
	query: '',
	isSearching: false,
	results: [],
	selectedAddress: null
});
