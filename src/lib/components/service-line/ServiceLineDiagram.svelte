<script lang="ts">
	import { getContext } from 'svelte';

	import MaterialLabel from '$lib/components/service-line/MaterialLabel.svelte';
	import { messages as i18nMessages, type Language } from '$lib/i18n/messages';
	import { multiServiceLineStore, serviceLineCount } from '$lib/stores';
	import { COLORS, getMaterialColor } from '$lib/utils/constants';
	import { formatServiceLineMaterial } from '$lib/utils/formatters';

	interface Props {
		utilitySideMaterial: string;
		gooseneckMaterial: string;
		customerSideMaterial: string;
		overallCode: string;
	}

	let { utilitySideMaterial, gooseneckMaterial, customerSideMaterial, overallCode }: Props =
		$props();

	// Context.
	const lang = getContext<() => Language>('lang');

	// State.
	let utilityColor = $derived(getMaterialColor(utilitySideMaterial));
	let gooseneckColor = $derived(getMaterialColor(gooseneckMaterial));
	let customerColor = $derived(getMaterialColor(customerSideMaterial));
	let messages = $derived(i18nMessages[lang()]);
</script>

<!-- Service Line Diagram -->
<svg
	viewBox="0 0 550 230"
	class="h-auto max-h-60 w-full font-sans"
	xmlns="http://www.w3.org/2000/svg"
>
	<!-- Overall classification indicator -->
	<g transform="translate(255, 35)">
		{#if overallCode === 'L'}
			<rect
				x="-35"
				y="-12"
				width="70"
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm">
				{messages.serviceLineInformation.leadStatus.L}
			</text>
		{:else if overallCode === 'GRR'}
			<rect
				x={lang() === 'en' ? '-120' : '-150'}
				y="-12"
				width={lang() === 'en' ? '240' : '300'}
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm"
				>{messages.serviceLineInformation.leadStatus.GRR}</text
			>
		{:else if overallCode === 'NL'}
			<rect
				x="-50"
				y="-12"
				width="100"
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm">
				{messages.serviceLineInformation.leadStatus.NL}
			</text>
		{:else if overallCode === 'U'}
			<rect
				x={lang() === 'en' ? '-65' : '-75'}
				y="-12"
				width={lang() === 'en' ? '130' : '150'}
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm">
				{messages.serviceLineInformation.leadStatus.U}
			</text>
		{:else}
			<rect
				x="-70"
				y="-12"
				width="140"
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm">
				{messages.serviceLineInformation.leadStatus.Unknown}
			</text>
		{/if}
	</g>

	<!-- Service line counter indicator if multiple -->
	{#if $serviceLineCount > 1}
		<g transform="translate(500, 35)">
			<circle
				cx="0"
				cy="0"
				r="20"
				fill={COLORS.INT_BLUE}
				stroke="#ffffff"
				stroke-width="2"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-xs">
				{$multiServiceLineStore.currentIndex + 1}/{$serviceLineCount}
			</text>
		</g>
	{/if}

	<!-- Public/Customer Side Headers -->
	<text x="200" y="80" text-anchor="middle" class="fill-earth/80 text-sm font-semibold"
		>{messages.serviceLineInformation.components.publicSide}</text
	>
	<text x="440" y="80" text-anchor="middle" class="fill-earth/80 text-sm font-semibold"
		>{messages.serviceLineInformation.components.privateSide}</text
	>

	<!-- Dividing line between public and customer sides -->
	<line
		x1="370"
		y1="95"
		x2="370"
		y2="220"
		stroke="#94a3b8"
		stroke-width="2"
		stroke-dasharray="4,4"
		opacity="0.5"
	/>

	<!-- Labels -->
	{#if lang() === 'en'}
		<text x="40" y="110" text-anchor="middle" class="fill-earth/80 text-sm font-medium"
			>{messages.serviceLineInformation.components.waterMain}</text
		>
	{:else}
		<text x="40" y="105" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
			<tspan x="41" dy="0"
				>{messages.serviceLineInformation.components.waterMain.split(' ')[0]}</tspan
			>
			<tspan x="40" dy="14"
				>{messages.serviceLineInformation.components.waterMain.split(' ').slice(1).join(' ')}</tspan
			>
		</text>
	{/if}
	<text x="140" y="110" text-anchor="middle" class="fill-earth/80 text-sm font-medium"
		>{messages.serviceLineInformation.components.gooseneck}</text
	>

	<!-- Utility portion label with text wrapping -->
	<text x="285" y="105" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		{#if lang() === 'en'}
			<tspan x="285" dy="0">{messages.serviceLineInformation.components.utilityPortion}</tspan>
			<tspan x="283" dy="14">{messages.serviceLineInformation.components.ofServiceLine}</tspan>
		{:else}
			<tspan x="285" dy="0"
				>{messages.serviceLineInformation.components.utilityPortion
					.split(' ')
					.slice(0, 2)
					.join(' ')}</tspan
			>
			<tspan x="285" dy="14"
				>{messages.serviceLineInformation.components.utilityPortion
					.split(' ')
					.slice(2)
					.join(' ')}</tspan
			>
			<tspan x="283" dy="14">{messages.serviceLineInformation.components.ofServiceLine}</tspan>
		{/if}
	</text>

	<!-- Customer portion label with text wrapping -->
	<text x="450" y="105" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		{#if lang() === 'en'}
			<tspan x="442" dy="0">{messages.serviceLineInformation.components.customerPortion}</tspan>
			<tspan x="442" dy="14">{messages.serviceLineInformation.components.ofServiceLine}</tspan>
		{:else}
			<tspan x="442" dy="0">{messages.serviceLineInformation.components.customerPortion}</tspan>
			<tspan x="442" dy="14"
				>{messages.serviceLineInformation.components.ofServiceLine
					.split(' ')
					.slice(0, 3)
					.join(' ')}</tspan
			>
			<tspan x="442" dy="14"
				>{messages.serviceLineInformation.components.ofServiceLine
					.split(' ')
					.slice(3)
					.join(' ')}</tspan
			>
		{/if}
	</text>

	<!-- Water main (Circle on far left) -->
	<circle cx="40" cy="160" r="25" fill={COLORS.EARTH} stroke="#ffffff" stroke-width="2">
		<title>{messages.serviceLineInformation.components.waterMain}</title>
	</circle>

	<!-- Gooseneck (Connects water main to utility side) -->
	<g>
		<!-- S-curve gooseneck path -->
		<path
			d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
			fill="none"
			stroke={gooseneckColor}
			stroke-width="12"
			stroke-linecap="round"
		>
			<title
				>{messages.serviceLineInformation.components.gooseneck}: {formatServiceLineMaterial(
					gooseneckMaterial,
					{ lang: lang() }
				)}</title
			>
		</path>

		<!-- White outline for better definition -->
		<path
			d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
			fill="none"
			stroke="#ffffff"
			stroke-width="15"
			stroke-linecap="round"
		/>

		<!-- Reapply colored path -->
		<path
			d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
			fill="none"
			stroke={gooseneckColor}
			stroke-width="12"
			stroke-linecap="round"
		/>
	</g>

	<!-- Utility Side Pipe -->
	<rect
		x="200"
		y="142.5"
		width="170"
		height="35"
		fill={utilityColor}
		stroke="#ffffff"
		stroke-width="2"
		rx="4"
	>
		<title
			>{messages.serviceLineInformation.components.utilitySide}: {formatServiceLineMaterial(
				utilitySideMaterial,
				{ lang: lang() }
			)}</title
		>
	</rect>

	<!-- Customer Side Pipe (Narrower) -->
	<rect
		x="370"
		y="147.5"
		width="140"
		height="25"
		fill={customerColor}
		stroke="#ffffff"
		stroke-width="2"
		rx="4"
	>
		<title
			>{messages.serviceLineInformation.components.customerSide}: {formatServiceLineMaterial(
				customerSideMaterial,
				{ lang: lang() }
			)}</title
		>
	</rect>
	<MaterialLabel material={gooseneckMaterial} x={140} y={200} />
	<MaterialLabel material={utilitySideMaterial} x={285} y={200} />
	<MaterialLabel material={customerSideMaterial} x={440} y={200} />
</svg>
