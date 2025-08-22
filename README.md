# Chicago Water Service Line Map

Interactive web application for Chicago residents to check if their water service lines contain lead. This tool helps identify addresses with service lines requiring replacement and visualizes demographic data across Chicago census tracts and community areas. Built with SvelteKit and MapLibre GL. Developed for Grist, WBEZ, and Inside Climate News.

## Features

- 🗺️ Interactive map of Chicago showing water service line status by address
- 🔍 Address search with autocomplete for Chicago addresses
- 🏠 Individual property lead status lookup
- 📊 Demographic overlays at both Census Tract and Community Area levels
- 📚 Resources panel with helpful links and information
- 💨 Fast vector tile rendering using PMTiles

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [pnpm](https://pnpm.io/) (v9.15.4 or later)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Grist-Data-Desk/chi-pb
   cd chi-pb
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:cdn` - Build for production using CDN assets
- `pnpm preview` - Preview production build
- `pnpm preview:cdn` - Preview production build using CDN assets

### Code Quality

- `pnpm check` - Run TypeScript checks
- `pnpm check:watch` - Run TypeScript checks in watch mode
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run linting checks and Prettier verification

### Data Processing Pipeline

- `pnpm gen:clip` - Clip GeoJSON data to Chicago boundary
- `pnpm gen:search` - Generate minimal search index for address autocomplete
- `pnpm gen:inventory-lookup` - Create inventory lookup data for serverless function
- `pnpm gen:service-lines` - Generate service lines GeoJSON from CSV data
- `pnpm gen:pmtiles` - Convert GeoJSON to PMTiles format
- `pnpm gen:quantiles` - Calculate quantile breakpoints for choropleth map layers
- `pnpm process:data` - Run all generation scripts in sequence (clip, search, inventory, service-lines, pmtiles, quantiles)
- `pnpm upload:pmtiles` - Upload PMTiles to Digital Ocean Spaces
- `pnpm upload:search` - Upload search index
- `pnpm upload:inventory-lookup` - Upload inventory lookup data
- `pnpm upload:styles` - Upload map styles
- `pnpm upload:all` - Upload all generated data to CDN

### Deployment

- `pnpm publish:app` - Deploy the application
- `pnpm deploy:functions` - Deploy serverless functions
- `pnpm build-and-publish` - Build with CDN configuration and deploy everything

## Technology Stack

- [SvelteKit](https://kit.svelte.dev/) with Svelte 5 - Web application framework
- [MapLibre GL JS](https://maplibre.org/) v5 - Mapping library
- [PMTiles](https://github.com/protomaps/PMTiles) - Efficient tile storage format
- [TailwindCSS](https://tailwindcss.com/) v4 - Styling
- [TypeScript](https://www.typescriptlang.org/) v5 - Type safety
- [Vite](https://vitejs.dev/) v6 - Build tooling
- [Digital Ocean Spaces](https://www.digitalocean.com/products/spaces) - Data storage and CDN
- [Digital Ocean Functions](https://www.digitalocean.com/products/functions) - Serverless backend

## Project Structure

- `/src` - Application source code
  - `/routes` - SvelteKit routes, including main map page
  - `/lib` - Shared components and utilities
    - `/components` - Reusable UI components
      - `/credits` - Credit and note components
      - `/data` - Area context and demographic display components
      - `/legend` - Map legend for choropleth modes
      - `/logos` - Organization logo components
      - `/resources` - Resources panel components
      - `/search` - Address search and service line results
      - `/shared` - Shared UI components (tooltips, portals, tabs)
    - `/state` - Svelte 5 state management
      - `feature.svelte.ts` - Selected feature state
      - `inventory.svelte.ts` - Service line inventory state
      - `map.svelte.ts` - Map instance state
      - `popup.svelte.ts` - Map popup state
      - `search.svelte.ts` - Search functionality state
      - `spatial-index.svelte.ts` - Spatial indexing for performance
      - `ui.svelte.ts` - UI visibility states
      - `visualization.svelte.ts` - Choropleth and aggregation state
    - `/types` - TypeScript type definitions
    - `/utils` - Utility functions, constants, and configuration
- `/scripts` - Data processing and deployment scripts
  - `/src` - TypeScript source code for data processing
  - `/data` - Data files
    - `/raw` - Input data files (inventory CSV, census GeoJSON, community areas GeoJSON)
    - `/processed` - Generated files (PMTiles, search index, inventory lookup)
- `/styles` - Map style configuration
- `/functions` - Serverless functions
  - `/packages/inventory/lookup` - Water service line inventory lookup API
- `/static` - Static assets (favicon, etc.)

## Data Sources

- **Water Service Line Inventory**: City of Chicago water service line inventory data
- **Geocoded Addresses**: Chicago address points with geographic coordinates
- **Census Data**: American Community Survey (ACS) demographic data for Chicago census tracts
- **Community Areas**: Chicago community area boundaries with aggregated demographic and service line statistics

## Lead Status Categories

The map displays water service lines in four categories:

- 🔴 **Lead**: Confirmed lead service line
- 🔴 **Suspected Lead**: Service line material is reported to likely contain lead
- 🔴 **Galvanized Requiring Replacement**: Galvanized pipes that may be contaminated with lead and require replacement
- 🔵 **Non-Lead**: Confirmed non-lead service line

## Choropleth Map Layers

The map supports visualization at two aggregation levels with three demographic overlays:

### Aggregation Levels
- **Census Tracts**: Fine-grained view at the census tract level
- **Community Areas**: Broader view at the community area level (77 areas in Chicago)

### Data Overlays
- **Percent Requires Replacement**: Percentage of addresses requiring lead pipe replacement
- **Percent Poverty**: Poverty rate percentage
- **Percent Minority**: Minority population percentage

These overlays use quantile-based color scales calculated from the data at each aggregation level. The quantile breakpoints are automatically generated when processing data, with proportionally-sized color bins reflecting the distribution of values.

## Embedding the Map

The map can be embedded in other websites using an `iframe`. Here's an example:

```html
<iframe
	src="https://grist.org/project/chi-water-service-lines/"
	style="margin-left: calc(50% - 50vw); width: 100vw; height: calc(100vh - 66px); border: 0; margin-bottom: 10px;"
></iframe>
```

## Search Details

### Indexing Strategy

The application uses a combined index approach that merges search and spatial data for optimal performance:

1. **Combined Index Generation**:
   - Processes 470,000+ Chicago addresses from CSV data
   - Creates a normalized street name index for efficient searching
   - Integrates service line material data directly into the index
   - Handles special cases like intersection addresses (e.g., "W LAKE & N CALIF")
   - Applies normalization (e.g., "Martin Luther King Jr" → "King")
   - Uses compact field names to minimize file size
   - Compresses using Brotli compression for optimal delivery

2. **Index Structure**:
   - `streets`: Maps normalized street words to address IDs
   - `addresses`: Array of combined address and material data
   - Each address includes coordinates, service line material, and display information
   - Intersection addresses are indexed by each street component separately

### Search Strategy

The client-side search (`src/lib/components/search/SearchPanel.svelte`) implements:

1. **Query Processing**:
   - Normalizes user input (handles abbreviations, directions, common variants)
   - Supports multiple search patterns:
     - Number + street: "123 Main St"
     - Street only: "Michigan Ave"
     - Intersections: "Lake & California" or "Lake and California"

2. **Intersection Search**:
   - Detects intersection queries (contains "&" or "and")
   - Finds addresses matching ALL streets in the intersection
   - Works regardless of street order (e.g., "Lake & Calif" = "Calif & Lake")

3. **Efficiency Optimizations**:
   - Uses pre-built street index instead of scanning all addresses
   - Limits results to top 5 matches
   - Debounces search queries (300ms delay)
   - Combined index provides material data without additional API calls

### Serverless Function

The inventory lookup API (`functions/packages/inventory/lookup/index.js`) provides:

1. **Purpose**: Fetches detailed water service line data for specific addresses
2. **Architecture**:
   - Deployed as a Digital Ocean serverless function
   - Uses pre-indexed, address-based lookup stored as compressed Brotli files
   - Caches lookup data in memory for performance
   - Returns all service lines at a given address (supports multi-unit buildings)

3. **Data Flow**:
   - Client searches for address → gets full address string from search index
   - Client calls serverless function with address parameter
   - Function returns inventory data including:
     - Lead status
     - Material details for public/private portion of lines
   - Client updates map marker color based on worst lead status

This architecture uses a hybrid approach: the combined index provides immediate basic service line data client-side for map visualization, while the serverless function provides detailed inventory data on demand. This optimizes initial load times while ensuring full data availability.

## Credits

Development by [Clayton Aldern](https://github.com/clayton-aldern) for [Grist](https://grist.org). Project structure and additional development by [Parker Ziegler](https://github.com/parkerziegler).
