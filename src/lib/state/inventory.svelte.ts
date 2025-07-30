import type { AddressWithServiceLine, InventoryData } from '$lib/types';

interface InventoryState {
	selectedAddress: AddressWithServiceLine | null;
	inventoryData: InventoryData | null;
	isLoading: boolean;
	error: string | null;
}

export const inventory = $state<InventoryState>({
	selectedAddress: null,
	inventoryData: null,
	isLoading: false,
	error: null
});
