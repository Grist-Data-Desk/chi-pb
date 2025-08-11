import type { Snippet } from 'svelte';

export const TabContext = Symbol('tabs');

export interface SelectedTab {
	id: string;
	snippet: Snippet;
}
