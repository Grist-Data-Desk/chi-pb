# Developer Documentation

This document provides comprehensive technical details for developers working on the Chicago Water Service Lines project.

## Table of Contents

- [Available Scripts](#available-scripts)
- [Detailed Project Structure](#detailed-project-structure)
- [Data Processing Pipeline](#data-processing-pipeline)
- [Development Workflow](#development-workflow)
- [Architecture Details](#architecture-details)
- [Search Implementation](#search-implementation)
- [Deployment](#deployment)

## Available Scripts

### Development Commands

- `pnpm dev` - Start development server at localhost:5173
- `pnpm build` - Build for production
- `pnpm build:cdn` - Build for production using CDN assets
- `pnpm preview` - Preview production build locally
- `pnpm preview:cdn` - Preview production build using CDN assets

### Code Quality

- `pnpm check` - Run TypeScript type checking
- `pnpm check:watch` - Run TypeScript checks in watch mode
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run ESLint and verify Prettier formatting

### Data Processing Pipeline

#### Generation Scripts

- `pnpm gen:clip` - Clip GeoJSON data to Chicago boundary
- `pnpm gen:search` - Generate minimal search index for address autocomplete
- `pnpm gen:inventory-lookup` - Create inventory lookup data for serverless function
- `pnpm gen:service-lines` - Generate service lines GeoJSON from CSV data
- `pnpm gen:pmtiles` - Convert GeoJSON to PMTiles format
- `pnpm gen:quantiles` - Calculate quantile breakpoints for choropleth map layers
- `pnpm process:data` - Run all generation scripts in sequence (clip, search, inventory, service-lines, pmtiles, quantiles)

#### Upload Scripts

- `pnpm upload:pmtiles` - Upload PMTiles to Digital Ocean Spaces
- `pnpm upload:search` - Upload search index
- `pnpm upload:inventory-lookup` - Upload inventory lookup data
- `pnpm upload:styles` - Upload map styles
- `pnpm upload:all` - Upload all generated data to CDN

### Deployment

- `pnpm publish:app` - Deploy the application
- `pnpm deploy:functions` - Deploy serverless functions to Digital Ocean
- `pnpm build-and-publish` - Build with CDN configuration and deploy everything

## Detailed Project Structure

```
chi-pb/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte        # Root layout
│   │   ├── +page.svelte          # Main map application
│   │   └── +page.ts              # Page data loading
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── credits/          # Credit and attribution components
│   │   │   │   ├── Credits.svelte
│   │   │   │   └── Notes.svelte
│   │   │   ├── data/             # Data display components
│   │   │   │   ├── AreaContext.svelte
│   │   │   │   └── DemographicData.svelte
│   │   │   ├── legend/           # Map legend components
│   │   │   │   ├── ChoroplethLegend.svelte
│   │   │   │   ├── ExpandedLegend.svelte
│   │   │   │   └── Legend.svelte
│   │   │   ├── logos/            # Organization logos
│   │   │   │   ├── ChiWorks.svelte
│   │   │   │   ├── CCHI.svelte
│   │   │   │   └── GristLogoText.svelte
│   │   │   ├── resources/        # Resources panel
│   │   │   │   └── ResourcesPanel.svelte
│   │   │   ├── search/           # Search functionality
│   │   │   │   ├── SearchBar.svelte
│   │   │   │   ├── SearchResults.svelte
│   │   │   │   └── ServiceLineResults.svelte
│   │   │   └── shared/           # Shared UI components
│   │   │       ├── LegendTooltip.svelte
│   │   │       ├── Portal.svelte
│   │   │       └── Tabs.svelte
│   │   │
│   │   ├── state/                # Svelte 5 state management
│   │   │   ├── feature.svelte.ts         # Selected feature state
│   │   │   ├── inventory.svelte.ts       # Service line inventory state
│   │   │   ├── map.svelte.ts             # Map instance state
│   │   │   ├── popup.svelte.ts           # Map popup state
│   │   │   ├── search.svelte.ts          # Search functionality state
│   │   │   ├── spatial-index.svelte.ts   # Spatial indexing for performance
│   │   │   ├── ui.svelte.ts              # UI visibility states
│   │   │   └── visualization.svelte.ts   # Choropleth and aggregation state
│   │   │
│   │   ├── types/                # TypeScript definitions
│   │   │   └── index.ts
│   │   │
│   │   └── utils/                # Utility functions
│   │       ├── config.ts         # Map configuration
│   │       ├── constants.ts      # Application constants
│   │       ├── formatters.ts     # Data formatters
│   │       ├── popup.ts          # Popup utilities
│   │       └── search.ts         # Search utilities
│   │
│   └── app.html                  # HTML template
│
├── scripts/                      # Data processing scripts
│   ├── src/
│   │   ├── clip-to-boundary.py  # Clip data to Chicago boundary (Python)
│   │   ├── generate-inventory-lookup.ts   # Generate inventory lookup
│   │   ├── geojson-to-pmtiles.ts       # Convert to PMTiles format
│   │   ├── calculate-quantiles.ts     # Calculate quantile breakpoints
│   │   ├── generate-minimal-search-index.ts  # Generate search index
│   │   ├── generate-service-lines-geojson.ts # Process service line data
│   │   └── upload-*.ts          # Various upload scripts
│   │
│   └── data/
│       ├── raw/                  # Input data files
│       │   ├── inventory.csv    # Chicago water service inventory
│       │   ├── census-tracts.geojson    # Census tract boundaries
│       │   └── community-areas.geojson  # Community area boundaries
│       │
│       └── processed/            # Generated files
│           ├── *.pmtiles        # PMTiles vector tiles
│           ├── search-index.json # Address search index
│           └── inventory-lookup.json # Service line lookup
│
├── functions/                    # Serverless functions
│   └── packages/
│       └── inventory/
│           └── lookup/          # Inventory lookup API
│               ├── index.js
│               └── package.json
│
├── styles/                       # Map styles
│   ├── light.json               # Light theme map style
│   └── satellite.json           # Satellite imagery style
│
└── static/                       # Static assets
    └── favicon.ico
```

## Data Processing Pipeline

### Overview

The data processing pipeline transforms raw Chicago water service line inventory data and census data into optimized formats for web mapping.

### Pipeline Steps

1. **Clip GeoJSON** (`gen:clip`)
   - Clips census tracts and community areas to Chicago city boundaries
   - Ensures all geographic data is constrained to the city limits

2. **Generate Service Lines** (`gen:service-lines`)
   - Processes raw CSV inventory data (~470,000 addresses)
   - Geocodes addresses and creates GeoJSON features
   - Assigns service line material categories

3. **Generate Search Index** (`gen:search`)
   - Creates normalized street name index
   - Handles special cases (intersections, abbreviations)
   - Applies Brotli compression for optimal delivery

4. **Generate Inventory Lookup** (`gen:inventory-lookup`)
   - Creates lookup data for serverless function
   - Maps addresses to service line materials
   - Optimized for quick API responses

5. **Generate PMTiles** (`gen:pmtiles`)
   - Converts GeoJSON to PMTiles vector tile format
   - Creates separate files for addresses, tracts, and community areas
   - Optimizes for map rendering performance

6. **Calculate Quantiles** (`gen:quantiles`)
   - Calculates statistical breakpoints for choropleth maps
   - Generates quantile values for:
     - Percent requires replacement
     - Percent poverty
     - Percent minority
   - Creates color scale breakpoints for visualization

### Running the Complete Pipeline

```bash
# Process all data in sequence
pnpm process:data

# Upload everything to CDN
pnpm upload:all
```

## Development Workflow

### Initial Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Configure Digital Ocean credentials (see notes on environment variables [below](#deployment))
4. Run development server: `pnpm dev`

### Working with Data

1. Place raw data files in `scripts/data/raw/`
2. Run processing pipeline: `pnpm process:data`
3. Test locally with processed data
4. Upload to CDN when ready: `pnpm upload:all`

### Code Quality Checks

Before committing:
```bash
pnpm check    # TypeScript type checking
pnpm lint     # ESLint checks
pnpm format   # Format with Prettier
```

## Architecture Details

### State Management

The application uses Svelte 5's new state management system with dedicated state modules:

- **feature.svelte.ts**: Manages selected map features
- **inventory.svelte.ts**: Handles service line inventory data
- **map.svelte.ts**: Controls MapLibre map instance
- **popup.svelte.ts**: Manages map popup display
- **search.svelte.ts**: Handles address search functionality
- **spatial-index.svelte.ts**: Maintains KDBush spatial index for performance
- **ui.svelte.ts**: Controls UI component visibility
- **visualization.svelte.ts**: Manages choropleth modes and aggregation levels

### Map Rendering

- Uses MapLibre GL JS for vector tile rendering
- PMTiles protocol for efficient tile delivery
- Dynamic layer filtering via MapLibre expressions
- Custom controls for visualization modes

### Performance Optimizations

- KDBush spatial indexing for 470,000+ addresses
- Brotli compression for data files
- PMTiles for efficient vector tile delivery
- Lazy loading of search index
- Debounced search input

## Search Implementation

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

### Spatial Queries

After text search, results are enhanced with spatial data:
- KDBush index for nearest neighbor queries
- Turf.js for geometric operations
- Real-time calculation of distances

### Serverless Inventory API

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

## Deployment

### Application Deployment

```bash
# Build and deploy application
pnpm build-and-publish
```

This command:
1. Builds the application with CDN asset URLs
2. Deploys to hosting platform
3. Updates serverless functions

### CDN Configuration

Assets are hosted on Digital Ocean Spaces with CloudFlare CDN:
- PMTiles: `https://cdn.example.com/pmtiles/`
- Search index: `https://cdn.example.com/search/`
- Map styles: `https://cdn.example.com/styles/`

### Serverless Functions

The inventory lookup function is deployed to Digital Ocean Functions:

```bash
pnpm deploy:functions
```

Function endpoint: `https://faas.example.com/inventory/lookup`

### Environment Variables

Required environment variables for deployment:

```bash
# Digital Ocean Spaces
DO_SPACES_KEY=your_key
DO_SPACES_SECRET=your_secret
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name

# CDN URLs
PUBLIC_CDN_BASE_URL=https://cdn.example.com
PUBLIC_PMTILES_URL=https://cdn.example.com/pmtiles
PUBLIC_SEARCH_URL=https://cdn.example.com/search
PUBLIC_STYLES_URL=https://cdn.example.com/styles
```