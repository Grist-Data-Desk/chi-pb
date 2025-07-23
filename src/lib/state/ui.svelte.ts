interface UIState {
	legendExpanded: boolean;
	creditsExpanded: boolean;
	searchHeaderCollapsed: boolean;
}

export const ui = $state<UIState>({
	legendExpanded: false,
	creditsExpanded: true,
	searchHeaderCollapsed: false
});
