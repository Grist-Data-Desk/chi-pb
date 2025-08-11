<script lang="ts">
	import { visualization } from '$lib/state/visualization.svelte';

	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
</script>

<div class="font-sans text-xs text-slate-500 sm:text-sm">
	<div class="flex items-center gap-2">
		<div
			class="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
		></div>
		<p>
			Loading {isCommunityArea ? 'community area' : 'census tract'}
			information...
		</p>
	</div>
</div>
