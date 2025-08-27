<script lang="ts">
	import { getContext } from 'svelte';

	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';
	import Skeleton from '$lib/components/shared/skeleton/Skeleton.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatAreaIdentifier } from '$lib/utils/formatters';
	interface Props {
		data: CensusTract | CommunityArea | null;
		showServiceLineHelp?: boolean;
	}

	let { data, showServiceLineHelp = false }: Props = $props();

	// Context.
	const lang = getContext<() => Language>('lang');

	// State.
	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
	let areaIdentifier = $derived(
		formatAreaIdentifier(data, { lang: lang(), capitalizeCensusTract: false })
	);
	let messages = $derived(i18nMessages[lang()]);
</script>

{#snippet area(value: string)}
	{#if !value}
		<Skeleton class="mr-0.5 inline-block h-2.5 w-[30%] align-baseline" />
	{:else}
		{value}
	{/if}
{/snippet}

<p class="text-earth mt-0 mb-1 font-sans text-xs sm:mt-1 sm:text-sm">
	{messages.areaContext.locatedIn}
	{@render area(areaIdentifier)}.
	{messages.areaContext.statisticsOn[isCommunityArea ? 'communityArea' : 'censusTract']}
	{#if showServiceLineHelp}
		<span class="sm:hidden">{messages.areaContext.interaction.tap}</span>
		<span class="hidden sm:inline">{messages.areaContext.interaction.hoverOver}</span>
		{messages.areaContext.learnMore}
	{/if}
</p>
