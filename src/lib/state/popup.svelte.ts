import type { Popup } from '$lib/classes/Popup';

export const popup = $state<{ node: Popup | null }>({ node: null });
