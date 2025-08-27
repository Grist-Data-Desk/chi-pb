<script lang="ts">
	import { getContext } from 'svelte';
	import { messages, type Language } from '$lib/i18n/messages';

	import AreaContext from '$lib/components/data/AreaContext.svelte';
	import Skeleton from '$lib/components/shared/skeleton/Skeleton.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatCurrency, formatPercent } from '$lib/utils/formatters';

	interface Props {
		data: CensusTract | CommunityArea | null;
	}

	let { data }: Props = $props();

	// Context.
	const lang = getContext<Language>('lang');
</script>

{#snippet cell(value: string)}
	<td class="py-0.5 text-right sm:py-1">
		{#if !value}
			<Skeleton class="relative left-[70%] h-4 w-[30%]" />
		{:else}
			{value}
		{/if}
	</td>
{/snippet}

<AreaContext {data} />
<table class="text-earth/80 text-2xs w-full border-collapse font-sans sm:text-xs">
	<colgroup>
		<col width="65%" />
		<col width="35%" />
	</colgroup>
	<tbody>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.medianHouseholdIncomeLabel}</td>
			{@render cell(data ? formatCurrency(data.median_household_income) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.povertyRateLabel}</td>
			{@render cell(data ? formatPercent(data.pct_poverty) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.blackPopulationLabel}</td>
			{@render cell(data ? formatPercent(data.pct_black_nonhispanic) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.latinoPopulationLabel}</td>
			{@render cell(data ? formatPercent(data.pct_hispanic) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.whitePopulationLabel}</td>
			{@render cell(data ? formatPercent(data.pct_white_nonhispanic) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.asianPopulationLabel}</td>
			{@render cell(data ? formatPercent(data.pct_asian_nonhispanic) : '')}
		</tr>
		<tr>
			<td class="py-0.5 sm:py-1">{messages[lang].demographicContext.nonWhitePopulationLabel}</td>
			{@render cell(data ? formatPercent(data.pct_minority) : '')}
		</tr>
	</tbody>
</table>
