<script lang="ts">
	import { COLORS } from '$lib/utils/constants';
	
	export let utilitySideMaterial: string = 'U';
	export let gooseneckMaterial: string = 'U';
	export let customerSideMaterial: string = 'U';
	export let overallCode: string = 'U';
	
	// Map material codes to colors
	function getMaterialColor(material: string): string {
		if (!material) return COLORS.GOLD;
		
		const materialUpper = material.toUpperCase();
		
		// Check for lead-related materials
		if (materialUpper === 'L' || materialUpper.includes('LEAD') && !materialUpper.includes('NO LEAD')) {
			return COLORS.RED;
		}
		
		// Check for materials requiring replacement
		if (materialUpper === 'GRR' || materialUpper.includes('REQUIRING REPLACEMENT')) {
			return COLORS.ORANGE;
		}
		
		// Check for lead solder
		if (materialUpper === 'CLS' || materialUpper.includes('LEAD SOLDER')) {
			return COLORS.ORANGE;
		}
		
		// Check for non-lead materials
		if (materialUpper === 'NL' || materialUpper === 'C' || materialUpper === 'P' || 
			materialUpper.includes('COPPER') && materialUpper.includes('NO LEAD') ||
			materialUpper.includes('PLASTIC') || materialUpper.includes('PVC') || 
			materialUpper.includes('HDPE') || materialUpper.includes('PEX')) {
			return COLORS.TURQUOISE;
		}
		
		// Check for galvanized (not requiring replacement)
		if (materialUpper === 'G' || (materialUpper.includes('GALVANIZED') && !materialUpper.includes('REQUIRING'))) {
			return COLORS.TEAL;
		}
		
		// Check for cast/ductile iron
		if (materialUpper === 'O' || materialUpper.includes('CAST') || materialUpper.includes('DUCTILE') || materialUpper.includes('IRON')) {
			return COLORS.COBALT;
		}
		
		// Check for unknown not lead
		if (materialUpper === 'UNL' || materialUpper.includes('UNKNOWN NOT LEAD')) {
			return COLORS.GOLD;
		}
		
		// Default to unknown
		return COLORS.GOLD;
	}
	
	$: utilityColor = getMaterialColor(utilitySideMaterial);
	$: gooseneckColor = getMaterialColor(gooseneckMaterial);
	$: customerColor = getMaterialColor(customerSideMaterial);
	
	// Get display text for materials
	function getMaterialLabel(material: string): string {
		if (!material) return 'Unknown';
		
		// If it's already a descriptive text, truncate if too long
		if (material.length > 3) {
			// Remove common prefixes for brevity
			let label = material
				.replace('Copper - No Lead Solder', 'Copper')
				.replace('Copper - Lead Solder', 'Copper w/ Lead')
				.replace('Galvanized Requiring Replacement', 'Galvanized (Replace)')
				.replace('Cast/Ductile Iron or Transite', 'Cast/Ductile Iron')
				.replace('Plastic - PVC, HDPE, PEX', 'Plastic')
				.replace('Unknown Not Lead', 'Unknown (Not Lead)');
			
			// Further truncate if still too long
			if (label.length > 20) {
				return label.substring(0, 17) + '...';
			}
			return label;
		}
		
		// Handle short codes
		switch (material.toUpperCase()) {
			case 'L': return 'Lead';
			case 'CLS': return 'Copper w/ Lead';
			case 'GRR': return 'Galvanized (Replace)';
			case 'C': return 'Copper';
			case 'G': return 'Galvanized';
			case 'O': return 'Cast/Ductile Iron';
			case 'P': return 'Plastic';
			case 'UNL': return 'Unknown (Not Lead)';
			case 'U': return 'Unknown';
			default: return material;
		}
	}
</script>

<div class="w-full">
	<!-- Service Line Diagram -->
	<svg viewBox="0 0 420 150" class="w-full h-auto max-h-40" xmlns="http://www.w3.org/2000/svg">
		<!-- Background -->
		<rect x="0" y="0" width="420" height="150" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="8"/>
		
		<!-- Section dividers -->
		<line x1="140" y1="20" x2="140" y2="110" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>
		<line x1="280" y1="20" x2="280" y2="110" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>
		
		<!-- Labels -->
		<text x="70" y="30" text-anchor="middle" class="fill-slate-600 text-xs font-medium">PWS/Utility Side</text>
		<text x="210" y="30" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Gooseneck</text>
		<text x="350" y="30" text-anchor="middle" class="fill-slate-600 text-xs font-medium">Customer Side</text>
		
		<!-- Utility Side Pipe (Wide water main) -->
		<rect x="20" y="60" width="120" height="35" fill={utilityColor} stroke="#ffffff" stroke-width="2" rx="4">
			<title>Utility Side: {getMaterialLabel(utilitySideMaterial)}</title>
		</rect>
		
		<!-- Gooseneck (Connects from side of main to customer) -->
		<g>
			<!-- Connection point on utility pipe -->
			<circle cx="140" cy="77.5" r="8" fill={gooseneckColor} stroke="#ffffff" stroke-width="2"/>
			
			<!-- Curved gooseneck path -->
			<path 
				d="M 140,77.5 Q 160,77.5 170,72 T 180,60 Q 190,48 210,48 Q 230,48 240,60 T 250,72 Q 260,77.5 280,77.5"
				fill="none"
				stroke={gooseneckColor}
				stroke-width="12"
				stroke-linecap="round"
			>
				<title>Gooseneck: {getMaterialLabel(gooseneckMaterial)}</title>
			</path>
			
			<!-- White outline for better definition -->
			<path 
				d="M 140,77.5 Q 160,77.5 170,72 T 180,60 Q 190,48 210,48 Q 230,48 240,60 T 250,72 Q 260,77.5 280,77.5"
				fill="none"
				stroke="#ffffff"
				stroke-width="15"
				stroke-linecap="round"
			/>
			
			<!-- Reapply colored path -->
			<path 
				d="M 140,77.5 Q 160,77.5 170,72 T 180,60 Q 190,48 210,48 Q 230,48 240,60 T 250,72 Q 260,77.5 280,77.5"
				fill="none"
				stroke={gooseneckColor}
				stroke-width="12"
				stroke-linecap="round"
			/>
		</g>
		
		<!-- Customer Side Pipe (Narrower) -->
		<rect x="280" y="65" width="120" height="25" fill={customerColor} stroke="#ffffff" stroke-width="2" rx="4">
			<title>Customer Side: {getMaterialLabel(customerSideMaterial)}</title>
		</rect>
		
		<!-- Material labels below pipes -->
		<text x="80" y="110" text-anchor="middle" class="fill-slate-500 text-[10px]">{getMaterialLabel(utilitySideMaterial)}</text>
		<text x="210" y="110" text-anchor="middle" class="fill-slate-500 text-[10px]">{getMaterialLabel(gooseneckMaterial)}</text>
		<text x="340" y="110" text-anchor="middle" class="fill-slate-500 text-[10px]">{getMaterialLabel(customerSideMaterial)}</text>
		
		<!-- Overall classification indicator -->
		<g transform="translate(210, 130)">
			<rect x="-70" y="-11" width="140" height="22" fill={getMaterialColor(overallCode)} stroke="#ffffff" stroke-width="2" rx="11" opacity="0.9"/>
			<text x="0" y="4" text-anchor="middle" class="fill-white text-xs font-bold">
				{overallCode === 'L' ? 'Lead Service Line' : overallCode === 'GRR' ? 'Galvanized (Replace)' : overallCode === 'NL' ? 'Non-Lead Service' : 'Unknown Status'}
			</text>
		</g>
	</svg>
</div>

<style>
	text {
		font-family: 'Basis Grotesque', system-ui, sans-serif;
	}
</style>