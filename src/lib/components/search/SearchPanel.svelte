<script lang="ts">
	import {
		searchState,
		visualState,
		filteredAddresses,
		currentCount,
		isAddressDataLoading,
		addressStore
	} from '$lib/stores';
	import type { AddressWithServiceLine } from '$lib/types';
	import { debounce } from 'lodash-es';

	export let onSearch: () => void;
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

	function searchAddresses(query: string): AddressWithServiceLine[] {
		if (!query || query.length < 3) return [];
		
		const normalizedQuery = normalizeAddress(query);
		const queryNumber = extractNumberFromQuery(query.trim());
		const allAddresses = $addressStore.collection.collection.features.map(f => f.properties);
		
		return allAddresses
			.filter(addr => {
				// Use fullAddress for searching and display
				const normalizedAddr = normalizeAddress(addr.fullAddress);
				
				// Create multiple search variants for better matching
				const searchVariants = [normalizedQuery];
				
				// Add partial word matching (for cases like "11730 S Fr" matching "FRONT")
				const queryWords = normalizedQuery.split(/\s+/);
				if (queryWords.length > 1) {
					// Try progressively shorter versions
					for (let i = queryWords.length - 1; i >= 0; i--) {
						const partial = queryWords.slice(0, i + 1).join(' ');
						if (partial !== normalizedQuery) {
							searchVariants.push(partial);
						}
					}
				}
				
				// Check each search variant
				for (const variant of searchVariants) {
					if (normalizedAddr.includes(variant)) {
						return true;
					}
				}
				
				// If query starts with a number, check if it falls within the address range
				if (queryNumber !== null && addr.stnum1 && addr.stnum2) {
					const streetPart = normalizedQuery.replace(/^\d+\s*/, ''); // Remove number from query
					const addrStreetPart = normalizedAddr.replace(/^\d+(-\d+)?\s*/, ''); // Remove range from address
					
					// Check if the street part matches and the number is in range
					if (streetPart.length > 0 && addrStreetPart.includes(streetPart) && 
						queryNumber >= addr.stnum1 && 
						queryNumber <= addr.stnum2) {
						return true;
					}
				}
				
				return false;
			})
			.sort((a, b) => {
				// Prioritize exact matches and closer range matches
				const aNormalized = normalizeAddress(a.fullAddress);
				const bNormalized = normalizeAddress(b.fullAddress);
				
				const aExact = aNormalized.includes(normalizedQuery) ? 0 : 1;
				const bExact = bNormalized.includes(normalizedQuery) ? 0 : 1;
				
				if (aExact !== bExact) return aExact - bExact;
				
				// If both are range matches, prioritize closer numbers
				if (queryNumber !== null) {
					const aMidpoint = (a.stnum1 + a.stnum2) / 2;
					const bMidpoint = (b.stnum1 + b.stnum2) / 2;
					const aDistance = Math.abs(queryNumber - aMidpoint);
					const bDistance = Math.abs(queryNumber - bMidpoint);
					return aDistance - bDistance;
				}
				
				return 0;
			})
			.slice(0, 5); // Limit to 5 suggestions
	}

	const fetchSuggestions = debounce((query: string) => {
		if (!query || query.length < 3) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		isFetchingSuggestions = true;
		try {
			suggestions = searchAddresses(query);
			showSuggestions = suggestions.length > 0;
		} catch (error) {
			console.error('Error searching addresses:', error);
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
		handleSearch();
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

	{#if $searchState.selectedAddress}
		<div class="mt-4 rounded border border-slate-200 bg-slate-50/50 p-3">
			<div class="font-['Basis_Grotesque']">
				<p class="mb-2 text-sm font-medium text-slate-700">Selected Address:</p>
				<p class="text-lg font-medium text-slate-800">{$searchState.selectedAddress.fullAddress}</p>
				<p class="mt-2 text-sm text-slate-600">
					Lead Status: <span class="font-medium" 
						class:text-red-600={$searchState.selectedAddress.leadStatus === 'LEAD'} 
						class:text-emerald-600={$searchState.selectedAddress.leadStatus === 'NON_LEAD'} 
						class:text-amber-600={$searchState.selectedAddress.leadStatus === 'UNKNOWN'}>
						{$searchState.selectedAddress.leadStatus.replace('_', ' ')}
					</span>
				</p>
			</div>
		</div>
	{/if}
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
