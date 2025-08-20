export type ServiceLineClassification = 'lead' | 'suspected' | 'galvanized' | 'non-lead';

export const SERVICE_LINE_DEFINITIONS: Record<ServiceLineClassification, string> = {
	lead: 'At least one component of the service line is known to be made of lead.',
	suspected:
		"The composition of the service line is marked unknown in the city's inventory, but is suspected to contain lead components, usually based on the building's age.",
	galvanized:
		'No components of the service line are known to be made from lead, but at least one part is made of galvanized steel, which can become contaminated with lead from upstream pipes.',
	'non-lead': 'None of the components of the service line are made from or may be contaminated with lead.'
};

export interface TooltipPosition {
	top: number;
	left: number;
}

export interface TooltipConfig {
	width?: number;
	height?: number;
	padding?: number;
}

/**
 * Calculates the optimal position for a tooltip to avoid viewport edges
 * @param triggerRect - The bounding rect of the element that triggers the tooltip
 * @param config - Configuration for tooltip dimensions and padding
 * @returns The calculated position for the tooltip
 */
/**
 * Generates inline JavaScript for tooltip positioning
 * This is used in HTML string contexts where we can't import modules
 */
export function getTooltipPositioningScript(): string {
	return `
		function positionTooltip(trigger, content, width = 200, height = 50) {
			const rect = trigger.getBoundingClientRect();
			const padding = 8;
			
			// Default position: to the right of the icon
			let left = rect.right + 8;
			let top = rect.top + rect.height / 2 - height / 2;
			
			// If tooltip would go off the right edge, show it to the left instead
			if (left + width > window.innerWidth - padding) {
				left = rect.left - width - 8;
			}
			
			// Adjust if tooltip would still go off the left edge
			if (left < padding) {
				left = padding;
			}
			
			// Adjust for top edge
			if (top < padding) {
				top = padding;
			}
			
			// Adjust for bottom edge
			if (top + height > window.innerHeight - padding) {
				top = window.innerHeight - height - padding;
			}
			
			content.style.left = left + 'px';
			content.style.top = top + 'px';
		}
	`;
}

export function calculateTooltipPosition(
	triggerRect: DOMRect,
	config: TooltipConfig = {}
): TooltipPosition {
	const { width = 256, height = 60, padding = 8 } = config;

	// Default position: to the right of the trigger
	let left = triggerRect.right + 8;
	let top = triggerRect.top + triggerRect.height / 2 - height / 2;

	// If tooltip would go off the right edge, show it to the left instead
	if (left + width > window.innerWidth - padding) {
		left = triggerRect.left - width - 8;
	}

	// Adjust if tooltip would still go off the left edge
	if (left < padding) {
		left = padding;
	}

	// Adjust if tooltip would go off the top edge
	if (top < padding) {
		top = padding;
	}

	// Adjust if tooltip would go off the bottom edge
	if (top + height > window.innerHeight - padding) {
		top = window.innerHeight - height - padding;
	}

	return { top, left };
}