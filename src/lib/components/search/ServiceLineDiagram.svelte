<script lang="ts">
	import { COLORS, getMaterialColor } from '$lib/utils/constants';
	import { multiServiceLineStore, serviceLineCount } from '$lib/stores';

	interface Props {
		utilitySideMaterial: string;
		gooseneckMaterial: string;
		customerSideMaterial: string;
		overallCode: string;
	}

	let { utilitySideMaterial, gooseneckMaterial, customerSideMaterial, overallCode }: Props =
		$props();

	// State.
	let utilityColor = $derived(getMaterialColor(utilitySideMaterial));
	let gooseneckColor = $derived(getMaterialColor(gooseneckMaterial));
	let customerColor = $derived(getMaterialColor(customerSideMaterial));

	function getMaterialLabel(material: string): string {
		if (!material) {
			return 'Unknown';
		}

		switch (material.toUpperCase()) {
			case 'C':
				return 'Copper - No Lead Solder';
			case 'CLS':
				return 'Copper - Lead Solder';
			case 'G':
				return 'Galvanized';
			case 'GRR':
				return 'Galvanized Requiring Replacement';
			case 'L':
				return 'Lead';
			case 'O':
				return 'Cast/Ductile Iron or Transite';
			case 'P':
				return 'Plastic - PVC, HDPE, PEX';
			case 'U':
				return 'Suspected Lead';
			case 'UNL':
				return 'Unknown (Not Lead)';
			case 'NL':
				return 'Non-Lead';
			default:
				return material;
		}
	}

	function splitLabel(label: string): { line1: string; line2?: string } {
		if (label.length <= 20) {
			return { line1: label };
		}

		switch (label) {
			case 'Suspected Lead':
				return { line1: 'Unknown', line2: '(Suspected Lead)' };
			case 'Unknown (Not Lead)':
				return { line1: 'Unknown', line2: '(Not Lead)' };
			case 'Galvanized Requiring Replacement':
				return { line1: 'Galvanized Requiring', line2: 'Replacement' };
			case 'Cast/Ductile Iron or Transite':
				return { line1: 'Cast/Ductile Iron', line2: 'or Transite' };
			case 'Copper - No Lead Solder':
				return { line1: 'Copper -', line2: 'No Lead Solder' };
			case 'Copper - Lead Solder':
				return { line1: 'Copper -', line2: 'Lead Solder' };
			case 'Plastic - PVC, HDPE, PEX':
				return { line1: 'Plastic -', line2: 'PVC, HDPE, PEX' };
			default: {
				const words = label.split(' ');
				const midpoint = Math.ceil(words.length / 2);
				return {
					line1: words.slice(0, midpoint).join(' '),
					line2: words.slice(midpoint).join(' ')
				};
			}
		}
	}
</script>

<!-- Service Line Diagram -->
<svg
	viewBox="0 0 550 230"
	class="h-auto max-h-60 w-full font-sans"
	xmlns="http://www.w3.org/2000/svg"
>
	<!-- Overall classification indicator -->
	<g transform="translate(275, 35)">
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
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold">Lead</text>
		{:else if overallCode === 'GRR'}
			<rect
				x="-120"
				y="-12"
				width="240"
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold"
				>Galvanized Requiring Replacement</text
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
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold">Non-Lead</text>
		{:else if overallCode === 'U'}
			<rect
				x="-65"
				y="-12"
				width="130"
				height="24"
				fill={getMaterialColor(overallCode)}
				stroke="#ffffff"
				stroke-width="2"
				rx="12"
				opacity="0.9"
			/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold"
				>Suspected Lead</text
			>
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
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold"
				>Unknown Status</text
			>
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
			<text x="0" y="4" text-anchor="middle" class="fill-white text-xs font-bold">
				{$multiServiceLineStore.currentIndex + 1}/{$serviceLineCount}
			</text>
		</g>
	{/if}

	<!-- Public/Customer Side Headers -->
	<text x="170" y="80" text-anchor="middle" class="fill-earth/80 text-sm font-semibold"
		>Public Side</text
	>
	<text x="450" y="80" text-anchor="middle" class="fill-earth/80 text-sm font-semibold"
		>Private Side</text
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
	<text x="40" y="110" text-anchor="middle" class="fill-earth/80 text-sm font-medium"
		>Water main</text
	>
	<text x="140" y="110" text-anchor="middle" class="fill-earth/80 text-sm font-medium"
		>Gooseneck</text
	>

	<!-- Utility portion label with text wrapping -->
	<text x="285" y="105" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		<tspan x="285" dy="0">Utility portion</tspan>
		<tspan x="285" dy="14">of service line</tspan>
	</text>

	<!-- Customer portion label with text wrapping -->
	<text x="450" y="105" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		<tspan x="450" dy="0">Customer portion</tspan>
		<tspan x="450" dy="14">of service line</tspan>
	</text>

	<!-- Water main (Circle on far left) -->
	<circle cx="40" cy="160" r="25" fill={COLORS.EARTH} stroke="#ffffff" stroke-width="2">
		<title>Water main</title>
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
			<title>Gooseneck: {getMaterialLabel(gooseneckMaterial)}</title>
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
		<title>Utility Side: {getMaterialLabel(utilitySideMaterial)}</title>
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
		<title>Customer Side: {getMaterialLabel(customerSideMaterial)}</title>
	</rect>

	<!-- Material labels below pipes with text wrapping -->
	<text x="140" y="200" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		{#if splitLabel(getMaterialLabel(gooseneckMaterial)).line2}
			<tspan x="140" dy="0">{splitLabel(getMaterialLabel(gooseneckMaterial)).line1}</tspan>
			<tspan x="140" dy="15">{splitLabel(getMaterialLabel(gooseneckMaterial)).line2}</tspan>
		{:else}
			{getMaterialLabel(gooseneckMaterial)}
		{/if}
	</text>
	<text x="285" y="200" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		{#if splitLabel(getMaterialLabel(utilitySideMaterial)).line2}
			<tspan x="285" dy="0">{splitLabel(getMaterialLabel(utilitySideMaterial)).line1}</tspan>
			<tspan x="285" dy="15">{splitLabel(getMaterialLabel(utilitySideMaterial)).line2}</tspan>
		{:else}
			{getMaterialLabel(utilitySideMaterial)}
		{/if}
	</text>
	<text x="440" y="200" text-anchor="middle" class="fill-earth/80 text-sm font-medium">
		{#if splitLabel(getMaterialLabel(customerSideMaterial)).line2}
			<tspan x="440" dy="0">{splitLabel(getMaterialLabel(customerSideMaterial)).line1}</tspan>
			<tspan x="440" dy="15">{splitLabel(getMaterialLabel(customerSideMaterial)).line2}</tspan>
		{:else}
			{getMaterialLabel(customerSideMaterial)}
		{/if}
	</text>
</svg>
