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
	<table class="text-2xs w-full border-collapse sm:text-xs">
		<tbody>
			<tr>
				<td class="py-0.5 text-slate-500 sm:py-1">Median Household Income</td>
				<td class="py-0.5 text-right font-medium sm:py-1"
					>{formatCurrency(data.median_household_income)}</td
				>
			</tr>
			<tr>
				<td class="py-0.5 text-slate-500 sm:py-1">Poverty Rate</td>
				<td class="py-0.5 text-right font-medium sm:py-1">{formatPercent(data.pct_poverty)}</td>
			</tr>
			<tr>
				<td class="py-0.5 text-slate-500 sm:py-1">Black Population</td>
				<td class="py-0.5 text-right font-medium sm:py-1"
					>{formatPercent(data.pct_black_nonhispanic)}</td
				>
			</tr>
			<tr>
				<td class="py-0.5 text-slate-500 sm:py-1">White Population</td>
				<td class="py-0.5 text-right font-medium sm:py-1"
					>{formatPercent(data.pct_white_nonhispanic)}</td
				>
			</tr>
			<tr>
				<td class="py-0.5 text-slate-500 sm:py-1">Asian Population</td>
				<td class="py-0.5 text-right font-medium sm:py-1"
					>{formatPercent(data.pct_asian_nonhispanic)}</td
				>
			</tr>
			<tr class="border-b border-transparent">
				<td class="py-0.5 text-slate-500 sm:py-1">Non-White Population</td>
				<td class="py-0.5 text-right font-medium sm:py-1">{formatPercent(data.pct_minority)}</td>
			</tr>
		</tbody>
	</table>
{/if}
