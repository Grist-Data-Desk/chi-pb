<script lang="ts">
	import AreaContext from '$lib/components/data/AreaContext.svelte';
	import AreaContextLoading from '$lib/components/data/AreaContextLoading.svelte';
	import type { CensusTract, CommunityArea } from '$lib/types';
	import { formatCurrency, formatPercent } from '$lib/utils/formatters';

	interface Props {
		data: CensusTract | CommunityArea;
		loading: boolean;
	}

	let { data, loading }: Props = $props();
</script>

{#if loading}
	<AreaContextLoading />
{:else}
	<AreaContext {data} />
	<table class="w-full border-collapse text-xs">
		<tbody>
			<tr>
				<td class="py-1 text-slate-500">Median Income</td>
				<td class="py-1 text-right font-medium">{formatCurrency(data.median_household_income)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">Poverty Rate</td>
				<td class="py-1 text-right font-medium">{formatPercent(data.pct_poverty)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">Black Population</td>
				<td class="py-1 text-right font-medium">{formatPercent(data.pct_black_nonhispanic)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">White Population</td>
				<td class="py-1 text-right font-medium">{formatPercent(data.pct_white_nonhispanic)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">Asian Population</td>
				<td class="py-1 text-right font-medium">{formatPercent(data.pct_asian_nonhispanic)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">Minority Population</td>
				<td class="py-1 text-right font-medium">{formatPercent(data.pct_minority)}</td>
			</tr>
		</tbody>
	</table>
{/if}
