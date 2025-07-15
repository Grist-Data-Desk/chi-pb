# Chicago Water Service Line Map

Interactive web application for Chicago residents to check if their water service line contains lead. This tool helps identify properties with lead service lines and visualizes demographic data across Chicago census tracts. Built with SvelteKit and MapLibre GL.

## Features

- 🗺️ Interactive map of Chicago showing water service line status by address
- 🔍 Address search with autocomplete for Chicago addresses
- 🏠 Individual property lead status lookup
- 📊 Census tract demographic overlays (income, race, poverty rates)
- 📱 Responsive design for both desktop and mobile
- 💨 Fast vector tile rendering using PMTiles
- ⚡ Real-time inventory data via serverless functions

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

- `pnpm gen:search` - Generate minimal search index for address autocomplete
- `pnpm gen:inventory-lookup` - Create inventory lookup data for serverless function
- `pnpm gen:pmtiles` - Convert GeoJSON to PMTiles format
- `pnpm gen:quantiles` - Calculate quantile breakpoints for choropleth map layers
- `pnpm process:data` - Run all generation scripts in sequence (search, inventory, pmtiles, quantiles)
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

- [SvelteKit](https://kit.svelte.dev/) - Web application framework
- [MapLibre GL JS](https://maplibre.org/) - Mapping library
- [PMTiles](https://github.com/protomaps/PMTiles) - Efficient tile storage format
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Digital Ocean Spaces](https://www.digitalocean.com/products/spaces) - Data storage and CDN
- [Digital Ocean Functions](https://www.digitalocean.com/products/functions) - Serverless backend

## Project Structure

- `/src` - Application source code
  - `/routes` - SvelteKit routes, including main map page
  - `/lib` - Shared components and utilities
    - `/components` - Reusable UI components
      - `/credits` - Credit and note components
      - `/search` - Address search and service line results
      - `/legend` - Map legend for choropleth modes
    - `/types` - TypeScript type definitions
    - `/utils` - Utility functions, constants, and configuration
- `/scripts` - Data processing and deployment scripts
  - `/src` - TypeScript source code for data processing
  - `/data` - Data files
    - `/raw` - Input data files (addresses CSV, inventory CSV, census GeoJSON)
    - `/processed` - Generated files (PMTiles, search index, inventory lookup)
- `/styles` - Map style configuration
- `/functions` - Serverless functions
  - `/packages/inventory` - Water service line inventory lookup API
- `/static` - Static assets (favicon, etc.)

## Data Sources

- **Water Service Line Inventory**: City of Chicago water service line inventory data
- **Geocoded Addresses**: Chicago address points with geographic coordinates
- **Census Data**: American Community Survey (ACS) demographic data for Chicago census tracts

## Lead Status Categories

The map displays water service lines in four categories:

- 🔴 **Lead (L)**: Confirmed lead service line
- 🟠 **Galvanized Requiring Replacement (GRR)**: Galvanized pipes that need replacement
- 🟡 **Unknown (U)**: Service line material is unknown
- 🟢 **Non-Lead (NL)**: Confirmed non-lead service line

## Choropleth Map Layers

The map supports census tract visualization with three demographic overlays:

- **Percent Requires Replacement**: Percentage of addresses requiring lead pipe replacement
- **Percent Poverty**: Poverty rate percentage by census tract
- **Percent Minority**: Minority population percentage by census tract

These overlays use quantile-based color scales calculated from the census data. The quantile breakpoints are automatically generated when processing data.

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

The application uses a custom-built minimal search index optimized for fast address lookups:

1. **Index Generation** (`scripts/src/generate-minimal-search-index.ts`):
   - Processes 470,000+ Chicago addresses from CSV data
   - Creates a normalized street name index for efficient searching
   - Handles special cases like intersection addresses (e.g., "W LAKE & N CALIF")
   - Applies some normalization (e.g., "Martin Luther King Jr" → "King")
   - Compresses the index using Brotli compression (120MB -> 12MB)

2. **Index Structure**:
   - `streetNames`: Maps normalized street words to address IDs
   - `addresses`: Array of minimal address objects with coordinates
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

### Serverless Function

The inventory lookup API (`functions/packages/inventory/lookup-v2/index.js`) provides:

1. **Purpose**: Fetches detailed water service line data for specific addresses
2. **Architecture**:
   - Deployed as a Digital Ocean serverless function
   - Uses pre-indexed, address-based lookup stored as compressed Brotli JSON
   - Caches lookup data in memory for performance
   - Returns all service lines at a given address (some addresses have multiple)

3. **Data Flow**:
   - Client searches for address → gets full address string from search index
   - Client calls serverless function with address parameter
   - Function returns inventory data including:
     - Lead status (L, GRR, U, NL)
     - Material details for public/private lines and gooseneck
     - High risk property indicators
   - Client updates map marker color based on worst lead status

This architecture separates search (client-side) from inventory data (server-side) to optimize initial load times while providing detailed data on demand. The v2 API supports multiple service lines per address, which is common in multi-unit buildings.

## Credits

Development by [Clayton Aldern](https://github.com/clayton-aldern) for [Grist](https://grist.org). Project structure and additional development by [Parker Ziegler](https://github.com/parkerziegler).
