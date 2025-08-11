<script lang="ts">
	import AreaContext from '$lib/components/data/AreaContext.svelte';
	import AreaContextLoading from '$lib/components/data/AreaContextLoading.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatCount, formatPercent } from '$lib/utils/formatters';

	interface Props {
		loading: boolean;
		data: CensusTract | CommunityArea;
	}

	let { loading, data }: Props = $props();
</script>

{#if loading}
	<AreaContextLoading />
{:else}
	<AreaContext {data} />
	<table class="w-full border-collapse text-xs">
		<colgroup>
			<col class="w-3/5" />
			<col class="w-1/5" />
			<col class="w-1/5" />
		</colgroup>
		<tbody>
			<tr>
				<td class="p-1 text-slate-500">Lead</td>
				<td class="p-1 text-right font-medium">{formatCount(data.L)}</td>
				<td class="p-1 text-right text-slate-500">{formatPercent(data.pct_lead)}</td>
			</tr>
			<tr>
				<td class="p-1 text-slate-500">Galvanized (Replace)</td>
				<td class="p-1 text-right font-medium">{formatCount(data.GRR)}</td>
				<td class="p-1 text-right text-slate-500">{formatPercent(data.pct_grr)}</td>
			</tr>
			<tr>
				<td class="p-1 text-slate-500">Unknown (Suspected Lead)</td>
				<td class="p-1 text-right font-medium">{formatCount(data.U)}</td>
				<td class="p-1 text-right text-slate-500">{formatPercent(data.pct_suspected_lead)}</td>
			</tr>
			<tr>
				<td class="p-1 text-slate-500">Non-Lead</td>
				<td class="p-1 text-right font-medium">{formatCount(data.NL)}</td>
				<td class="p-1 text-right text-slate-500">{formatPercent(data.pct_not_lead)}</td>
			</tr>
		</tbody>
		<tfoot>
			<tr class="border-t border-slate-300">
				<td class="p-1 text-slate-500">Total</td>
				<td class="p-1 text-right font-medium">{formatCount(data.total)}</td>
				<td class="p-1"></td>
			</tr>
			<tr class="bg-red-100 text-red-600">
				<td class="p-1 font-medium">Requires Replacement</td>
				<td class="p-1 text-right font-medium">{formatCount(data.requires_replacement)}</td>
				<td class="p-1 text-right font-medium">{formatPercent(data.pct_requires_replacement)}</td>
			</tr>
		</tfoot>
	</table>
{/if}
