<script lang="ts">
	import { getContext } from 'svelte';

	import { messages, type Language } from '$lib/i18n/messages';

	const lang = getContext<Language>('lang');
</script>

<div class="text-2xs text-earth/80 mt-3 flex flex-col gap-2 font-sans leading-tight sm:mt-4">
	<p class="m-0">
		<strong>Important Information</strong> Data is current as of the city’s 2025 water service line inventory. The city’s
		data is incomplete and might contain inaccuracies and duplicates. Multiple addresses might be served
		by the same service line. Some addresses will appear as ranges. We encourage users to independently
		verify any information before acting on it.
	</p>
	<p class="m-0">
		<strong>{messages[lang].credits.sources}</strong>
		{messages[lang].credits.cityOfChicago} / {messages[lang].credits.censusBureau}
	</p>
	<p class="m-0">
		<strong>{messages[lang].credits.analysis}</strong> Peter Aldhous / Inside Climate News; Amy Qin /
		WBEZ
	</p>
	<p class="m-0">
		<strong>{messages[lang].credits.development}</strong> Clayton Aldern / Parker Ziegler / Grist.
		{messages[lang].credits.seeOur}
		<a
			href="https://github.com/Grist-Data-Desk/chi-pb"
			target="_blank"
			class="text-emerald-600 no-underline hover:text-emerald-700 hover:underline"
		>
			{messages[lang].credits.methods}
		</a>.
	</p>
</div>
