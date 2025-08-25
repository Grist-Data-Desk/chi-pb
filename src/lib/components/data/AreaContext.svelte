<script lang="ts">
	import Skeleton from '$lib/components/shared/skeleton/Skeleton.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatAreaIdentifier } from '$lib/utils/formatters';
	interface Props {
		data: CensusTract | CommunityArea | null;
		showServiceLineHelp?: boolean;
	}

	let { data, showServiceLineHelp = false }: Props = $props();

	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
	let areaIdentifier = $derived(formatAreaIdentifier(data, false));
</script>

{#snippet area(value: string)}
	{#if !value}
		<Skeleton class="mr-0.5 inline-block h-2.5 w-[30%] align-baseline" />
	{:else}
		{value}
	{/if}
{/snippet}

<p class="text-earth mt-0 mb-1 font-sans text-xs sm:mt-2 sm:text-sm">
	This address is located in {@render area(areaIdentifier)}. Statistics on this
	{isCommunityArea ? 'community area' : 'census tract'} appear below.
	{#if showServiceLineHelp}
		<span class="sm:hidden">Tap</span>
		<span class="hidden sm:inline">Hover over</span>
		a line classification to learn more.
	{/if}
</p>
