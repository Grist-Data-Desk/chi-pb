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

- `pnpm gen:addresses` - Convert geocoded addresses CSV to GeoJSON
- `pnpm gen:inventory` - Process water service line inventory data
- `pnpm gen:search` - Generate minimal search index for address autocomplete
- `pnpm gen:inventory-lookup` - Create inventory lookup data for serverless function
- `pnpm gen:pmtiles` - Convert GeoJSON to PMTiles format
- `pnpm process:data` - Run all generation scripts in sequence
- `pnpm upload:pmtiles` - Upload PMTiles to storage
- `pnpm upload:csv` - Upload inventory CSV for serverless function
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

## Embedding the Map

The map can be embedded in other websites using an `iframe`. Here's an example:

```html
<iframe 
  src="https://grist.org/project/chi-water-service-lines/" 
  style="margin-left: calc(50% - 50vw); width: 100vw; height: calc(100vh - 66px); border: 0; margin-bottom: 10px;"
></iframe>
```

## Credits

Development by [Clayton Aldern](https://github.com/clayton-aldern) for [Grist](https://grist.org). Project structure and additional development by [Parker Ziegler](https://github.com/parkerziegler).
