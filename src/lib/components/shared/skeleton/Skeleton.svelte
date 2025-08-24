<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<div class={['bg-earth/30 animate-pulse', className]}></div>
