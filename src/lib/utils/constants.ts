import type { ExpressionSpecification } from 'maplibre-gl';

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
	GREEN: '#00c04b',
	PALE_GREEN: '#e8f5e9',
	BLUE: '#0077cc',
	PURPLE: '#9c27b0',
	SMOG: '#f0f0f0',
	INT_RED: '#CE4746',
	INT_BLUE: '#457AB3'
} as const;

// The breakpoint for switching between mobile and desktop views
export const TABLET_BREAKPOINT = 640;

// Service line material to color mapping
export const DISPLAY_CODES_TO_MATERIAL_COLORS = {
	L: COLORS.INT_RED, // Lead
	GRR: COLORS.INT_RED, // Galvanized Requiring Replacement
	CLS: COLORS.INT_RED, // Copper with Lead Solder
	C: COLORS.INT_BLUE, // Copper
	P: COLORS.INT_BLUE, // Plastic
	NL: COLORS.INT_BLUE, // Non-Lead
	G: COLORS.INT_BLUE, // Galvanized (not requiring replacement)
	O: COLORS.INT_BLUE, // Cast/Ductile Iron or Transite
	UNL: COLORS.INT_BLUE, // Unknown (Not Lead)
	U: COLORS.INT_RED // Unknown
} as const;

// Default color for unknown materials
export const DEFAULT_MATERIAL_COLOR = COLORS.INT_RED;

export const DISPLAY_CODES_TO_MATERIAL_LABELS = {
	L: 'Lead',
	GRR: 'Galvanized (Replace)',
	NL: 'Non-Lead'
} as const;

export const DISPLAY_CODES_TO_MATERIAL_LABELS_SOCIAL = {
	L: 'Lead',
	GRR: 'Galvanized Requiring Replacement',
	NL: 'Non-Lead'
} as const;

// Function to get material color (for use in Svelte components)
export function getMaterialColor(material: string): string {
	if (!material) {
		return DEFAULT_MATERIAL_COLOR;
	}

	const materialUpper = material.toUpperCase();
	return (
		DISPLAY_CODES_TO_MATERIAL_COLORS[
			materialUpper as keyof typeof DISPLAY_CODES_TO_MATERIAL_COLORS
		] || DEFAULT_MATERIAL_COLOR
	);
}

// MapLibre expression for service line colors (generated from MATERIAL_COLORS)
export const SERVICE_LINE_COLOR_EXPRESSION: ExpressionSpecification = [
	'match',
	['get', 'material'],
	Object.keys(DISPLAY_CODES_TO_MATERIAL_COLORS)[0],
	Object.values(DISPLAY_CODES_TO_MATERIAL_COLORS)[0],
	...Object.entries(DISPLAY_CODES_TO_MATERIAL_COLORS)
		.slice(1)
		.flatMap(([material, color]) => [material, color]),
	DEFAULT_MATERIAL_COLOR
];
