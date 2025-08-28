# Chicago Water Service Line Map

An interactive map helping Chicago residents check if their water service lines contain lead and need replacement. Developed for Grist, WBEZ, and Inside Climate News.

## Related Coverage

📰 **[Read the investigation](https://grist.org/accountability/chicago-lead-pipe-replacement-map-health)**: Grist, WBEZ, and Inside Climate News' in-depth story on Chicago's lead pipe crisis and its environmental justice implications.

🔍 **[How we mapped the crisis](https://grist.org/accountability/how-we-mapped-chicago-lead-pipe-crisis-methods-data)**: A detailed explanation of our methodology and data analysis approach.

📋 **[Resource guide for residents](https://grist.org/accountability/chicago-lead-pipe-how-to-protect-yourself-test-water/)**: Practical steps to protect yourself and test your water for lead.

## Live Demo

🌐 **Try it now:** [https://grist.org/chicago-lead](https://grist.org/project/updates/interactive-chicago-lead-map/)

## Features

- 🔍 Search any Chicago address to check for lead service lines
- 🗺️ Interactive map showing water service line status citywide
- 📊 View demographic data by census tract or community area
- 📚 Access resources about lead pipe replacement programs

## Quick Start

### For End Users

1. Visit the [live map](https://grist.org/chicago-lead)
2. Search for your address in the search box
3. View your property's service line status
4. Click on census tracts to see area demographics and replacement statistics
5. Use the legend to switch between different data views

### For Developers

#### Prerequisites

- [Node.js](https://nodejs.org/) (Node.js 22 LTS or later)
- [pnpm](https://pnpm.io/) (v10.15.0 or later)
- Modern browser with WebGL and ES2019 support (Chrome 73+, Firefox 67+, Safari 12.1+, Edge 79+)

#### Setup

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

## Essential Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run linting checks
- `pnpm format` - Format code with Prettier

> For detailed data processing, deployment, and advanced scripts, see [DEVELOPER.md](./DEVELOPER.md)

## Technology Stack

- [SvelteKit](https://kit.svelte.dev/) - Web application framework
- [MapLibre GL JS](https://maplibre.org/) - Mapping library
- [PMTiles](https://github.com/protomaps/PMTiles) - Efficient tile storage format
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tooling
- [Digital Ocean Spaces](https://www.digitalocean.com/products/spaces) - Data storage and CDN
- [Digital Ocean Functions](https://www.digitalocean.com/products/functions) - Serverless backend

## Project Structure

- `/src` - Application source code (components, routes, utilities)
- `/scripts` - Data processing scripts
- `/functions` - Serverless functions
- `/styles` - Map style configuration

> For detailed project architecture and structure, see [DEVELOPER.md](./DEVELOPER.md)

## Data Information

See the [Inside Climate News companion repository](https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines) for detailed analysis methodology.

### Data Sources

- **Water Service Line Inventory**: City of Chicago water service line inventory data
- **Geocoded Addresses**: Chicago address points with geographic coordinates
- **Census Data**: American Community Survey (ACS) demographic data for Chicago census tracts
- **Community Areas**: Chicago community area boundaries with aggregated demographic and service line statistics

### Lead Status Categories

The map displays water service lines in four categories:

- 🔴 **Lead**: At least one component of the service line is known to be made of lead.
- 🔴 **Suspected Lead**: The composition of the service line is marked unknown in the city’s inventory, but is suspected to contain lead components, usually based on the building’s age.
- 🔴 **Galvanized Requiring Replacement**: No components of the service line are known to be made from lead, but at least one is composed of galvanized steel, which can become contaminated with lead from upstream pipes.
- 🔵 **Non-Lead**: None of the components of the line are made from or may be contaminated with lead.

### Map Visualization Layers

The map supports visualization at two aggregation levels with three demographic overlays:

**Aggregation Levels:**
- **Census Tracts**: Fine-grained view at the census tract level
- **Community Areas**: Broader view at the community area level (77 neighborhoods in Chicago)

**Data Overlays:**
- **Percent Requires Replacement**: Percentage of service lines requiring replacement due to likely lead contamination
- **Percent Poverty**: 2023 5-year ACS estimate for the percentage of the population below the federal poverty level
- **Percent Minority**: 2023 5-year ACS estimate for the percentage of the population identifying as anything other than white alone, not Hispanic

These overlays use quantile-based color scales calculated from the data at each aggregation level. The quantile breakpoints are automatically generated when processing data, with proportionally-sized color bins reflecting the distribution of values.

## Embedding the Map

The map can be embedded in other websites using an `iframe` suited to their styles. For example, embedding on `grist.org` while avoiding a sticky header looks like this:

```html
<iframe
	src="https://grist.org/project/updates/interactive-chicago-lead-map/"
	margin-left="calc(50% - 50vw)"
	width="100vw"
   height="calc(100vh - 66px)"
	border="0"
   margin-bottom="10px"
></iframe>
```

## Credits

Development by [Clayton Aldern](https://github.com/clayton-aldern) and [Parker Ziegler](https://github.com/parkerziegler) for [Grist](https://grist.org).

Data analysis by [Peter Aldhous](https://github.com/paldhous) (Inside Climate News) and [Amy Qin](https://github.com/amyq96) (WBEZ). See the [Inside Climate News companion repository](https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines) for data analysis details.
