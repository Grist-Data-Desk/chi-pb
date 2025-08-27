<script lang="ts">
	import { onMount, getContext } from 'svelte';

	import { messages, type Language } from '$lib/i18n/messages';

	// Context.
	const lang = getContext<Language>('lang');

	// State.
	let waterProgress = $state(0);
	let animationId = $state<number | null>(null);

	onMount(() => {
		const animate = () => {
			waterProgress = (waterProgress + 0.5) % 100;
			animationId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
		};
	});
</script>

<!-- Service Line Diagram -->
<svg
	viewBox="0 0 550 230"
	class="h-auto max-h-60 w-full font-sans"
	xmlns="http://www.w3.org/2000/svg"
>
	<!-- Overall classification indicator (loading state) -->
	<g transform="translate(255, 35)">
		<rect
			x="-50"
			y="-12"
			width="100"
			height="24"
			fill="#cbd5e1"
			stroke="#ffffff"
			stroke-width="2"
			rx="12"
			opacity="0.5"
		/>
		<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold">
			{messages[lang].serviceLineInformation.leadStatusLoadingLabel}
		</text>
	</g>

	<!-- Public/Customer Side Headers -->
	<text x="200" y="80" text-anchor="middle" class="fill-earth/40 text-sm font-semibold"
		>Public Side</text
	>
	<text x="440" y="80" text-anchor="middle" class="fill-earth/40 text-sm font-semibold"
		>Private Side</text
	>

	<!-- Dividing line between public and customer sides -->
	<line
		x1="370"
		y1="95"
		x2="370"
		y2="220"
		stroke="#cbd5e1"
		stroke-width="2"
		stroke-dasharray="4,4"
		opacity="0.3"
	/>

	<!-- Labels -->
	<text x="40" y="110" text-anchor="middle" class="fill-earth/40 text-sm font-medium"
		>{messages[lang].serviceLineInformation.waterMainLabel}</text
	>
	<text x="140" y="110" text-anchor="middle" class="fill-earth/40 text-sm font-medium"
		>{messages[lang].serviceLineInformation.gooseneckLabel}</text
	>

	<!-- Utility portion label with text wrapping -->
	<text x="285" y="105" text-anchor="middle" class="fill-earth/40 text-sm font-medium">
		<tspan x="285" dy="0">Utility portion</tspan>
		<tspan x="283" dy="14">of service line</tspan>
	</text>

	<!-- Customer portion label with text wrapping -->
	<text x="450" y="105" text-anchor="middle" class="fill-earth/40 text-sm font-medium">
		<tspan x="442" dy="0">Customer portion</tspan>
		<tspan x="442" dy="14">of service line</tspan>
	</text>

	<!-- Define gradient for water flow -->
	<defs>
		<linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" style="stop-color:#06b6d4;stop-opacity:0" />
			<stop offset="{waterProgress - 10}%" style="stop-color:#06b6d4;stop-opacity:0" />
			<stop offset="{waterProgress}%" style="stop-color:#06b6d4;stop-opacity:0.8" />
			<stop offset="{waterProgress + 10}%" style="stop-color:#06b6d4;stop-opacity:0" />
			<stop offset="100%" style="stop-color:#06b6d4;stop-opacity:0" />
		</linearGradient>

		<!-- Mask for the pipe system -->
		<mask id="pipeMask">
			<!-- Water main (Circle on far left) -->
			<circle cx="40" cy="160" r="25" fill="white" />

			<!-- Gooseneck path -->
			<path
				d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
				fill="none"
				stroke="white"
				stroke-width="12"
				stroke-linecap="round"
			/>

			<!-- Utility Side Pipe -->
			<rect x="200" y="142.5" width="170" height="35" fill="white" rx="4" />

			<!-- Customer Side Pipe -->
			<rect x="370" y="147.5" width="140" height="25" fill="white" rx="4" />
		</mask>
	</defs>

	<!-- Water main (Circle on far left) - grey -->
	<circle cx="40" cy="160" r="25" fill="#cbd5e1" stroke="#ffffff" stroke-width="2" opacity="0.7" />

	<!-- Gooseneck (Connects water main to utility side) - grey -->
	<g>
		<!-- White outline for better definition -->
		<path
			d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
			fill="none"
			stroke="#ffffff"
			stroke-width="15"
			stroke-linecap="round"
		/>

		<!-- Grey path -->
		<path
			d="M 65,160 C 100,160 100,142.5 132.5,142.5 C 167.5,142.5 167.5,160 200,160"
			fill="none"
			stroke="#cbd5e1"
			stroke-width="12"
			stroke-linecap="round"
			opacity="0.7"
		/>
	</g>

	<!-- Utility Side Pipe - grey -->
	<rect
		x="200"
		y="142.5"
		width="170"
		height="35"
		fill="#cbd5e1"
		stroke="#ffffff"
		stroke-width="2"
		rx="4"
		opacity="0.7"
	/>

	<!-- Customer Side Pipe - grey -->
	<rect
		x="370"
		y="147.5"
		width="140"
		height="25"
		fill="#cbd5e1"
		stroke="#ffffff"
		stroke-width="2"
		rx="4"
		opacity="0.7"
	/>

	<!-- Water flow animation -->
	<rect x="0" y="0" width="550" height="230" fill="url(#waterFlow)" mask="url(#pipeMask)" />

	<!-- Loading text below -->
	<text x="275" y="240" text-anchor="middle" class="fill-earth/40 animate-pulse text-sm">
		{messages[lang].serviceLineInformation.loadingServiceLineInformationLabel}
	</text>
</svg>
