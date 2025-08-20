<script lang="ts">
	import { visualization } from '$lib/state/visualization.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatAreaIdentifier } from '$lib/utils/formatters';

	interface Props {
		data: CensusTract | CommunityArea;
		showServiceLineHelp?: boolean;
	}

	let { data, showServiceLineHelp = false }: Props = $props();

	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
	let areaIdentifier = $derived(formatAreaIdentifier(data, false));
</script>

<p class="font-sans text-2xs mt-0 mb-1 text-slate-500 italic sm:text-xs">
	This address is located in {areaIdentifier}. Statistics on this
	{isCommunityArea ? 'community area' : 'census tract'} appear below.
	{#if showServiceLineHelp}
		<span class="sm:hidden">Tap</span>
		<span class="hidden sm:inline">Hover over</span>
		a line classification to learn more.
	{/if}
</p>
