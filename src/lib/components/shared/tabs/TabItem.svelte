<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { TabContext, type SelectedTab } from '$lib/components/shared/tabs';

	interface Props {
		title: string;
		open: boolean;
		children: Snippet;
	}

	let { title, open = $bindable(false), children }: Props = $props();

	// Generate a unique ID for this tab button
	const tabId = `tab-${Math.random().toString(36).substring(2)}`;

	const ctx = getContext<{
		panelId: string;
		selectedTab?: SelectedTab;
	}>(TabContext);

	$effect(() => {
		if (ctx.selectedTab?.id !== undefined) {
			open = ctx.selectedTab.id === tabId;
		}
	});

	$effect(() => {
		if (open) {
			ctx.selectedTab = { id: tabId, snippet: children };
		} else if (ctx.selectedTab?.id === tabId) {
			ctx.selectedTab = undefined;
		}
	});
</script>

<li role="presentation" class="flex flex-1">
	<button
		class={[
			'text-earth flex-1 border-0 border-b-2 bg-inherit px-0 pb-1 text-center font-sans text-sm transition-all',

			open ? 'border-b-earth font-semibold' : 'border-b-transparent font-normal'
		]}
		type="button"
		onclick={() => (open = true)}
		role="tab"
		id={tabId}
		aria-controls={ctx.panelId}
		aria-selected={open}
	>
		{title}
	</button>
</li>
