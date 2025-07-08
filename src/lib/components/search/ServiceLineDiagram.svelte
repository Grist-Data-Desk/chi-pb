<script lang="ts">
	import { COLORS } from '$lib/utils/constants';
	import { multiServiceLineStore, serviceLineCount } from '$lib/stores';
	
	export let utilitySideMaterial: string = 'U';
	export let gooseneckMaterial: string = 'U';
	export let customerSideMaterial: string = 'U';
	export let overallCode: string = 'U';
	
	// Map material codes to colors based on the schema
	function getMaterialColor(material: string): string {
		if (!material) return COLORS.GOLD;
		
		const materialUpper = material.toUpperCase();
		
		// Lead materials (red)
		if (materialUpper === 'L') {
			return COLORS.RED;
		}
		
		// Galvanized Requiring Replacement (orange)
		if (materialUpper === 'GRR') {
			return COLORS.ORANGE;
		}
		
		// Copper with Lead Solder (orange)
		if (materialUpper === 'CLS') {
			return COLORS.ORANGE;
		}
		
		// Non-lead materials (turquoise)
		if (materialUpper === 'C' || // Copper - No Lead Solder
			materialUpper === 'P' || // Plastic - PVC, HDPE, PEX
			materialUpper === 'NL') { // Non-Lead classification
			return COLORS.TURQUOISE;
		}
		
		// Galvanized (not requiring replacement) (teal)
		if (materialUpper === 'G') {
			return COLORS.TEAL;
		}
		
		// Cast/Ductile Iron or Transite (cobalt)
		if (materialUpper === 'O') {
			return COLORS.COBALT;
		}
		
		// Unknown not lead (gold)
		if (materialUpper === 'UNL') {
			return COLORS.GOLD;
		}
		
		// Unknown (gold)
		if (materialUpper === 'U') {
			return COLORS.GOLD;
		}
		
		// Default to unknown
		return COLORS.GOLD;
	}
	
	$: utilityColor = getMaterialColor(utilitySideMaterial);
	$: gooseneckColor = getMaterialColor(gooseneckMaterial);
	$: customerColor = getMaterialColor(customerSideMaterial);
	
	// Get display text for materials based on the schema codes
	function getMaterialLabel(material: string): string {
		if (!material) return 'Unknown';
		
		// Handle codes based on the schema
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
				return 'Unknown';
			case 'UNL': 
				return 'Unknown Not Lead';
			case 'NL': 
				return 'Non-Lead';
			default: 
				return material;
		}
	}
</script>

<div class="w-full">
	<!-- Service Line Diagram -->
	<svg viewBox="0 0 480 170" class="w-full h-auto max-h-40" xmlns="http://www.w3.org/2000/svg">
		<!-- Background -->
		<rect x="0" y="0" width="480" height="170" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="8"/>
		
		<!-- Overall classification indicator -->
		<g transform="translate(240, 25)">
			<rect x="-75" y="-12" width="150" height="24" fill={getMaterialColor(overallCode)} stroke="#ffffff" stroke-width="2" rx="12" opacity="0.9"/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-sm font-bold">
				{overallCode === 'L' ? 'Lead' : 
				 overallCode === 'GRR' ? 'Galvanized Requiring Replacement' : 
				 overallCode === 'NL' ? 'Non-Lead' : 
				 overallCode === 'U' ? 'Unknown' : 
				 'Unknown Status'}
			</text>
		</g>
		
		<!-- Service line counter indicator if multiple -->
		{#if $serviceLineCount > 1}
			<g transform="translate(430, 25)">
				<circle cx="0" cy="0" r="15" fill={COLORS.COBALT} stroke="#ffffff" stroke-width="2" opacity="0.9"/>
				<text x="0" y="4" text-anchor="middle" class="fill-white text-xs font-bold">
					{$multiServiceLineStore.currentIndex + 1}/{$serviceLineCount}
				</text>
			</g>
		{/if}
		
		<!-- Labels -->
		<text x="40" y="65" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Water main</text>
		<text x="140" y="65" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Gooseneck</text>
		<text x="270" y="65" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Utility side</text>
		<text x="400" y="65" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Customer side</text>
		
		<!-- Water main (Circle on far left) -->
		<circle cx="40" cy="112.5" r="25" fill={COLORS.EARTH} stroke="#ffffff" stroke-width="2">
			<title>Water main</title>
		</circle>
		
		<!-- Gooseneck (Connects water main to utility side) -->
		<g>
			<!-- S-curve gooseneck path -->
			<path 
				d="M 65,112.5 C 100,112.5 100,95 132.5,95 C 167.5,95 167.5,112.5 200,112.5"
				fill="none"
				stroke={gooseneckColor}
				stroke-width="12"
				stroke-linecap="round"
			>
				<title>Gooseneck: {getMaterialLabel(gooseneckMaterial)}</title>
			</path>
			
			<!-- White outline for better definition -->
			<path 
				d="M 65,112.5 C 100,112.5 100,95 132.5,95 C 167.5,95 167.5,112.5 200,112.5"
				fill="none"
				stroke="#ffffff"
				stroke-width="15"
				stroke-linecap="round"
			/>
			
			<!-- Reapply colored path -->
			<path 
				d="M 65,112.5 C 100,112.5 100,95 132.5,95 C 167.5,95 167.5,112.5 200,112.5"
				fill="none"
				stroke={gooseneckColor}
				stroke-width="12"
				stroke-linecap="round"
			/>
		</g>
		
		<!-- Utility Side Pipe -->
		<rect x="200" y="95" width="140" height="35" fill={utilityColor} stroke="#ffffff" stroke-width="2" rx="4">
			<title>Utility Side: {getMaterialLabel(utilitySideMaterial)}</title>
		</rect>
		
		<!-- Customer Side Pipe (Narrower) -->
		<rect x="340" y="100" width="120" height="25" fill={customerColor} stroke="#ffffff" stroke-width="2" rx="4">
			<title>Customer Side: {getMaterialLabel(customerSideMaterial)}</title>
		</rect>
		
		<!-- Material labels below pipes -->
		<text x="140" y="150" text-anchor="middle" class="fill-slate-500 text-xs font-medium">{getMaterialLabel(gooseneckMaterial)}</text>
		<text x="270" y="150" text-anchor="middle" class="fill-slate-500 text-xs font-medium">{getMaterialLabel(utilitySideMaterial)}</text>
		<text x="400" y="150" text-anchor="middle" class="fill-slate-500 text-xs font-medium">{getMaterialLabel(customerSideMaterial)}</text>
	</svg>
</div>

<style>
	text {
		font-family: 'Basis Grotesque', system-ui, sans-serif;
	}
</style>