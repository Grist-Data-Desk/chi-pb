<script lang="ts">
	import {
		searchState,
		isAddressDataLoading,
		addressStore,
		selectedAddressInventory,
		isInventoryLoading,
		inventoryError,
		loadInventoryForAddress,
		loadMinimalSearchIndex,
		minimalSearchIndexStore,
		multiServiceLineStore,
		currentServiceLine,
		uiState
	} from '$lib/stores';
	import type { AddressWithServiceLine, MinimalAddress } from '$lib/types';
	import { debounce } from 'lodash-es';
	import ServiceLineResults from './ServiceLineResults.svelte';
	import { onMount } from 'svelte';
	import type maplibregl from 'maplibre-gl';
	import { COLORS } from '$lib/utils/constants';
	import { interpolatePurples } from 'd3-scale-chromatic';


	export let map: maplibregl.Map | null = null;
	let suggestions: AddressWithServiceLine[] = [];
	let isFetchingSuggestions = false;
	let showSuggestions = false;
	let suggestionsContainer: HTMLDivElement;

	const handleSearch = () => {
		// This is now just a placeholder for the search button
		// Address selection handles all the search functionality
	};

	// Some normalization for address variants
	function normalizeAddress(address: string): string {
		let normalized = address.toLowerCase()
			// Preserve & for intersection detection before removing other punctuation
			.replace(/\band\b/g, '&')  // Replace "and" with "&" for consistent intersection handling
			.replace(/[^\w\s&]/g, ' ')  // Keep & for now
			.replace(/\s+/g, ' ')
			.trim();

		// Some street type variants
		const streetTypeReplacements = {
			'avenue': 'ave',
			'street': 'st',
			'saint': 'st',
			'boulevard': 'blvd',
			'parkway': 'park',
			'terrace': 'ter',
			'plaza': 'plz',
			'place': 'pl',
			'court': 'ct',
			'drive': 'dr',
			'lane': 'ln',
			'road': 'rd',
			'circle': 'cir'
		};

		for (const [full, abbrev] of Object.entries(streetTypeReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
		}

		// Some street name variants
		const streetNameReplacements = {
			'martin luther king jr': 'king',
			'martin l king jr': 'king',
			'lakeshore': 'lake shore',
			'crestline': 'crest line',
			'blueisland': 'blue island',
			'blue island': 'blueisland',
			'dekoven': 'de koven',
			'de koven': 'dekoven',
			'desplaines': 'des plaines',
			'des plaines': 'desplaines'
		};

		for (const [variant, standard] of Object.entries(streetNameReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), standard);
		}

		// Some prefix variants (LA, MC, O)
		normalized = normalized
			.replace(/\bla\s+/g, 'la')  // "LA SALLE" -> "lasalle"
			.replace(/\bmc\s+/g, 'mc')  // "MC VICKER" -> "mcvicker"
			.replace(/\bo\s+/g, 'o');   // "O BRIEN" -> "obrien"

		// Direction variants (N, S, E, W, NE, NW, SE, SW)
		const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
		const directionAbbrevs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
		
		directions.forEach((dir, i) => {
			normalized = normalized.replace(new RegExp(`\\b${dir}\\b`, 'g'), directionAbbrevs[i]);
		});

		// Final cleanup - remove & unless it's being used for intersection detection
		normalized = normalized.replace(/[^\w\s&]/g, ' ').replace(/\s+/g, ' ').trim();

		return normalized;
	}

	function extractNumberFromQuery(query: string): number | null {
		const match = query.match(/^\d+/);
		return match ? parseInt(match[0]) : null;
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
			normalizedQuery: normalizedQuery,
			queryNumber: queryNumber,
			streetPart: streetPart,
			normalizedStreetPart: normalizedStreetPart,
			streetWords: normalizedStreetPart.split(/\s+/).filter(w => w.length > 0)
		});
		
		// For queries with both number and street, we need to find addresses that match BOTH
		const matchingAddresses: MinimalAddress[] = [];
		
		if (queryNumber !== null && normalizedStreetPart.length > 0) {
			// Find addresses where the number is in range AND the street matches
			searchIndex.addresses.forEach((addr) => {
				// Check if query number falls within the address range
				if (addr.num1 > 0 && addr.num2 > 0 && queryNumber >= addr.num1 && queryNumber <= addr.num2) {
					// Now check if the street part matches
					const normalizedAddr = normalizeAddress(addr.display);
					const addressWords = normalizedAddr.split(/\s+/);
					const streetWords = normalizedStreetPart.split(/\s+/).filter(w => w.length > 0);
					
					// All query street words must match (using prefix matching)
					const allStreetWordsMatch = streetWords.every(queryWord => {
						if (queryWord.length < 3) return true; // Skip very short words
						
						// Check if any address word starts with the query word (prefix match)
						return addressWords.some(addrWord => 
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
				if (addr.num1 > 0 && addr.num2 > 0 && queryNumber >= addr.num1 && queryNumber <= addr.num2) {
					matchingAddresses.push(addr);
				}
			});
		} else if (normalizedStreetPart.length > 0) {
			// Check if this is an intersection query (contains & or was normalized from "and")
			const isIntersectionQuery = normalizedStreetPart.includes('&');
			
			if (isIntersectionQuery) {
				// Handle intersection search
				const streets = normalizedStreetPart.split('&').map(s => s.trim()).filter(s => s.length > 0);
				
				if (streets.length >= 2) {
					// Find addresses that match ALL streets in the intersection
					const streetMatchSets = streets.map(street => {
						const streetIds = new Set<number>();
						const streetWords = street.split(/\s+/).filter(w => w.length > 0);
						
						// Use the efficient street index instead of iterating all addresses
						streetWords.forEach(word => {
							if (word.length >= 2) {
								// Check all street index keys for matches
								Object.keys(searchIndex.streetNames).forEach(streetKey => {
									if (!streetKey.endsWith('*') && streetKey.includes(word)) {
										const ids = searchIndex.streetNames[streetKey];
										if (Array.isArray(ids)) {
											// Add all IDs that match this word
											ids.forEach(id => streetIds.add(id));
										}
									}
								});
							}
						});
						
						// Filter to only keep addresses where ALL words match
						const filteredIds = new Set<number>();
						streetIds.forEach(id => {
							if (id >= 0 && id < searchIndex.addresses.length) {
								const addr = searchIndex.addresses[id];
								const normalizedDisplay = normalizeAddress(addr.display);
								
								// Check if all words from this street are in the address
								const allWordsMatch = streetWords.every(word => {
									if (word.length < 2) return true;
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
							return new Set([...a].filter(x => b.has(x)));
						});
						
						intersection.forEach(id => {
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
				
				streetWords.forEach(word => {
					if (word.length >= 2) {
						// Check all street index keys for matches
						Object.keys(searchIndex.streetNames).forEach(streetKey => {
							if (!streetKey.endsWith('*') && streetKey.startsWith(word)) {
								const ids = searchIndex.streetNames[streetKey];
								if (Array.isArray(ids)) {
									ids.forEach(id => resultIds.add(id));
								}
							}
						});
					}
				});
				
				// Convert IDs to addresses
				resultIds.forEach(id => {
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
				const aExactNumber = (queryNumber >= a.num1 && queryNumber <= a.num2) ? 0 : 1;
				const bExactNumber = (queryNumber >= b.num1 && queryNumber <= b.num2) ? 0 : 1;
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
		const deduplicatedAddresses = matchingAddresses.filter(addr => {
			if (seen.has(addr.display)) {
				return false;
			}
			seen.add(addr.display);
			return true;
		});
		
		// Limit to 5 results
		const topResults = deduplicatedAddresses.slice(0, 5);
		
		// Convert to AddressWithServiceLine format
		return topResults.map(minimalAddr => {
			// Extract street components from the display address to preserve original street names
			// The display field contains the full formatted address like "12100-14 S Front St"
			const addressParts = minimalAddr.display.split(' ');
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
				const streetTypes = ['ST', 'AVE', 'DR', 'RD', 'LN', 'CT', 'PL', 'BLVD', 'WAY', 'PKWY', 'CIR', 'TER'];
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
				fullAddress: minimalAddr.display,
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
			.filter(addr => {
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
					
					if (streetPart.length > 0 && addrStreetPart.includes(streetPart) && 
						queryNumber >= addr.stnum1 && 
						queryNumber <= addr.stnum2) {
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
			showSuggestions = false;
			return;
		}

		isFetchingSuggestions = true;
		try {
			// Use optimized search
			suggestions = searchAddressesOptimized(query);
			console.log(`Search for "${query}" returned ${suggestions.length} results`);
			showSuggestions = suggestions.length > 0;
		} catch (error) {
			console.error('Error searching addresses:', error);
			console.error('Query was:', query);
			console.error('Search index state:', $minimalSearchIndexStore);
			suggestions = [];
		} finally {
			isFetchingSuggestions = false;
		}
	}, 300);

	function onInput(event: Event) {
		const input = event.target as HTMLInputElement;
		searchState.update(state => ({ 
			...state, 
			query: input.value,
			selectedAddress: null // Clear selected address when user types
		}));
		fetchSuggestions(input.value);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			showSuggestions = false;
			handleSearch();
		}
	}

	function onSuggestionKeyDown(event: KeyboardEvent, suggestion: AddressWithServiceLine) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSuggestionClick(suggestion);
		}
	}

	function onSuggestionClick(suggestion: AddressWithServiceLine) {
		searchState.update(state => ({ 
			...state, 
			query: suggestion.fullAddress,
			selectedAddress: suggestion 
		}));
		showSuggestions = false;
		suggestions = []; // Clear suggestions after selection
		
		// Collapse the search header when an address is selected
		uiState.update(state => ({ 
			...state, 
			searchHeaderCollapsed: true,
			creditsExpanded: false
		}));
		
		// Load inventory data for the selected address
		if (suggestion.row) {
			loadInventoryForAddress(suggestion.fullAddress, suggestion.row);
		} else {
			console.error('No row ID found for suggestion:', suggestion);
		}
		
		if (map && suggestion.lat && suggestion.long) {
			// On mobile, we need to offset the point to appear below the search panel
			const isMobile = window.innerWidth <= 640;
			
			let targetCenter: [number, number] = [suggestion.long, suggestion.lat];
			
			if (isMobile) {
				// Pre-compute the offset position
				const latOffset = 0.0025;
				targetCenter = [suggestion.long, suggestion.lat + latOffset];
			}
			
			map.flyTo({
				center: targetCenter,
				zoom: 16,
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
		if (suggestions.length > 0 && !$searchState.selectedAddress && $searchState.query.length >= 3) {
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
		const codes = inventoryList.map(item => item.OverallSL_Code || item.overallCode || 'U');
		
		if (codes.includes('L')) return 'L';
		if (codes.includes('GRR')) return 'GRR';
		if (codes.includes('U')) return 'U';
		return 'NL';
	}
	
	// Reactive update of the selected address dot color based on inventory data
	$: if (map && $searchState.selectedAddress && !$isInventoryLoading) {
		const highlightLayer = 'selected-address-highlight';
		
		if (map.getLayer(highlightLayer)) {
			// Get the overall code to display
			const displayCode = $multiServiceLineStore.inventoryList && $multiServiceLineStore.inventoryList.length > 1
				? getWorstCode($multiServiceLineStore.inventoryList)
				: $currentServiceLine?.OverallSL_Code || $currentServiceLine?.overallCode || 'U';
			
			let dotColor: string = COLORS.EARTH; // Default
			
			if (displayCode === 'L') {
				dotColor = COLORS.RED;
			} else if (displayCode === 'GRR') {
				dotColor = COLORS.ORANGE;
			} else if (displayCode === 'NL') {
				dotColor = COLORS.TURQUOISE;
			} else {
				dotColor = COLORS.GOLD; // Unknown
			}
			
			map.setPaintProperty(highlightLayer, 'circle-color', dotColor);
		}
	}

	onMount(() => {
		loadMinimalSearchIndex();
	});
</script>

<div class="relative col-span-1 space-y-4 overflow-visible rounded-lg border border-slate-200">

	{#if !$uiState.searchHeaderCollapsed}
		<div class="relative z-10">
			<h1 class="mt-0 font-['PolySans'] text-3xl font-medium text-slate-800">
				Chicago: Does your water service line contain lead?
			</h1>
			<p class="m-0 font-['Basis_Grotesque'] text-sm text-slate-600">
				Enter your address to find information about your Chicago water service line composition and 
				lead status. The map will show your service line location and Census tract demographic data.
			</p>
		</div>
	{/if}
	<div class="relative flex items-stretch gap-2">
		<div class="flex-[5]">
			<label
				class="mb-0.5 block font-['Basis_Grotesque'] text-sm font-medium text-slate-700"
				for="search">Address</label
			>
			<div class="relative">
				<input
					type="text"
					id="search"
					value={$searchState.query}
					on:input={onInput}
					on:keydown={onKeyDown}
					on:focus={onInputFocus}
					on:blur={onInputBlur}
					class="search-input w-full rounded border border-slate-300 bg-white/50 p-1.5 font-['Basis_Grotesque'] transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
					placeholder="1234 N State St"
					disabled={$isAddressDataLoading}
				/>
				{#if isFetchingSuggestions}
					<div class="absolute right-2 top-1/2 -translate-y-1/2">
						<div class="loader"></div>
					</div>
				{/if}
				{#if showSuggestions && suggestions.length > 0}
					<div class="suggestions" bind:this={suggestionsContainer}>
						{#each suggestions as suggestion}
							<div
								class="suggestion"
								role="button"
								tabindex="0"
								on:mousedown={() => onSuggestionClick(suggestion)}
								on:keydown={(e) => onSuggestionKeyDown(e, suggestion)}
							>
								<div class="suggestion-main">
									{suggestion.fullAddress}
									{#if suggestion.serviceLineCount && suggestion.serviceLineCount > 1}
										<span class="ml-2 text-xs text-slate-500">({suggestion.serviceLineCount} service lines)</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>


		<div class="flex flex-col justify-end">
			<button
				on:click={handleSearch}
				style="background-color: {interpolatePurples(0.5)}; border-color: {interpolatePurples(0.6)};"
				class="flex w-[100px] items-center justify-center gap-2 whitespace-nowrap rounded-md border p-1.5 font-['Basis_Grotesque'] text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:brightness-110"
				disabled={$isAddressDataLoading || $searchState.isSearching}
			>
				{#if $isAddressDataLoading || $searchState.isSearching}
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
	</div>

	<!-- Service Line Results Panel -->
	<ServiceLineResults 
		selectedAddress={$searchState.selectedAddress}
		inventoryData={$selectedAddressInventory}
		isLoading={$isInventoryLoading}
		error={$inventoryError}
		{map}
	/>
</div>

<style lang="postcss">
	.suggestions {
		@apply absolute left-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg;
		width: 200%;
	}

	.suggestion {
		@apply cursor-pointer px-4 py-2.5 text-sm hover:bg-slate-50;
	}

	.suggestion:not(:last-child) {
		@apply border-b border-slate-100;
	}

	.suggestion-main {
		@apply font-medium text-slate-800 break-words;
	}


	.loader {
		@apply h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500;
	}
</style>
