<script lang="ts">
	import { getContext } from 'svelte';

	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';

	const lang = getContext<() => Language>('lang');

	// State.
	let messages = $derived(i18nMessages[lang()]);
</script>

<div class="text-2xs text-earth/80 mt-3 flex flex-col gap-2 font-sans leading-tight sm:mt-4">
	<p class="m-0">
		<strong>{messages.credits.importantInformation}</strong>
		{messages.credits.dataDisclaimer}
	</p>
	<p class="m-0">
		<strong>{messages.credits.sources}</strong>
		{messages.credits.cityOfChicago} / {messages.credits.censusBureau}
	</p>
	<p class="m-0">
		<strong>{messages.credits.analysis}</strong> Peter Aldhous / Inside Climate News; Amy Qin / WBEZ
	</p>
	<p class="m-0">
		<strong>{messages.credits.development}</strong> Clayton Aldern / Parker Ziegler / Grist.
		{messages.credits.seeOur}
		<a
			href="https://github.com/Grist-Data-Desk/chi-pb"
			target="_blank"
			class="text-emerald-600 no-underline hover:text-emerald-700 hover:underline"
		>
			{messages.credits.methods}
		</a>.
	</p>
</div>
