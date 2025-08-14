interface UIState {
	legendExpanded: boolean;
	creditsExpanded: boolean;
	searchHeaderCollapsed: boolean;
	resourcesExpanded: boolean;
}

export const ui = $state<UIState>({
	legendExpanded: false,
	creditsExpanded: true,
	searchHeaderCollapsed: false,
	resourcesExpanded: false
});
