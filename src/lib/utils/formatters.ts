import { messages, type Language } from '$lib/i18n/messages';
import type { CensusTract, CommunityArea } from '$lib/types';

/**
 * Format a number as a count string, returning 'N/A' if the value is null or
 * undefined.
 * @param value - The number to format.
 * @returns The formatted count string.
 */
export function formatCount(value: number | null): string {
	if (value === null) return 'N/A';
	return value.toLocaleString();
}

/**
 * Format a number as a currency string in USD.
 * @param value - The number to format.
 * @returns The formatted currency string in USD.
 */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value);
}

/**
 * Format a number as a percentage string to 1 decimal place.
 * @param value - The number to format.
 * @returns The formatted percentage string.
 */
export function formatPercent(value: number | null): string {
	if (value === null) return 'N/A';
	return `${value.toFixed(1)}%`;
}

/**
 * Format a title for a census tract or community area.
 * @param data - The census tract or community area to format.
 * @param capitalizeCensusTract - Whether to capitalize the census tract prefix.
 * @returns The formatted title.
 */
export function formatAreaIdentifier(
	data: CensusTract | CommunityArea | null,
	{
		capitalizeCensusTract = true,
		lang = 'en'
	}: {
		capitalizeCensusTract?: boolean;
		lang?: Language;
	}
): string {
	if (data && 'community' in data) {
		return data.community;
	} else if (data && 'geoid' in data) {
		const prefix = capitalizeCensusTract
			? messages[lang].areaContext.censusTractLabel.charAt(0).toUpperCase() +
				messages[lang].areaContext.censusTractLabel.slice(1)
			: messages[lang].areaContext.censusTractLabel;
		return `${prefix} ${data.geoid}`;
	}

	return '';
}
