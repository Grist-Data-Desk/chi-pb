<script lang="ts">
	import { interpolateReds } from 'd3-scale-chromatic';
	import { debounce } from 'lodash-es';
	import type { Map } from 'maplibre-gl';

	import SearchSuggestions from '$lib/components/search/SearchSuggestions.svelte';
	import ServiceLineResults from '$lib/components/search/ServiceLineResults.svelte';
	import { search } from '$lib/state/search.svelte';
	import { ui } from '$lib/state/ui.svelte';
	import { visualization } from '$lib/state/visualization.svelte';
	import {
		isAddressDataLoading,
		addressStore,
		minimalSearchIndexStore,
		combinedIndexStore,
		multiServiceLineStore,
		currentServiceLine
	} from '$lib/stores';
	import type {
		AddressWithServiceLine,
		InventoryApiResponse,
		InventoryData,
		MinimalAddress,
		CombinedAddress
	} from '$lib/types';
	import { COLORS } from '$lib/utils/constants';
	import {
		isCoordinatePair,
		searchNominatim,
		reverseGeocode,
		formatNominatimAddress
	} from '$lib/utils/nominatim';
	import type { NominatimResult } from '$lib/utils/nominatim';

	// Props.
	interface Props {
		map: Map | null;
	}

	let { map }: Props = $props();

	// Derived colors - matching search button hue
	const searchButtonColor = interpolateReds(0.5);

	// State.
	let suggestions = $state<AddressWithServiceLine[]>([]);
	let isFetchingSuggestions = $state(false);
	let showSuggestions = $state(false);
	let input = $state<HTMLInputElement | null>(null);
	let suggestionsContainer = $state<HTMLDivElement | null>(null);
	let selectedIndex = $state<number>(-1);
	let nominatimSuggestions = $state<AddressWithServiceLine[]>([]);
	let inventory = $state<{
		isLoading: boolean;
		data: InventoryData | null;
		error: string | null;
		address: string | null;
	}>({
		isLoading: false,
		data: null,
		error: null,
		address: null
	});

	// Perform Nominatim search when no inventory results are found
	async function performNominatimSearch(query: string): Promise<void> {
		// Check if it's a coordinate pair first
		const coords = isCoordinatePair(query);

		nominatimSuggestions = [];

		try {
			let result: NominatimResult | null = null;

			if (coords) {
				// Reverse geocode the coordinates
				result = await reverseGeocode(coords.lat, coords.lon);
			} else {
				// Search for the address
				result = await searchNominatim(query);
			}

			if (result) {
				// Format the address to match inventory style
				const formattedAddress = formatNominatimAddress(result.display_name);

				// Create a simplified suggestion for Nominatim results
				const nominatimAddress: AddressWithServiceLine = {
					row: -1, // Special marker for Nominatim addresses
					fullAddress: formattedAddress,
					isIntersection: false,
					stnum1: 0,
					stnum2: 0,
					stdir: '',
					stname: '',
					sttype: '',
					zip: '',
					geocoder: 'nominatim',
					lat: parseFloat(result.lat),
					long: parseFloat(result.lon),
					geoid: '',
					leadStatus: 'UNKNOWN',
					hasLead: false,
					mIsIntersection: false,
					mStnum1: 0,
					mStnum2: 0,
					mStdir: '',
					mStname: '',
					mZip: ''
				};

				nominatimSuggestions = [nominatimAddress];
			}
		} catch (error) {
			console.error('Error performing Nominatim search:', error);
		}
	}

	// Event handlers.
	const handleSearch = () => {
		// Enter key or search button just triggers selection if we have suggestions
		if (showSuggestions && selectedIndex >= 0) {
			const allSuggestions = [...suggestions, ...nominatimSuggestions];
			if (selectedIndex < allSuggestions.length) {
				onSuggestionClick(allSuggestions[selectedIndex]);
			}
		}
	};

	// Some normalization for address variants
	function normalizeAddress(address: string): string {
		let normalized = address
			.toLowerCase()
			// Preserve & for intersection detection before removing other punctuation
			.replace(/\band\b/g, '&') // Replace "and" with "&" for consistent intersection handling
			.replace(/[^\w\s&]/g, ' ') // Keep & for now
			.replace(/\s+/g, ' ')
			.trim();

		// Some street type variants
		const streetTypeReplacements = {
			avenue: 'ave',
			street: 'st',
			saint: 'st',
			boulevard: 'blvd',
			parkway: 'park',
			terrace: 'ter',
			plaza: 'plz',
			place: 'pl',
			court: 'ct',
			drive: 'dr',
			lane: 'ln',
			road: 'rd',
			circle: 'cir'
		};

		for (const [full, abbrev] of Object.entries(streetTypeReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
		}

		// Some street name variants
		const streetNameReplacements = {
			'martin luther king jr': 'king',
			'martin l king jr': 'king',
			lakeshore: 'lake shore',
			crestline: 'crest line',
			blueisland: 'blue island',
			'blue island': 'blueisland',
			dekoven: 'de koven',
			'de koven': 'dekoven',
			desplaines: 'des plaines',
			'des plaines': 'desplaines'
		};

		for (const [variant, standard] of Object.entries(streetNameReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), standard);
		}

		// Some prefix variants (LA, MC, O)
		normalized = normalized
			.replace(/\bla\s+/g, 'la') // "LA SALLE" -> "lasalle"
			.replace(/\bmc\s+/g, 'mc') // "MC VICKER" -> "mcvicker"
			.replace(/\bo\s+/g, 'o'); // "O BRIEN" -> "obrien"

		// Direction variants (N, S, E, W, NE, NW, SE, SW)
		const directions = [
			'north',
			'south',
			'east',
			'west',
			'northeast',
			'northwest',
			'southeast',
			'southwest'
		];
		const directionAbbrevs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

		directions.forEach((dir, i) => {
			normalized = normalized.replace(new RegExp(`\\b${dir}\\b`, 'g'), directionAbbrevs[i]);
		});

		// Final cleanup - remove & unless it's being used for intersection detection
		normalized = normalized
			.replace(/[^\w\s&]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		return normalized;
	}

	function extractNumberFromQuery(query: string): number | null {
		const match = query.match(/^\d+/);
		return match ? parseInt(match[0]) : null;
	}

	function searchAddressesCombined(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];

		const combinedIndex = $combinedIndexStore.index;
		if (!combinedIndex) {
			console.log('Combined index not loaded, falling back to minimal search index');
			return searchAddressesOptimized(query);
		}

		console.log('Using combined index:', {
			totalAddresses: combinedIndex.addresses?.length,
			streetNames: Object.keys(combinedIndex.streets || {}).length,
			version: combinedIndex.metadata?.version
		});

		const queryNumber = extractNumberFromQuery(query.trim());

		// Similar search logic but adapted for CombinedAddress structure
		const matchingAddresses: CombinedAddress[] = [];
		const streetPart = queryNumber !== null ? query.trim().replace(/^\d+\s*/, '') : query.trim();
		const normalizedStreetPart = normalizeAddress(streetPart);

		if (queryNumber !== null && normalizedStreetPart.length > 0) {
			// Find addresses where the number is in range AND the street matches
			combinedIndex.addresses.forEach((addr) => {
				if (addr.n1 > 0 && addr.n2 > 0 && queryNumber >= addr.n1 && queryNumber <= addr.n2) {
					// Only match against the street portion of the address, not the city
					// addr.a is already in the format "1234 N CHICAGO AVE, 60601" or similar
					// We want to exclude the zip code from matching to avoid matching "chicago" against city name
					const streetPortion = addr.a.replace(/, \d{5}$/, ''); // Remove zip code
					const normalizedAddr = normalizeAddress(streetPortion);
					const addressWords = normalizedAddr.split(/\s+/);
					const streetWords = normalizedStreetPart.split(/\s+/).filter((w) => w.length > 0);

					const allStreetWordsMatch = streetWords.every((queryWord) => {
						// Don't skip any words - even single letters should be matched
						return addressWords.some(
							(addrWord) =>
								addrWord.startsWith(queryWord) ||
								(queryWord.length > 2 && addrWord.includes(queryWord))
						);
					});

					if (allStreetWordsMatch) {
						matchingAddresses.push(addr);
					}
				}
			});
		} else if (queryNumber !== null) {
			// Just number search
			combinedIndex.addresses.forEach((addr) => {
				// For single addresses (n1 === n2), match exact number
				// For range addresses (n1 !== n2), only match if the range starts with our number
				if (addr.n1 === addr.n2) {
					// Single address - exact match
					if (addr.n1 === queryNumber) {
						matchingAddresses.push(addr);
					}
				} else {
					// Range address - only match if it starts with our query number
					if (addr.n1 === queryNumber) {
						matchingAddresses.push(addr);
					}
				}
			});
		} else if (normalizedStreetPart.length > 0) {
			// Check if this is an intersection query (contains & or was normalized from "and")
			const isIntersectionQuery = normalizedStreetPart.includes('&');

			if (isIntersectionQuery) {
				// Handle intersection search
				const streets = normalizedStreetPart
					.split('&')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);

				if (streets.length >= 2) {
					// Find addresses that match ALL streets in the intersection
					const streetMatchSets = streets.map((street) => {
						const streetIds = new Set<number>();
						const streetWords = street.split(/\s+/).filter((w) => w.length > 0);

						// Use the efficient street index
						streetWords.forEach((word) => {
							if (word.length >= 1) {
								// Check all street index keys for matches
								Object.keys(combinedIndex.streets).forEach((streetKey) => {
									if (!streetKey.endsWith('*') && streetKey.includes(word)) {
										const ids = combinedIndex.streets[streetKey];
										if (Array.isArray(ids)) {
											// Add all IDs that match this word
											ids.forEach((id) => streetIds.add(id));
										}
									}
								});
							}
						});

						// Filter to only keep addresses where ALL words match
						const filteredIds = new Set<number>();
						streetIds.forEach((id) => {
							if (id >= 0 && id < combinedIndex.addresses.length) {
								const addr = combinedIndex.addresses[id];
								// addr.a contains the address, addr.z contains zip
								const fullAddr = addr.a.includes(addr.z)
									? addr.a.replace(/, (\d{5})$/, ', CHICAGO, IL $1')
									: addr.a + ', CHICAGO, IL ' + addr.z;
								const normalizedDisplay = normalizeAddress(fullAddr);

								// Check if all words from this street are in the address
								const allWordsMatch = streetWords.every((word) => {
									// Check all words including single letters
									return normalizedDisplay.includes(word);
								});

								if (allWordsMatch) {
									filteredIds.add(id);
								}
							}
						});

						return filteredIds;
					});

					// Find intersection - addresses that match ALL streets
					if (streetMatchSets.length >= 2) {
						const intersection = streetMatchSets.reduce((a, b) => {
							return new Set([...a].filter((x) => b.has(x)));
						});

						intersection.forEach((id) => {
							if (id >= 0 && id < combinedIndex.addresses.length) {
								matchingAddresses.push(combinedIndex.addresses[id]);
							}
						});
					}
				}
			} else {
				// Regular street search - use the street index
				const resultIds = new Set<number>();
				const streetWords = normalizedStreetPart.split(/\s+/);

				streetWords.forEach((word) => {
					if (word.length >= 1) {
						Object.keys(combinedIndex.streets).forEach((streetKey) => {
							if (!streetKey.endsWith('*') && streetKey.startsWith(word)) {
								const ids = combinedIndex.streets[streetKey];
								if (Array.isArray(ids)) {
									ids.forEach((id) => resultIds.add(id));
								}
							}
						});
					}
				});

				resultIds.forEach((id) => {
					if (id >= 0 && id < combinedIndex.addresses.length) {
						matchingAddresses.push(combinedIndex.addresses[id]);
					}
				});
			}
		}

		// Sort and deduplicate
		matchingAddresses.sort((a, b) => {
			if (queryNumber !== null) {
				const aExactNumber = queryNumber >= a.n1 && queryNumber <= a.n2 ? 0 : 1;
				const bExactNumber = queryNumber >= b.n1 && queryNumber <= b.n2 ? 0 : 1;
				if (aExactNumber !== bExactNumber) return aExactNumber - bExactNumber;
			}
			return 0;
		});

		const seen = new Set<string>();
		const deduplicatedAddresses = matchingAddresses.filter((addr) => {
			// addr.a already contains the zip code after the generator fix
			const display = addr.a.includes(addr.z)
				? addr.a.replace(/, (\d{5})$/, ', CHICAGO, IL $1')
				: addr.a + ', CHICAGO, IL ' + addr.z;
			if (seen.has(display)) {
				return false;
			}
			seen.add(display);
			return true;
		});

		const topResults = deduplicatedAddresses.slice(0, 5);

		// Convert to AddressWithServiceLine format
		return topResults.map((addr) => {
			// Check if this is a ranged address
			let displayAddress = addr.a;
			if (addr.n1 !== addr.n2 && addr.n1 > 0 && addr.n2 > 0) {
				// This is a ranged address - format it as "947-959 W CHICAGO AVE"
				// First, we need to replace the single number with the range
				const addressParts = addr.a.split(' ');
				if (addressParts[0] && /^\d+$/.test(addressParts[0])) {
					// Replace the first number with the range
					addressParts[0] = `${addr.n1}–${addr.n2}`; // Using en dash
					displayAddress = addressParts.join(' ');
				}
			}

			// addr.a (or displayAddress) already contains the zip code after the generator fix
			const fullAddress = displayAddress.includes(addr.z)
				? displayAddress.replace(/, (\d{5})$/, ', CHICAGO, IL $1')
				: displayAddress + ', CHICAGO, IL ' + addr.z;

			// Parse address components
			const addressParts = addr.a.split(' ');
			let stname = '';
			let stdir = '';
			let sttype = '';

			let startIndex = 0;
			if (addressParts[0] && /^\d+(-\d+)?$/.test(addressParts[0])) {
				startIndex = 1;
			}

			if (addressParts[startIndex] && /^[NSEW]$|^(NE|NW|SE|SW)$/i.test(addressParts[startIndex])) {
				stdir = addressParts[startIndex];
				startIndex++;
			}

			const remainingParts = addressParts.slice(startIndex);
			if (remainingParts.length > 0) {
				const lastPart = remainingParts[remainingParts.length - 1];
				const streetTypes = [
					'ST',
					'AVE',
					'DR',
					'RD',
					'LN',
					'CT',
					'PL',
					'BLVD',
					'WAY',
					'PKWY',
					'CIR',
					'TER'
				];
				if (streetTypes.includes(lastPart.toUpperCase())) {
					sttype = lastPart;
					stname = remainingParts.slice(0, -1).join(' ');
				} else {
					stname = remainingParts.join(' ');
				}
			}

			// Map material code
			let leadStatus: 'LEAD' | 'NON_LEAD' | 'UNKNOWN' = 'UNKNOWN';
			if (addr.m === 'L') leadStatus = 'LEAD';
			else if (addr.m === 'N') leadStatus = 'NON_LEAD';

			return {
				row: addr.r,
				fullAddress: fullAddress,
				isIntersection: false,
				stnum1: addr.n1,
				stnum2: addr.n2,
				stdir: stdir,
				stname: stname,
				sttype: sttype,
				zip: addr.z,
				geocoder: 'combined-index',
				lat: addr.la,
				long: addr.lo,
				geoid: '',
				leadStatus: leadStatus,
				hasLead: leadStatus === 'LEAD',
				mIsIntersection: false,
				mStnum1: addr.n1,
				mStnum2: addr.n2,
				mStdir: stdir,
				mStname: stname,
				mZip: addr.z
			} as AddressWithServiceLine;
		});
	}

	function searchAddressesOptimized(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];

		const searchIndex = $minimalSearchIndexStore.index;
		if (!searchIndex) {
			console.log('Minimal search index not loaded, falling back to legacy search');
			return searchAddressesLegacy(query);
		}

		console.log('Using minimal search index:', {
			totalAddresses: searchIndex.addresses?.length,
			streetNames: Object.keys(searchIndex.streetNames || {}).length,
			version: searchIndex.metadata?.version
		});

		const normalizedQuery = normalizeAddress(query);
		const queryNumber = extractNumberFromQuery(query.trim());

		// Extract street part from query (everything after the number)
		const streetPart = queryNumber !== null ? query.trim().replace(/^\d+\s*/, '') : query.trim();
		const normalizedStreetPart = normalizeAddress(streetPart);

		console.log('Search query analysis:', {
			originalQuery: query,
			normalizedQuery,
			queryNumber,
			streetPart,
			normalizedStreetPart,
			streetWords: normalizedStreetPart.split(/\s+/).filter((w) => w.length > 0)
		});

		// For queries with both number and street, we need to find addresses that match BOTH
		const matchingAddresses: MinimalAddress[] = [];

		if (queryNumber !== null && normalizedStreetPart.length > 0) {
			// Find addresses where the number is in range AND the street matches
			searchIndex.addresses.forEach((addr) => {
				// Check if query number falls within the address range
				if (
					addr.num1 > 0 &&
					addr.num2 > 0 &&
					queryNumber >= addr.num1 &&
					queryNumber <= addr.num2
				) {
					// Now check if the street part matches
					const normalizedAddr = normalizeAddress(addr.display);
					const addressWords = normalizedAddr.split(/\s+/);
					const streetWords = normalizedStreetPart.split(/\s+/).filter((w) => w.length > 0);

					// All query street words must match (using prefix matching)
					const allStreetWordsMatch = streetWords.every((queryWord) => {
						// Don't skip any words - even single letters should be matched
						// Check if any address word starts with the query word (prefix match)
						return addressWords.some(
							(addrWord) =>
								addrWord.startsWith(queryWord) ||
								(queryWord.length > 2 && addrWord.includes(queryWord))
						);
					});

					if (allStreetWordsMatch) {
						matchingAddresses.push(addr);
						console.log('Found match:', {
							address: addr.display,
							queryNumber: queryNumber,
							streetWords: streetWords,
							addressWords: addressWords
						});
					}
				}
			});
		} else if (queryNumber !== null) {
			// Just number search (find all addresses in that range)
			searchIndex.addresses.forEach((addr) => {
				if (
					addr.num1 > 0 &&
					addr.num2 > 0 &&
					queryNumber >= addr.num1 &&
					queryNumber <= addr.num2
				) {
					matchingAddresses.push(addr);
				}
			});
		} else if (normalizedStreetPart.length > 0) {
			// Check if this is an intersection query (contains & or was normalized from "and")
			const isIntersectionQuery = normalizedStreetPart.includes('&');

			if (isIntersectionQuery) {
				// Handle intersection search
				const streets = normalizedStreetPart
					.split('&')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);

				if (streets.length >= 2) {
					// Find addresses that match ALL streets in the intersection
					const streetMatchSets = streets.map((street) => {
						const streetIds = new Set<number>();
						const streetWords = street.split(/\s+/).filter((w) => w.length > 0);

						// Use the efficient street index instead of iterating all addresses
						streetWords.forEach((word) => {
							if (word.length >= 1) {
								// Check all street index keys for matches
								Object.keys(searchIndex.streetNames).forEach((streetKey) => {
									if (!streetKey.endsWith('*') && streetKey.includes(word)) {
										const ids = searchIndex.streetNames[streetKey];
										if (Array.isArray(ids)) {
											// Add all IDs that match this word
											ids.forEach((id) => streetIds.add(id));
										}
									}
								});
							}
						});

						// Filter to only keep addresses where ALL words match
						const filteredIds = new Set<number>();
						streetIds.forEach((id) => {
							if (id >= 0 && id < searchIndex.addresses.length) {
								const addr = searchIndex.addresses[id];
								const normalizedDisplay = normalizeAddress(addr.display);

								// Check if all words from this street are in the address
								const allWordsMatch = streetWords.every((word) => {
									// Check all words including single letters
									return normalizedDisplay.includes(word);
								});

								if (allWordsMatch) {
									filteredIds.add(id);
								}
							}
						});

						return filteredIds;
					});

					// Find intersection - addresses that match ALL streets
					if (streetMatchSets.length >= 2) {
						const intersection = streetMatchSets.reduce((a, b) => {
							return new Set([...a].filter((x) => b.has(x)));
						});

						intersection.forEach((id) => {
							if (id >= 0 && id < searchIndex.addresses.length) {
								matchingAddresses.push(searchIndex.addresses[id]);
							}
						});
					}
				}
			} else {
				// Regular street search - use the street index
				const resultIds = new Set<number>();
				const streetWords = normalizedStreetPart.split(/\s+/);

				streetWords.forEach((word) => {
					if (word.length >= 1) {
						// Check all street index keys for matches
						Object.keys(searchIndex.streetNames).forEach((streetKey) => {
							if (!streetKey.endsWith('*') && streetKey.startsWith(word)) {
								const ids = searchIndex.streetNames[streetKey];
								if (Array.isArray(ids)) {
									ids.forEach((id) => resultIds.add(id));
								}
							}
						});
					}
				});

				// Convert IDs to addresses
				resultIds.forEach((id) => {
					if (id >= 0 && id < searchIndex.addresses.length) {
						matchingAddresses.push(searchIndex.addresses[id]);
					}
				});
			}
		}

		console.log(`Found ${matchingAddresses.length} matches for query "${query}"`);

		// Sort results by relevance
		matchingAddresses.sort((a, b) => {
			// Prioritize exact number matches
			if (queryNumber !== null) {
				const aExactNumber = queryNumber >= a.num1 && queryNumber <= a.num2 ? 0 : 1;
				const bExactNumber = queryNumber >= b.num1 && queryNumber <= b.num2 ? 0 : 1;
				if (aExactNumber !== bExactNumber) return aExactNumber - bExactNumber;

				// Then by number proximity
				const aMidpoint = (a.num1 + a.num2) / 2;
				const bMidpoint = (b.num1 + b.num2) / 2;
				const aDistance = Math.abs(queryNumber - aMidpoint);
				const bDistance = Math.abs(queryNumber - bMidpoint);
				if (aDistance !== bDistance) return aDistance - bDistance;
			}

			// Then by street matching quality
			if (normalizedStreetPart.length > 0) {
				const aNormalized = normalizeAddress(a.display);
				const bNormalized = normalizeAddress(b.display);
				const aStreetMatch = aNormalized.includes(normalizedStreetPart) ? 0 : 1;
				const bStreetMatch = bNormalized.includes(normalizedStreetPart) ? 0 : 1;
				if (aStreetMatch !== bStreetMatch) return aStreetMatch - bStreetMatch;
			}

			return 0;
		});

		// Deduplicate addresses by display name
		const seen = new Set<string>();
		const deduplicatedAddresses = matchingAddresses.filter((addr) => {
			if (seen.has(addr.display)) {
				return false;
			}
			seen.add(addr.display);
			return true;
		});

		// Limit to 5 results
		const topResults = deduplicatedAddresses.slice(0, 5);

		// Convert to AddressWithServiceLine format
		return topResults.map((minimalAddr) => {
			// Check if this is a ranged address and format accordingly
			let displayAddress = minimalAddr.display;
			if (minimalAddr.num1 !== minimalAddr.num2 && minimalAddr.num1 > 0 && minimalAddr.num2 > 0) {
				// This is a ranged address - ensure it shows the full range
				const addressParts = minimalAddr.display.split(' ');
				if (addressParts[0] && /^\d+(-\d+)?$/.test(addressParts[0])) {
					// Replace the first number/range with our standardized range format
					addressParts[0] = `${minimalAddr.num1}–${minimalAddr.num2}`; // Using en dash
					displayAddress = addressParts.join(' ');
				}
			}

			// Extract street components from the display address to preserve original street names
			// The display field contains the full formatted address like "12100-14 S Front St"
			const addressParts = displayAddress.split(' ');
			let stname = '';
			let stdir = '';
			let sttype = '';

			// Parse address to extract street name components
			// Skip house numbers and find street components
			let startIndex = 0;
			// Skip house number(s) - could be "1234" or "1234-56"
			if (addressParts[0] && /^\d+(-\d+)?$/.test(addressParts[0])) {
				startIndex = 1;
			}

			// Check for direction (N, S, E, W, etc.)
			if (addressParts[startIndex] && /^[NSEW]$|^(NE|NW|SE|SW)$/i.test(addressParts[startIndex])) {
				stdir = addressParts[startIndex];
				startIndex++;
			}

			// Remaining parts are street name and type
			const remainingParts = addressParts.slice(startIndex);
			if (remainingParts.length > 0) {
				// Last part might be street type (St, Ave, Dr, etc.)
				const lastPart = remainingParts[remainingParts.length - 1];
				const streetTypes = [
					'ST',
					'AVE',
					'DR',
					'RD',
					'LN',
					'CT',
					'PL',
					'BLVD',
					'WAY',
					'PKWY',
					'CIR',
					'TER'
				];
				if (streetTypes.includes(lastPart.toUpperCase())) {
					sttype = lastPart;
					stname = remainingParts.slice(0, -1).join(' ');
				} else {
					// Check if second to last is a street type (for addresses ending in city/state)
					const beforeCommaIndex = remainingParts.findIndex((part: string) => part.includes(','));
					if (beforeCommaIndex > 0) {
						const streetNameParts = remainingParts.slice(0, beforeCommaIndex);
						const possibleType = streetNameParts[streetNameParts.length - 1];
						if (streetTypes.includes(possibleType.toUpperCase())) {
							sttype = possibleType;
							stname = streetNameParts.slice(0, -1).join(' ');
						} else {
							stname = streetNameParts.join(' ');
						}
					} else {
						stname = remainingParts.join(' ');
					}
				}
			}

			return {
				// Convert MinimalAddress to AddressWithServiceLine
				row: minimalAddr.row, // Use the actual row ID from CSV
				fullAddress: displayAddress,
				isIntersection: false,
				stnum1: minimalAddr.num1,
				stnum2: minimalAddr.num2,
				stdir: stdir,
				stname: stname,
				sttype: sttype,
				zip: minimalAddr.zip,
				geocoder: 'minimal-search-index',
				lat: minimalAddr.lat,
				long: minimalAddr.long,
				geoid: '',
				leadStatus: 'UNKNOWN' as 'LEAD' | 'NON_LEAD' | 'UNKNOWN', // Will be fetched on-demand
				hasLead: false, // Will be updated after API call
				mIsIntersection: false,
				mStnum1: minimalAddr.num1,
				mStnum2: minimalAddr.num2,
				mStdir: stdir,
				mStname: stname,
				mZip: minimalAddr.zip
			} as AddressWithServiceLine;
		});
	}

	// Legacy search function as fallback
	function searchAddressesLegacy(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];

		const normalizedQuery = normalizeAddress(query);
		const queryNumber = extractNumberFromQuery(query.trim());
		const allAddresses = $addressStore.collection.addresses || [];

		const filteredAndSorted = allAddresses
			.filter((addr) => {
				const normalizedAddr = normalizeAddress(addr.fullAddress);
				const searchVariants = [normalizedQuery];

				const queryWords = normalizedQuery.split(/\s+/);
				if (queryWords.length > 1) {
					for (let i = queryWords.length - 1; i >= 0; i--) {
						const partial = queryWords.slice(0, i + 1).join(' ');
						if (partial !== normalizedQuery) {
							searchVariants.push(partial);
						}
					}
				}

				for (const variant of searchVariants) {
					if (normalizedAddr.includes(variant)) {
						return true;
					}
				}

				if (queryNumber !== null && addr.stnum1 && addr.stnum2) {
					const streetPart = normalizedQuery.replace(/^\d+\s*/, '');
					const addrStreetPart = normalizedAddr.replace(/^\d+(-\d+)?\s*/, '');

					if (
						streetPart.length > 0 &&
						addrStreetPart.includes(streetPart) &&
						queryNumber >= addr.stnum1 &&
						queryNumber <= addr.stnum2
					) {
						return true;
					}
				}

				return false;
			})
			.sort((a, b) => {
				const aNormalized = normalizeAddress(a.fullAddress);
				const bNormalized = normalizeAddress(b.fullAddress);

				const aExact = aNormalized.includes(normalizedQuery) ? 0 : 1;
				const bExact = bNormalized.includes(normalizedQuery) ? 0 : 1;

				if (aExact !== bExact) return aExact - bExact;

				if (queryNumber !== null) {
					const aMidpoint = (a.stnum1 + a.stnum2) / 2;
					const bMidpoint = (b.stnum1 + b.stnum2) / 2;
					const aDistance = Math.abs(queryNumber - aMidpoint);
					const bDistance = Math.abs(queryNumber - bMidpoint);
					return aDistance - bDistance;
				}

				return 0;
			});

		// Deduplicate by full address and limit to 5
		const uniqueResults = [];
		const seenAddresses = new Set();

		for (const addr of filteredAndSorted) {
			if (!seenAddresses.has(addr.fullAddress)) {
				seenAddresses.add(addr.fullAddress);
				uniqueResults.push(addr);
				if (uniqueResults.length >= 5) break;
			}
		}

		return uniqueResults;
	}

	const fetchSuggestions = debounce(async (query: string) => {
		if (!query || query.length < 3) {
			suggestions = [];
			nominatimSuggestions = [];
			showSuggestions = false;
			search.noInventoryResults = false;
			return;
		}

		isFetchingSuggestions = true;
		try {
			// Use combined search if available, otherwise fall back
			suggestions = searchAddressesCombined(query);
			console.log(`Search for "${query}" returned ${suggestions.length} results`);

			// Track when we have no inventory results
			search.noInventoryResults = suggestions.length === 0;

			// If no inventory results, automatically search Nominatim
			if (search.noInventoryResults) {
				await performNominatimSearch(query);
			} else {
				// Clear Nominatim suggestions if we have inventory results
				nominatimSuggestions = [];
			}

			// Show suggestions if we have any (inventory or Nominatim)
			showSuggestions = suggestions.length > 0 || nominatimSuggestions.length > 0;
			selectedIndex = -1; // Reset selection when new suggestions are loaded
		} catch (error) {
			console.error('Error searching addresses:', error);
			console.error('Query was:', query);
			console.error('Search index state:', $minimalSearchIndexStore);
			suggestions = [];
			search.noInventoryResults = true;
		} finally {
			isFetchingSuggestions = false;
		}
	}, 300);

	// Load inventory data for a specific address via API using row ID
	export async function loadInventoryForAddress(address: string, rowId?: number): Promise<void> {
		// Clear previous data immediately when starting a new search
		inventory.isLoading = true;
		inventory.error = null;
		inventory.data = null; // Clear previous data
		inventory.address = address;

		multiServiceLineStore.update((store) => ({
			...store,
			isLoading: true,
			error: null,
			inventoryList: [], // Clear previous inventory list
			currentIndex: 0,
			address
		}));

		try {
			console.log(
				`Loading inventory data for address: ${address}${rowId ? ` (row ID: ${rowId})` : ''}`
			);

			// Use the DigitalOcean Function with address parameter for multiple service lines
			const encodedAddress = encodeURIComponent(address);
			const apiUrl = `https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-f47822c0-7b7f-4248-940b-9249f4f51915/inventory/lookup?address=${encodedAddress}`;

			try {
				const response = await fetch(apiUrl);

				if (!response.ok) {
					throw new Error(`API request failed: ${response.status} ${response.statusText}`);
				}

				const data: InventoryApiResponse = await response.json();

				if (!data.success) {
					throw new Error(data.error || 'API returned unsuccessful response');
				}

				console.log(`✓ Inventory data loaded for address ${address}:`, data);

				// Update multi-service line store
				multiServiceLineStore.update((store) => ({
					...store,
					isLoading: false,
					inventoryList: data.inventoryList || [],
					error: null
				}));

				inventory.isLoading = false;
				inventory.data = data.inventory || (data.inventoryList && data.inventoryList[0]) || null;
				inventory.error = null;

				// If this was a clicked service line, update the displayed address
				if (
					search.clickedServiceLineRow !== null &&
					data.inventoryList &&
					data.inventoryList.length > 0
				) {
					const actualAddress = data.inventoryList[0].fullAddress || data.address || address;
					multiServiceLineStore.update((store) => ({
						...store,
						address: actualAddress
					}));
				}
			} catch (apiError) {
				console.warn('API call failed, using mock data:', apiError);

				// Fallback to mock data if API fails
				const mockInventoryData: InventoryData = {
					fullAddress: address,
					serviceLineMaterial: 'Unknown - API unavailable',
					customerSideMaterial: 'Unknown - API unavailable',
					utilitySideMaterial: 'Unknown - API unavailable',
					overallCode: 'Unknown',
					gooseneck: 'Unknown',
					highRisk: 'N',
					lastUpdated: 'Mock data - API unavailable',
					additionalNotes: 'API temporarily unavailable, showing placeholder data'
				};

				multiServiceLineStore.update((store) => ({
					...store,
					isLoading: false,
					inventoryList: [mockInventoryData],
					error: null
				}));

				inventory.isLoading = false;
				inventory.data = mockInventoryData;
				inventory.error = null;
			}
		} catch (error) {
			console.error('Error loading inventory data:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to load inventory data';

			multiServiceLineStore.update((store) => ({
				...store,
				isLoading: false,
				error: errorMessage
			}));

			inventory.isLoading = false;
			inventory.error = errorMessage;
		}
	}

	function onInput(event: Event & { currentTarget: HTMLInputElement }) {
		search.query = event.currentTarget.value;
		// Clear the selected address when user types.
		search.selectedAddress = null;
		search.selectedAddressTractId = null;
		search.selectedAddressCommunityName = null;

		fetchSuggestions(event.currentTarget.value);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const allSuggestions = [...suggestions, ...nominatimSuggestions];
			if (showSuggestions && selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
				// Select the highlighted suggestion
				onSuggestionClick(allSuggestions[selectedIndex]);
			} else {
				showSuggestions = false;
				handleSearch();
			}
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			const allSuggestions = [...suggestions, ...nominatimSuggestions];
			if (showSuggestions && allSuggestions.length > 0) {
				selectedIndex = (selectedIndex + 1) % allSuggestions.length;
			}
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			const allSuggestions = [...suggestions, ...nominatimSuggestions];
			if (showSuggestions && allSuggestions.length > 0) {
				selectedIndex = selectedIndex <= 0 ? allSuggestions.length - 1 : selectedIndex - 1;
			}
		} else if (event.key === 'Escape') {
			event.preventDefault();
			showSuggestions = false;
			selectedIndex = -1;
		}
	}

	function onSuggestionClick(suggestion: AddressWithServiceLine) {
		search.query = suggestion.fullAddress;
		search.selectedAddress = suggestion;
		search.searchedAddress = suggestion; // Track this as the searched address
		search.clickedServiceLineRow = null; // Clear any clicked dot

		showSuggestions = false;
		suggestions = []; // Clear suggestions after selection
		nominatimSuggestions = []; // Clear Nominatim suggestions too

		// Collapse the search header when an address is selected
		ui.searchHeaderCollapsed = true;
		ui.creditsExpanded = false;

		// Check if this is a Nominatim address (row = -1)
		if (suggestion.row === -1) {
			// Mark this as a Nominatim address
			search.isNominatimAddress = true;
			// Don't load inventory data for Nominatim addresses
			inventory.isLoading = false;
			inventory.data = null;
			inventory.error = null;

			// Clear the multiServiceLineStore to disable resources panel for Nominatim addresses
			multiServiceLineStore.set({
				isLoading: false,
				inventoryList: [],
				currentIndex: 0,
				error: null,
				address: null
			});
		} else {
			// Regular inventory address
			search.isNominatimAddress = false;
			// Load inventory data for the selected address
			if (suggestion.row > 0) {
				loadInventoryForAddress(suggestion.fullAddress, suggestion.row);
			} else {
				console.error('No row ID found for suggestion:', suggestion);
			}
		}

		if (map && suggestion.lat && suggestion.long) {
			// On mobile, we need to offset the point to appear below the search panel
			const isMobile = window.innerWidth <= 640;

			let targetCenter: [number, number] = [suggestion.long, suggestion.lat];

			if (isMobile) {
				// Pre-compute the offset position
				const latOffset = 0.0014;
				targetCenter = [suggestion.long, suggestion.lat + latOffset];
			}

			map.flyTo({
				center: targetCenter,
				zoom: isMobile ? 16 : 17,
				duration: 1500
			});

			const highlightSource = 'selected-address';
			const highlightLayer = 'selected-address-highlight';

			if (map.getLayer(highlightLayer)) {
				map.removeLayer(highlightLayer);
			}
			if (map.getSource(highlightSource)) {
				map.removeSource(highlightSource);
			}

			map.addSource(highlightSource, {
				type: 'geojson',
				data: {
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [suggestion.long, suggestion.lat]
					},
					properties: {
						address: suggestion.fullAddress
					}
				}
			});

			const leadStatusColor = COLORS.EARTH;

			map.addLayer({
				id: highlightLayer,
				type: 'circle',
				source: highlightSource,
				paint: {
					'circle-radius': 12,
					'circle-color': leadStatusColor,
					'circle-stroke-width': 3,
					'circle-stroke-color': '#ffffff',
					'circle-opacity': 0.9
				}
			});
		}

		// Note: We don't call handleSearch() for address selection since we just want to zoom to the address
		// handleSearch() is only called when user manually types and presses Enter or clicks search button
	}

	function onInputFocus() {
		// Only show suggestions if:
		// 1. There are suggestions available
		// 2. No address has been selected yet
		// 3. The current query matches what's in the input (not from a previous search)
		if (suggestions.length > 0 && !search.selectedAddress && search.query.length >= 3) {
			showSuggestions = true;
		}
	}

	function onInputBlur(event: FocusEvent) {
		const relatedTarget = event.relatedTarget as HTMLElement;
		if (suggestionsContainer?.contains(relatedTarget)) {
			return;
		}

		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	// Function to get the worst code when multiple service lines exist
	function getWorstCode(inventoryList: any[]): string {
		// Priority: L > GRR > U > NL
		const codes = inventoryList.map((item) => item.OverallSL_Code || item.overallCode || 'U');

		if (codes.includes('L')) return 'L';
		if (codes.includes('GRR')) return 'GRR';
		if (codes.includes('U')) return 'U';
		return 'NL';
	}

	// Effects.
	$effect(() => {
		// Reactive update of the searched address dot color based on inventory data
		// This should only update the color of the searched address, not clicked dots
		if (map && search.searchedAddress && !inventory.isLoading && !search.isNominatimAddress) {
			const highlightLayer = 'selected-address-highlight';

			if (map.getLayer(highlightLayer)) {
				// Only update color if this is displaying the searched address
				if (search.selectedAddress?.row === search.searchedAddress.row) {
					// Get the overall code to display
					const displayCode =
						$multiServiceLineStore.inventoryList && $multiServiceLineStore.inventoryList.length > 1
							? getWorstCode($multiServiceLineStore.inventoryList)
							: $currentServiceLine?.OverallSL_Code || $currentServiceLine?.overallCode || 'U';

					let dotColor: string = COLORS.EARTH; // Default

					if (displayCode === 'L') {
						dotColor = COLORS.INT_RED;
					} else if (displayCode === 'GRR') {
						dotColor = COLORS.INT_RED;
					} else if (displayCode === 'NL') {
						dotColor = COLORS.INT_BLUE;
					} else {
						dotColor = COLORS.INT_RED; // Unknown
					}

					map.setPaintProperty(highlightLayer, 'circle-color', dotColor);
				}
			}
		}
	});

	// Track the last processed clicked row to prevent infinite loops
	let lastProcessedClickedRow = $state<number | null>(null);

	// Handle clicked service line
	$effect(() => {
		if (
			search.clickedServiceLineRow !== null &&
			search.clickedServiceLineRow !== lastProcessedClickedRow &&
			search.nearbyServiceLines.length > 0
		) {
			// Mark this row as processed
			lastProcessedClickedRow = search.clickedServiceLineRow;

			// Find the clicked service line in the nearby list
			const clickedLine = search.nearbyServiceLines.find(
				(sl) => sl.row === search.clickedServiceLineRow
			);

			if (clickedLine && $combinedIndexStore.index) {
				// Look up the address in the combined index by row ID
				const addressData = $combinedIndexStore.index.addresses.find(
					(addr) => addr.r === clickedLine.row
				);

				if (addressData) {
					// Check if this is a ranged address and format accordingly
					let displayAddress = addressData.a;
					if (addressData.n1 !== addressData.n2 && addressData.n1 > 0 && addressData.n2 > 0) {
						// This is a ranged address - format it as "947-959 W CHICAGO AVE"
						const addressParts = addressData.a.split(' ');
						if (addressParts[0] && /^\d+$/.test(addressParts[0])) {
							// Replace the first number with the range
							addressParts[0] = `${addressData.n1}–${addressData.n2}`; // Using en dash
							displayAddress = addressParts.join(' ');
						}
					}

					// Reconstruct the full address
					const fullAddress = displayAddress.includes(addressData.z)
						? displayAddress.replace(/, (\d{5})$/, ', CHICAGO, IL $1')
						: displayAddress + ', CHICAGO, IL ' + addressData.z;

					// Create a proper address object
					const clickedAddress: AddressWithServiceLine = {
						row: clickedLine.row,
						fullAddress: fullAddress,
						isIntersection: false,
						stnum1: addressData.n1,
						stnum2: addressData.n2,
						stdir: '',
						stname: '',
						sttype: '',
						zip: addressData.z,
						geocoder: 'service-line-click',
						lat: clickedLine.lat,
						long: clickedLine.long,
						geoid: '',
						leadStatus:
							addressData.m === 'L' ? 'LEAD' : addressData.m === 'N' ? 'NON_LEAD' : 'UNKNOWN',
						hasLead: addressData.m === 'L',
						mIsIntersection: false,
						mStnum1: addressData.n1,
						mStnum2: addressData.n2,
						mStdir: '',
						mStname: '',
						mZip: addressData.z
					};

					// Update search state to show this as selected (but don't update the query)
					// Important: Keep the searched address separate from clicked addresses
					search.selectedAddress = clickedAddress;
					search.isNominatimAddress = false; // Clear the Nominatim flag since this is a real inventory address

					// Load inventory for the clicked service line using the address
					loadInventoryForAddress(fullAddress);
				}
			}
		}

		// Reset when clicked row is cleared
		if (search.clickedServiceLineRow === null) {
			lastProcessedClickedRow = null;
		}
	});
</script>

<div class="flex flex-col gap-3 sm:gap-4">
	{#if !ui.searchHeaderCollapsed}
		<div class="flex flex-col gap-2 sm:gap-4">
			<h1
				class="font-sans-secondary text-earth text-2.5xl m-0 font-medium text-balance sm:text-4xl"
			>
				Chicago: Does your water service line contain lead?
			</h1>
			<p class="text-earth m-0 font-sans text-base leading-[calc(1/0.75)]">
				Enter your address to find out whether any part of your water service line needs replacing
				and how your neighborhood compares to others.
			</p>
		</div>
	{/if}
	<div class="relative flex flex-col items-stretch gap-1">
		<div class="flex gap-2">
			<div class="relative w-full">
				<input
					bind:this={input}
					type="text"
					id="search"
					value={search.query}
					oninput={onInput}
					onkeydown={onKeyDown}
					onfocus={onInputFocus}
					onblur={onInputBlur}
					class="border-earth bg-smog w-full rounded-sm border px-1.5 py-1 font-sans text-base text-ellipsis transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					placeholder="1234 N State St"
					disabled={$isAddressDataLoading}
				/>
				{#if isFetchingSuggestions}
					<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
						<div
							class="border-earth/30 h-4 w-4 animate-spin rounded-full border-2 border-t-emerald-500"
						></div>
					</div>
				{/if}
			</div>
			<button
				onclick={handleSearch}
				style="background-color: {searchButtonColor}; border-color: {interpolateReds(0.6)};"
				class="flex shrink-0 basis-[100px] items-center justify-center gap-2 rounded-md border p-1.5 font-sans whitespace-nowrap text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				disabled={$isAddressDataLoading || search.isSearching}
			>
				{#if $isAddressDataLoading || search.isSearching}
					<div class="flex items-center gap-2">
						<svg
							class="h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					</div>
				{:else}
					<svg
						class="h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					Search
				{/if}
			</button>
		</div>
		<SearchSuggestions
			isFetching={isFetchingSuggestions}
			{showSuggestions}
			{suggestions}
			{nominatimSuggestions}
			{input}
			{suggestionsContainer}
			{selectedIndex}
			{onSuggestionClick}
		/>
	</div>
	{#if map}
		<ServiceLineResults
			selectedAddress={search.selectedAddress}
			inventoryData={inventory.data}
			isLoading={inventory.isLoading}
			error={inventory.error}
			{map}
		/>
	{/if}
</div>
