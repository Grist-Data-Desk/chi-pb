# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit-based web application that visualizes Inflation Reduction Act (IRA) and Bipartisan Infrastructure Law (BIL) projects across the United States. The app uses MapLibre GL for mapping, PMTiles for efficient vector tile storage, and integrates with Digital Ocean Spaces for data hosting.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server (localhost:5173)
- `pnpm build` - Build for production
- `pnpm build:cdn` - Build for production using CDN assets
- `pnpm preview` - Preview production build
- `pnpm check` - Run TypeScript checks
- `pnpm lint` - Run linting checks and Prettier verification
- `pnpm format` - Format code with Prettier

### Data Processing Pipeline
- `pnpm gen:geojson` - Generate GeoJSON from CSV data in scripts/data/raw/
- `pnpm gen:pmtiles` - Convert GeoJSON to PMTiles format
- `pnpm upload:geojson` - Upload processed GeoJSON to Digital Ocean Spaces
- `pnpm upload:pmtiles` - Upload PMTiles to Digital Ocean Spaces
- `pnpm upload:styles` - Upload map styles
- `pnpm process-all` - Run full data processing pipeline
- `pnpm build-and-publish` - Build with CDN configuration and deploy

## Architecture

### Core Components Architecture
- **State Management**: Centralized Svelte stores in `src/lib/stores.ts`
  - `dataStore` - Manages project data and spatial index
  - `searchState` - Location search functionality
  - `visualState` - Map visualization modes (agency, category, fundingSource)
  - `uiState` - UI component visibility states
- **Data Flow**: GeoJSON data is loaded, indexed with KDBush for spatial queries, and rendered as PMTiles vector layers
- **Map Integration**: MapLibre GL with custom controls, PMTiles protocol, and dynamic layer filtering

### Key Data Structures
- **Project**: TypeScript interface defining project properties (funding, location, agency, category)
- **IndexedFeatureCollection**: Combines GeoJSON FeatureCollection with KDBush spatial index
- **ColorMode**: Union type for visualization modes ('agency' | 'category' | 'fundingSource')

### Component Structure
- `/src/routes/+page.svelte` - Main map application with search, filtering, and popup functionality
- `/src/lib/components/` - Reusable UI components
  - `search/` - Location search and results table
  - `legend/` - Map legend and expand controls
  - `credits/` - Attribution and credits
- `/src/lib/utils/` - Configuration and utility functions
  - `config.ts` - Map sources, layers, and color expressions
  - `constants.ts` - Data categories and styling constants
  - `popup.ts` - Project popup functionality

### Data Processing Architecture
- Raw CSV data in `scripts/data/raw/` from various government sources
- TypeScript scripts in `scripts/src/` for data transformation
- Processing pipeline: CSV → GeoJSON → PMTiles → Upload to CDN
- Compressed GeoJSON with Brotli for client-side spatial indexing

### Deployment Architecture
- Static site deployment with CDN-hosted data assets
- Digital Ocean Spaces for PMTiles, GeoJSON, and map styles
- State-specific URL parameters for embedded views

## Important Implementation Details

- **Spatial Search**: Uses KDBush for efficient radius-based project searches
- **Map Performance**: PMTiles vector tiles with dynamic filtering via MapLibre expressions
- **Multi-Project Popups**: Handles overlapping project locations with grouped popups
- **Mobile Responsive**: Adaptive UI with different padding and layout for tablet/mobile breakpoints
- **State Embedding**: Supports state-specific views via URL parameters for iframe embedding

## Technology Stack

- **Frontend**: SvelteKit, TypeScript, TailwindCSS
- **Mapping**: MapLibre GL JS, PMTiles
- **Spatial**: Turf.js for geospatial operations, KDBush for spatial indexing
- **Data Storage**: Digital Ocean Spaces with CDN
- **Build**: Vite, pnpm package manager

## Working On This Project

### Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md, checking whether the planning file already exists first
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan
4. Then, begin working on the todo items, marking them as complete as you
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information