// Grist brand colors
export const COLORS = {
	ORANGE: '#F79945',
	TURQUOISE: '#12A07F',
	FUCHSIA: '#AC00E8',
	COBALT: '#3977F3',
	EARTH: '#3C3830',
	RED: '#F5515B',
	GOLD: '#FFB800',
	TEAL: '#00B4B4',
	GRAY: '#808080',
	GREEN: '#00c04b',
	PALE_GREEN: '#e8f5e9',
	BLUE: '#0077cc',
	PURPLE: '#9c27b0',
	SMOG: '#f0f0f0'
} as const;

// The breakpoint for switching between mobile and desktop views
export const TABLET_BREAKPOINT = 640;

// Service line material to color mapping
export const MATERIAL_COLORS = {
	'L': COLORS.RED, // Lead
	'GRR': COLORS.ORANGE, // Galvanized Requiring Replacement
	'CLS': COLORS.ORANGE, // Copper with Lead Solder
	'C': COLORS.TURQUOISE, // Copper
	'P': COLORS.TURQUOISE, // Plastic
	'NL': COLORS.TURQUOISE, // Non-Lead
	'G': COLORS.TEAL, // Galvanized (not requiring replacement)
	'O': COLORS.COBALT, // Cast/Ductile Iron or Transite
	'UNL': COLORS.GOLD, // Unknown (Not Lead)
	'U': COLORS.GOLD, // Unknown
} as const;

// Default color for unknown materials
export const DEFAULT_MATERIAL_COLOR = COLORS.GOLD;

// Function to get material color (for use in Svelte components)
export function getMaterialColor(material: string): string {
	if (!material) {
		return DEFAULT_MATERIAL_COLOR;
	}
	
	const materialUpper = material.toUpperCase();
	return MATERIAL_COLORS[materialUpper as keyof typeof MATERIAL_COLORS] || DEFAULT_MATERIAL_COLOR;
}

// MapLibre expression for service line colors (generated from MATERIAL_COLORS)
export const SERVICE_LINE_COLOR_EXPRESSION: any = [
	'case',
	...Object.entries(MATERIAL_COLORS).flatMap(([material, color]) => [
		['==', ['get', 'material'], material], color
	]),
	DEFAULT_MATERIAL_COLOR // Default
];

