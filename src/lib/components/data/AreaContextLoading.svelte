<script lang="ts">
	import { visualization } from '$lib/state/visualization.svelte';

	let isCommunityArea = $derived(visualization.aggregationLevel === 'community');
</script>

<div class="font-sans text-xs text-earth/80 sm:text-sm">
	<div class="flex items-center gap-2">
		<div
			class="h-3 w-3 animate-spin rounded-full border-2 border-earth/30 border-t-earth/80"
		></div>
		<p>
			Loading {isCommunityArea ? 'community area' : 'census tract'}
			information...
		</p>
	</div>
</div>
