<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { TabContext, type SelectedTab } from '$lib/components/shared/tabs';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Create a unique ID for the tab panel. This will be used by child <TabItem>
	// instances in the aria-controls attribute to identify the tab panel as the
	// controlling element.
	const panelId = `tab-panel-${Math.random().toString(36).substring(2)}`;

	const ctx = $state<{
		panelId: string;
		selectedTab?: SelectedTab;
	}>({
		panelId,
		selectedTab: undefined
	});

	setContext(TabContext, ctx);
</script>

<div class="flex flex-col gap-2">
	<ul role="tablist" class="border-earth m-0 flex list-none gap-2 border-b p-0">
		{@render children()}
	</ul>
	<div id={ctx.panelId} role="tabpanel" aria-labelledby={ctx.selectedTab?.id}>
		{@render ctx.selectedTab?.snippet?.()}
	</div>
</div>
