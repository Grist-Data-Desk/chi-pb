# Chicago Water Service Line Mapping Tool - Project Plan

## Overview
Refactor the existing IRA/BIL project mapping application into a Chicago-focused water service line mapping tool. Users will be able to search for their address and view information about their water service line composition (lead status) along with demographic and service line data for their Census tract.

## Data Architecture Changes

### Core Data Sources
1. **Census Tracts**: `scripts/data/raw/chi-acs-filled.geojson` → Choropleth base layer
2. **Address Database**: `scripts/data/raw/geocoded-addresses.csv` → Searchable address index  
3. **Service Line Inventory**: `scripts/data/raw/inventory.xlsx` → Service line composition data

### Data Processing Pipeline Updates
- Convert chi-acs-filled.geojson to PMTiles for choropleth visualization
- Process geocoded-addresses.csv into searchable format (likely PMTiles + client-side index)
- Process inventory.xlsx to link with addresses and Census tracts

## Refactoring Tasks

### Phase 1: Data Pipeline & Types ✅ **COMPLETE**
- [x] **Update TypeScript types** (`src/lib/types.ts`)
  - [x] Replace `Project` interface with `ServiceLine` interface
  - [x] Add `CensusTract` interface for tract-level data
  - [x] Add `Address` interface for standardized addresses
  
- [x] **Refactor data processing scripts**
  - [x] Update `scripts/src/geojson-to-pmtiles.ts` to convert chi-acs-filled.geojson to PMTiles
  - [x] Update `scripts/src/csv-to-geojson.ts` script to process geocoded-addresses.csv for search indexing
  - [x] Create script to process inventory.csv separately (no joining yet)
  - [x] Update package.json scripts for new data pipeline

**New Commands Available:**
- `pnpm gen:addresses` - Process geocoded addresses to GeoJSON
- `pnpm gen:inventory` - Process service line inventory with lead determination
- `pnpm process-chicago` - Run full Chicago data pipeline

**Testing Requirements:**
- [x] Test data processing pipeline commands work without errors
- [x] Verify generated files have expected structure and data
- [x] Confirm TypeScript compilation with new types

### Phase 2: Core Store Refactoring ✅ **COMPLETE**
- [x] **Update stores.ts**
  - [x] Replace `dataStore` to handle Census tract data instead of projects
  - [x] Refactor `searchState` for address-based search instead of location search
  - [x] Update `visualState` for choropleth modes instead of project categories
  - [x] Add new stores for address data and service line inventory

**New Stores Available:**
- `tractStore` - Manages Census tract data with choropleth visualization
- `addressStore` - Manages Chicago address database for search
- `filteredAddresses` - Derived store for address search results
- `selectedAddress` - Currently selected address from search
- `selectedChoroplethMode` - Current choropleth visualization mode
- `hasSelectedAddress` - Boolean for whether an address is selected

**New Types:**
- `ChoroplethMode` - Union type for tract visualization modes
- Store interfaces updated to use `AddressWithServiceLine`, `IndexedTractCollection`, etc.

**Testing Requirements:**
- [x] Verify all stores initialize correctly with new types
- [x] Test address search functionality and filtering
- [x] Confirm choropleth mode switching works
- [x] Check derived store reactivity

### Phase 3: Map Configuration Updates ✅ **COMPLETE**
- [x] **Update config.ts**
  - [x] Replace Digital Ocean paths with Chicago-specific data paths (`chi-pb` instead of `ira-bil`)
  - [x] Create choropleth layer configurations for Census tracts
  - [x] Remove project point layers, add address point layers
  - [x] Update color expressions for tract-level data visualization

**New Configuration Available:**
- `SOURCE_CONFIG.censusTracts` - Chicago Census tract PMTiles source
- `SOURCE_CONFIG.addresses` - Chicago address database PMTiles source
- `LAYER_CONFIG.censusTractsFill` - Choropleth fill layer for tracts
- `LAYER_CONFIG.censusTractsStroke` - Stroke layer for tract boundaries
- `LAYER_CONFIG.addressesPoints` - Address points with lead status colors
- `getChoroplethColorExpression()` - Dynamic choropleth coloring function
- `getAddressColorExpression()` - Address point coloring by lead status
- `CHOROPLETH_CATEGORIES` - Available choropleth visualization modes
- `LEAD_STATUS_CATEGORIES` - Lead service line status categories

**Testing Requirements:**
- [ ] Verify map loads with Chicago tract PMTiles data
- [ ] Test choropleth color expressions render correctly
- [ ] Confirm address points display with proper lead status colors
- [ ] Check layer visibility toggles work
- [ ] Test map bounds focus on Chicago area

### Phase 4: UI Component Refactoring ✅ **COMPLETE**
- [x] **Refactor SearchPanel component**
  - [x] Replace location geocoding with address matching from CSV
  - [x] Implement enhanced fuzzy matching for Chicago addresses with range support
  - [x] Update search results to show address matches with lead status
  - [x] Handle address standardization variants (Avenue/Ave, Saint/St, LA/LA SALLE, etc.)
  - [x] Add range matching logic (12106 matches 12100-14 range)
  - [x] Implement smart sorting by relevance and proximity

**SearchPanel Enhancements:**
- Address range matching for multi-unit buildings
- Street name variant handling (MARTIN LUTHER KING JR ↔ KING)
- Prefix normalization (LA SALLE ↔ LASALLE, MC VICKER ↔ MCVICKER) 
- Street type standardization (Avenue ↔ Ave, Saint ↔ St, Parkway ↔ Park)
- Compound word variants (LAKESHORE ↔ LAKE SHORE, BLUE ISLAND ↔ BLUEISLAND)
- Direction handling and partial word matching
- Lead status display in suggestions

- [x] **Update Legend component** ✅ **COMPLETE**
  - [x] Replace project category legend with choropleth legend
  - [x] Add tract-level data categories (demographics only - no service line composition in tract data)
  - [x] Update color scales for continuous data
  - [x] Fix data field names to match actual Census data (`median_household_income`, `pct_black`, etc.)
  - [x] Create continuous scale legends with value ranges
  - [x] Update mode selector for 4 choropleth options

**Legend Enhancements:**
- Choropleth visualization modes: Income, % Black, % Minority, % Poverty
- Continuous color scales with value ranges (e.g., $0-$50K, $50K-$100K)
- No filtering (informational legend for continuous data)
- Updated UI for 4-column mode selector

**Testing Requirements:**
- [ ] Test address search with fuzzy matching and variants
- [ ] Verify address range matching works (12106 matches 12100-14)
- [ ] Test search suggestions display lead status correctly
- [ ] Confirm legend displays correct choropleth categories and colors
- [ ] Test legend mode switching updates map visualization
- [ ] Verify continuous color scale legends show proper value ranges
- [ ] Test mobile responsiveness of search and legend components

- [ ] **Refactor popup functionality** ⚠️ **UPDATED REQUIREMENTS**
  - [ ] Update `src/lib/utils/popup.ts` to handle Census tract data instead of project data
  - [ ] Create `generateTractPopupContent()` function for tract demographics and service line stats
  - [ ] Add tract identification logic to determine which tract is being hovered/clicked
  - [ ] Implement conditional popup logic in main map component:
    - [ ] Track selected address tract ID in store state
    - [ ] Disable popup display for tract containing selected address
    - [ ] Maintain popup functionality for all other tracts
  - [ ] Update map event handlers to distinguish between tract hover/click vs address selection
  - [ ] Add tract-level service line aggregation (calculate % lead, % unknown, % non-lead per tract)
  - [ ] Format popup content to show:
    - [ ] Tract identifier (GEOID or name)
    - [ ] Demographics (median income, % minority, etc.)
    - [ ] Aggregated service line statistics
    - [ ] Total addresses/properties in tract
  - [ ] Test popup behavior with address search integration
  - [ ] Ensure mobile/touch compatibility for tract popups

### Phase 5: Main Application Updates
- [ ] **Update +page.svelte**
  - Replace project-focused map initialization with tract choropleth
  - Update event handlers for address search instead of project search
  - Modify map bounds to focus on Chicago instead of national view
  - Update layer management for choropleth + address points

### Phase 6: Search & Address Matching
- [ ] **Implement address search system**
  - Create client-side search index from geocoded-addresses.csv
  - Implement fuzzy matching for address standardization
  - Add address validation and suggestion functionality
  - Link addresses to service line inventory data

### Phase 7: Choropleth Visualization
- [ ] **Implement tract-level visualization**
  - Create choropleth styling based on tract demographics/service line data
  - Add multiple visualization modes (lead percentage, demographics, etc.)
  - Implement interactive tract selection and highlighting
  - Add comparative statistics display

### Phase 8: Integration & Polish
- [ ] **Data integration**
  - Link address searches to service line inventory
  - Connect addresses to their respective Census tracts
  - Implement tract-level aggregation of service line data

- [ ] **UI/UX improvements**
  - Update application title and branding for Chicago focus
  - Adjust mobile responsiveness for address search workflow
  - Update credits and data attribution

## Technical Considerations

### Address Search Strategy
- Index geocoded-addresses.csv for fast client-side search
- Implement fuzzy matching for address variations
- Consider using a trie or similar data structure for autocomplete

### Choropleth Implementation
- Use MapLibre expressions for dynamic tract coloring
- Implement data-driven styling for continuous variables
- Consider multiple classification methods (quantile, equal interval, etc.)

### Data Linking Strategy
- Establish clear relationships between addresses, service lines, and tracts
- Use consistent identifiers across datasets
- Implement efficient lookup mechanisms

### Popup Implementation Strategy
- **Tract-only popups**: Only show information at Census tract level, never for individual addresses
- **Conditional popup logic**: Disable popups for the tract containing the currently selected address
- **State management**: Track selected address tract to prevent popup conflicts
- **Event handling**: Distinguish between tract hover/click and address selection events
- **Content aggregation**: Pre-calculate or dynamically compute tract-level service line statistics

## Success Criteria
1. Users can search for any standardized Chicago address
2. Address search returns service line composition (lead status)
3. Map displays choropleth of Chicago tracts with relevant data
4. Clicking on tracts shows comparative demographic/service line data
5. Search results integrate seamlessly with map visualization
6. Application maintains performance with Chicago-scale data

## Review Section
*To be completed after implementation*
