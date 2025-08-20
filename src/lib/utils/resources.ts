/**
 * Determines if a service line material qualifies for a free water filter
 * @param overallCode - The overall service line material code
 * @returns true if the material qualifies for a water filter
 */
export function qualifiesForWaterFilter(overallCode: string): boolean {
	const qualifyingCodes = ['L', 'GRR', 'CLS', 'U'];
	return qualifyingCodes.includes(overallCode?.toUpperCase() || 'U');
}
