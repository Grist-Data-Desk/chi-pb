<script lang="ts">
	import { visualization } from '$lib/state/visualization.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';

	interface Props {
		data: CensusTract | CommunityArea;
	}

	let { data }: Props = $props();

	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
</script>

<p class="mt-1 text-xs text-slate-500 italic">
	This address is located in {isCommunityArea
		? (data as CommunityArea).community
		: `census tract ${(data as CensusTract).geoid}`}. Statistics on this
	{isCommunityArea ? 'community area' : 'census tract'} appear below.
</p>
