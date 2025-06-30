<script lang="ts">
	import {
		searchState,
		visualState,
		filteredAddresses,
		currentCount,
		isAddressDataLoading,
		addressStore,
		selectedAddressInventory,
		isInventoryLoading,
		inventoryError,
		loadInventoryForAddress,
		loadMinimalSearchIndex,
		minimalSearchIndexStore
	} from '$lib/stores';
	import type { AddressWithServiceLine } from '$lib/types';
	import { debounce } from 'lodash-es';
	import ServiceLineResults from './ServiceLineResults.svelte';
	import { onMount } from 'svelte';
	import type maplibregl from 'maplibre-gl';

	export let onSearch: () => void;
	export let map: maplibregl.Map | null = null;
	let searchInput: HTMLInputElement;
	let suggestions: AddressWithServiceLine[] = [];
	let isFetchingSuggestions = false;
	let showSuggestions = false;
	let suggestionsContainer: HTMLDivElement;

	const handleSearch = () => {
		onSearch();
	};

	// Enhanced normalization for Chicago address variants
	function normalizeAddress(address: string): string {
		let normalized = address.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		// Handle street type variants
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

		// Apply street type normalizations
		for (const [full, abbrev] of Object.entries(streetTypeReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
		}

		// Handle specific Chicago street name variants
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

		// Apply street name normalizations
		for (const [variant, standard] of Object.entries(streetNameReplacements)) {
			normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), standard);
		}

		// Handle prefix variants (LA, MC, O)
		normalized = normalized
			.replace(/\bla\s+/g, 'la')  // "LA SALLE" -> "lasalle"
			.replace(/\bmc\s+/g, 'mc')  // "MC VICKER" -> "mcvicker"
			.replace(/\bo\s+/g, 'o');   // "O BRIEN" -> "obrien"

		// Handle direction variants (N, S, E, W, NE, NW, SE, SW)
		const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
		const directionAbbrevs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
		
		directions.forEach((dir, i) => {
			normalized = normalized.replace(new RegExp(`\\b${dir}\\b`, 'g'), directionAbbrevs[i]);
		});

		return normalized;
	}

	function extractNumberFromQuery(query: string): number | null {
		const match = query.match(/^\d+/);
		return match ? parseInt(match[0]) : null;
	}

	// Optimized search function using minimal search index
	function searchAddressesOptimized(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];
		
		const searchIndex = $minimalSearchIndexStore.index;
		if (!searchIndex) {
			console.log('Minimal search index not loaded, falling back to legacy search');
			// Fallback to legacy search if index not loaded
			return searchAddressesLegacy(query);
		}
		
		console.log('Using minimal search index:', {
			totalAddresses: searchIndex.addresses?.length,
			streetNames: Object.keys(searchIndex.streetNames || {}).length,
			version: searchIndex.metadata?.version
		});
		
		const normalizedQuery = normalizeAddress(query);
		const queryNumber = extractNumberFromQuery(query.trim());
		const resultIds = new Set<number>();
		
		// Search by street name (most common)
		const queryWords = normalizedQuery.split(/\s+/);
		if (searchIndex.streetNames) {
			queryWords.forEach(word => {
				if (word.length > 2) {
					// Exact word match
					if (searchIndex.streetNames[word]) {
						searchIndex.streetNames[word].forEach(id => resultIds.add(id));
					}
					
					// Partial word matching
					Object.keys(searchIndex.streetNames).forEach(streetKey => {
						if (streetKey.includes(word) || word.includes(streetKey)) {
							const ids = searchIndex.streetNames[streetKey];
							if (Array.isArray(ids)) {
								ids.forEach(id => resultIds.add(id));
							}
						}
					});
				}
			});
		}
		
		// Search by house number if query starts with a number
		// Since minimal index doesn't have pre-built number index, we search through addresses directly
		if (queryNumber !== null) {
			searchIndex.addresses.forEach((addr, id) => {
				if (addr.num1 > 0 && addr.num2 > 0) {
					// Check if query number falls within the address range
					if (queryNumber >= addr.num1 && queryNumber <= addr.num2) {
						resultIds.add(id);
					}
					// Also check nearby ranges (±100 for broader matching)
					const addrMidpoint = (addr.num1 + addr.num2) / 2;
					if (Math.abs(queryNumber - addrMidpoint) <= 100) {
						resultIds.add(id);
					}
				}
			});
		}
		
		// Convert result IDs to addresses and filter/sort
		const results = Array.from(resultIds)
			.map(id => {
				// Ensure the ID is valid and within bounds
				if (id >= 0 && id < searchIndex.addresses.length) {
					return searchIndex.addresses[id];
				}
				return null;
			})
			.filter(addr => {
				if (!addr) return false;
				
				// Secondary filtering for better matches
				const normalizedAddr = normalizeAddress(addr.display);
				
				// Check if address contains query words
				const addressWords = normalizedAddr.split(/\s+/);
				const matchCount = queryWords.filter(qWord => 
					addressWords.some(aWord => aWord.includes(qWord) || qWord.includes(aWord))
				).length;
				
				// Require at least half the query words to match
				if (matchCount < Math.ceil(queryWords.length / 2)) return false;
				
				// If query has a number, check if it's in range
				if (queryNumber !== null && addr.num1 > 0 && addr.num2 > 0) {
					const streetPart = normalizedQuery.replace(/^\d+\s*/, '');
					if (streetPart.length > 0) {
						const inRange = queryNumber >= addr.num1 && queryNumber <= addr.num2;
						const streetMatch = normalizedAddr.includes(streetPart);
						return inRange && streetMatch;
					}
				}
				
				return true;
			})
			.sort((a, b) => {
				// Sort by relevance - both a and b are guaranteed to be non-null by the filter above
				if (!a || !b) return 0; // Extra safety check
				
				const aNormalized = normalizeAddress(a.display);
				const bNormalized = normalizeAddress(b.display);
				
				// Exact matches first
				const aExact = aNormalized.includes(normalizedQuery) ? 0 : 1;
				const bExact = bNormalized.includes(normalizedQuery) ? 0 : 1;
				if (aExact !== bExact) return aExact - bExact;
				
				// Then by number proximity if applicable
				if (queryNumber !== null) {
					const aMidpoint = (a.num1 + a.num2) / 2;
					const bMidpoint = (b.num1 + b.num2) / 2;
					const aDistance = Math.abs(queryNumber - aMidpoint);
					const bDistance = Math.abs(queryNumber - bMidpoint);
					return aDistance - bDistance;
				}
				
				return 0;
			})
			.slice(0, 5) // Limit to top 5 results
			.map(minimalAddr => {
				// minimalAddr is guaranteed to be non-null by the filter above
				if (!minimalAddr) throw new Error('Unexpected null address');
				
				
				return {
					// Convert MinimalAddress to AddressWithServiceLine
					row: minimalAddr.row, // Use the actual row ID from CSV
					fullAddress: minimalAddr.display,
					isIntersection: false,
					stnum1: minimalAddr.num1,
					stnum2: minimalAddr.num2,
					stdir: '',
					stname: minimalAddr.street,
					sttype: '',
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
					mStdir: '',
					mStname: minimalAddr.street,
					mZip: minimalAddr.zip
				} as AddressWithServiceLine;
			});
		
		return results;
	}
	
	// Legacy search function as fallback
	function searchAddressesLegacy(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];
		
		const normalizedQuery = normalizeAddress(query);
		const queryNumber = extractNumberFromQuery(query.trim());
		const allAddresses = $addressStore.collection.addresses || [];
		
		return allAddresses
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
			})
			.slice(0, 5);
	}

	const fetchSuggestions = debounce((query: string) => {
		if (!query || query.length < 3) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		isFetchingSuggestions = true;
		try {
			suggestions = searchAddressesOptimized(query);
			showSuggestions = suggestions.length > 0;
			console.log(`Search for "${query}" returned ${suggestions.length} results`);
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
		searchState.update(state => ({ ...state, query: input.value }));
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
		
		// Load inventory data for the selected address using row ID
		if (suggestion.row) {
			loadInventoryForAddress(suggestion.fullAddress, suggestion.row);
		} else {
			console.error('No row ID found for suggestion:', suggestion);
		}
		
		// Zoom map directly to the address coordinates
		if (map && suggestion.lat && suggestion.long) {
			map.flyTo({
				center: [suggestion.long, suggestion.lat],
				zoom: 16,
				duration: 1500
			});
			
			// Add or update a highlight layer for the selected address
			const highlightSource = 'selected-address';
			const highlightLayer = 'selected-address-highlight';
			
			// Remove existing highlight if it exists
			if (map.getLayer(highlightLayer)) {
				map.removeLayer(highlightLayer);
			}
			if (map.getSource(highlightSource)) {
				map.removeSource(highlightSource);
			}
			
			// Add highlight source and layer
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
			
			map.addLayer({
				id: highlightLayer,
				type: 'circle',
				source: highlightSource,
				paint: {
					'circle-radius': 12,
					'circle-color': '#ff6b35',
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
		if (suggestions.length > 0) {
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

	// Load minimal search index on component mount
	// Inventory data is loaded on-demand when address is selected
	onMount(() => {
		loadMinimalSearchIndex();
	});
</script>

<div class="relative col-span-1 space-y-4 overflow-visible rounded-lg border border-slate-200">
	<div class="absolute -right-[22px] -top-12 h-40 w-40 text-gold/30">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			fill="currentColor"
		>
			<circle cx="50" cy="50" r="15" />
			<g>
				{#each Array(12) as _, i}
					<rect x="49" y="14" width="2" height="16" transform="rotate({i * 30} 50 50)" />
				{/each}
			</g>
		</svg>
	</div>

	<div class="relative z-10">
		<h1 class="font-['PolySans'] text-3xl font-medium text-slate-800">
			Chicago Water Service Line Lookup
		</h1>
		<p class="m-0 font-['Basis_Grotesque'] text-sm text-slate-600">
			Enter your Chicago address to find information about your water service line composition and 
			<span class="text-orange">lead status</span>. The map will show your address location and 
			<span class="text-cobalt">Census tract</span> demographic data.
		</p>
	</div>
	<div class="relative flex items-stretch gap-2">
		<div class="flex-[5]">
			<label
				class="mb-0.5 block font-['Basis_Grotesque'] text-sm font-medium text-slate-700"
				for="search">Chicago Address</label
			>
			<div class="relative">
				<input
					type="text"
					id="search"
					bind:this={searchInput}
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
								<div class="suggestion-main">{suggestion.fullAddress}</div>
								<div class="suggestion-secondary">
									Lead Status: <span class="font-medium" class:text-red-600={suggestion.leadStatus === 'LEAD'} class:text-emerald-600={suggestion.leadStatus === 'NON_LEAD'} class:text-amber-600={suggestion.leadStatus === 'UNKNOWN'}>
										{suggestion.leadStatus.replace('_', ' ')}
									</span>
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
				class="flex w-[100px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-emerald-600 bg-emerald-500 p-1.5 font-['Basis_Grotesque'] text-white shadow-md transition-all hover:bg-emerald-600 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
		@apply truncate font-medium text-slate-800;
	}

	.suggestion-secondary {
		@apply mt-0.5 line-clamp-1 text-xs text-slate-500;
	}

	.loader {
		@apply h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500;
	}
</style>
