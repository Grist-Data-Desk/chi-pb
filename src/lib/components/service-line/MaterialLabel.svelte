<script lang="ts">
	import { getContext } from 'svelte';

	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';
	import { formatServiceLineMaterial } from '$lib/utils/formatters';

	interface Props {
		material: string;
		x: number;
		y: number;
	}

	let { material, x, y }: Props = $props();

	// Context.
	const lang = getContext<() => Language>('lang');

	// State.
	let messages = $derived(i18nMessages[lang()]);
	let materialLabel = $derived(splitLabel(material));

	function splitLabel(material: string): { line1: string; line2?: string; line3?: string } {
		switch (material.toUpperCase()) {
			case 'C':
				return {
					line1: messages.serviceLineInformation.split.copper,
					line2: messages.serviceLineInformation.split.noLeadSolder
				};
			case 'CLS':
				return {
					line1: messages.serviceLineInformation.split.copper,
					line2: messages.serviceLineInformation.split.leadSolder
				};
			case 'GRR':
				return {
					line1: messages.serviceLineInformation.split.galvanized,
					line2: messages.serviceLineInformation.split.requiring,
					line3: messages.serviceLineInformation.split.replacement
				};
			case 'O':
				return {
					line1: messages.serviceLineInformation.split.castDuctile,
					line2: messages.serviceLineInformation.split.orTransite
				};
			case 'P':
				return {
					line1: messages.serviceLineInformation.split.plastic,
					line2: messages.serviceLineInformation.split.pvchdpepex
				};
			case 'UNL':
				return {
					line1: messages.serviceLineInformation.split.unknown,
					line2: messages.serviceLineInformation.split.notLead
				};
			default:
				return {
					line1: formatServiceLineMaterial(material, { lang: lang() })
				};
		}
	}
</script>

<text {x} {y} text-anchor="middle" class="fill-earth/80 text-sm font-medium">
	{materialLabel.line1}
	{#if materialLabel.line2}
		<tspan {x} dy="15">{materialLabel.line2}</tspan>
	{/if}
	{#if materialLabel.line3}
		<tspan {x} dy="15">{materialLabel.line3}</tspan>
	{/if}
</text>
