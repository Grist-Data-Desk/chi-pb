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
			? messages[lang].legend.aggregationLevel.censusTractsButton.slice(0, -1)
			: messages[lang].legend.aggregationLevel.censusTractsButton.slice(0, -1).toLowerCase();
		return `${prefix} ${data.geoid}`;
	}

	return '';
}

/**
 * Format the display name of a service line material given its code.
 *
 * @param material – The material code to format.
 * @param lang – The language to use.
 * @returns The formatted display name of the service line material.
 */
export function formatServiceLineMaterial(
	material: string,
	{ lang = 'en' }: { lang?: Language }
): string {
	switch (material.toUpperCase()) {
		case 'C':
			return messages[lang].serviceLineInformation.leadStatus.C;
		case 'CLS':
			return messages[lang].serviceLineInformation.leadStatus.CLS;
		case 'G':
			return messages[lang].serviceLineInformation.leadStatus.G;
		case 'GRR':
			return messages[lang].serviceLineInformation.leadStatus.GRR;
		case 'L':
			return messages[lang].serviceLineInformation.leadStatus.L;
		case 'O':
			return messages[lang].serviceLineInformation.leadStatus.O;
		case 'P':
			return messages[lang].serviceLineInformation.leadStatus.P;
		case 'U':
			return messages[lang].serviceLineInformation.leadStatus.U;
		case 'UNL':
			return messages[lang].serviceLineInformation.leadStatus.UNL;
		case 'NL':
			return messages[lang].serviceLineInformation.leadStatus.NL;
		default:
			return material;
	}
}
