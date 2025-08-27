<script lang="ts">
	import { getContext } from 'svelte';
	import { messages, type Language } from '$lib/i18n/messages';

	import AreaContext from '$lib/components/data/AreaContext.svelte';
	import Skeleton from '$lib/components/shared/skeleton/Skeleton.svelte';
	import ServiceLineTooltip from '$lib/components/shared/ServiceLineTooltip.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatCount, formatPercent } from '$lib/utils/formatters';

	interface Props {
		data: CensusTract | CommunityArea | null;
	}

	let { data }: Props = $props();

	// Context.
	const lang = getContext<Language>('lang');
</script>

{#snippet cell(value: string, className = '')}
	<td class={['p-0.5 text-right sm:p-1', className]}>
		{#if !value}
			<Skeleton class="relative left-[70%] h-4 w-[30%]" />
		{:else}
			{value}
		{/if}
	</td>
{/snippet}

<AreaContext {data} showServiceLineHelp={true} />
<table class="text-2xs text-earth/80 -mx-0.5 w-full border-collapse font-sans sm:-mx-1 sm:text-xs">
	<colgroup>
		<col class="w-3/5" />
		<col class="w-1/5" />
		<col class="w-1/5" />
	</colgroup>
	<tbody>
		<tr>
			<td class="p-0.5 sm:p-1">
				<ServiceLineTooltip classification="lead">
					<span>{messages[lang].serviceLineInventory.leadLabel}</span>
				</ServiceLineTooltip>
			</td>
			{@render cell(data ? formatCount(data.L) : '')}
			{@render cell(data ? formatPercent(data.pct_lead) : '')}
		</tr>
		<tr>
			<td class="p-0.5 sm:p-1">
				<ServiceLineTooltip classification="suspectedLead">
					<span>{messages[lang].serviceLineInventory.suspectedLeadLabel}</span>
				</ServiceLineTooltip>
			</td>
			{@render cell(data ? formatCount(data.U) : '')}
			{@render cell(data ? formatPercent(data.pct_suspected_lead) : '')}
		</tr>
		<tr>
			<td class="p-0.5 sm:p-1">
				<ServiceLineTooltip classification="galvanized">
					<span>{messages[lang].serviceLineInventory.galvanizedReplaceLabel}</span>
				</ServiceLineTooltip>
			</td>
			{@render cell(data ? formatCount(data.GRR) : '')}
			{@render cell(data ? formatPercent(data.pct_grr) : '')}
		</tr>
		<tr>
			<td class="p-0.5 sm:p-1">
				<ServiceLineTooltip classification="nonLead">
					<span>{messages[lang].serviceLineInventory.nonLeadLabel}</span>
				</ServiceLineTooltip>
			</td>
			{@render cell(data ? formatCount(data.NL) : '')}
			{@render cell(data ? formatPercent(data.pct_not_lead) : '')}
		</tr>
	</tbody>
	<tfoot>
		<tr class="border-earth/30 border-t">
			<td class="p-0.5 sm:p-1">{messages[lang].serviceLineInventory.totalLabel}</td>
			{@render cell(data ? formatCount(data.total) : '')}
			<td class="p-0.5 sm:p-1"></td>
		</tr>
		<tr class="bg-red-100 text-red-600">
			<td class="p-0.5 font-semibold sm:p-1">
				{messages[lang].serviceLineInventory.requiresReplacementLabel}
			</td>
			{@render cell(data ? formatCount(data.requires_replacement) : '', 'font-semibold')}
			{@render cell(data ? formatPercent(data.pct_requires_replacement) : '', 'font-semibold')}
		</tr>
	</tfoot>
</table>
