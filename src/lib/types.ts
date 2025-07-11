import type { Feature, Point, Polygon, FeatureCollection } from 'geojson';
import type KDBush from 'kdbush';

// Chicago water service line types
export interface Address {
	row: number;
	fullAddress: string;
	isIntersection: boolean;
	stnum1: number;
	stnum2: number;
	stdir: string;
	stname: string;
	sttype: string;
	zip: string;
	geocoder: string;
	lat: number;
	long: number;
	geoid: string;
	// Matched fields
	mIsIntersection: boolean;
	mStnum1: number;
	mStnum2: number;
	mStdir: string;
	mStname: string;
	mZip: string;
}

export interface CensusTract {
	geoid: string;
	median_household_income: number;
	pct_black: number;
	pct_minority: number;
	pct_poverty: number;
}

export interface ServiceLine {
	fullAddress: string;
	lcrSiteId: string;
	highRisk: string;
	serviceNewlyIdentified: string;
	pwsServiceInstallDates: string;
	customerServiceInstallDates: string;
	combinedSourceDescription: string;
	gooseneck: string;
	publSrvLnMatEPA: string; // Public service line material
	privateSrvLnMatEPA: string; // Private service line material
	overallSLCode: string; // Overall service line code
	galDownstreamofLead: string;
	customerNotifiedDate: string;
	previousLeadServiceReplaced: string;
	finalServiceInstallDates: string;
	materialOfServiceLineReplacement: string;
	waiverCustomerRefusedAccessToProperty: string;
	idphWaiverDate: string;
}

// Combined address + service line data
export interface AddressWithServiceLine extends Address {
	serviceLine?: ServiceLine;
	hasLead: boolean;
	leadStatus: 'LEAD' | 'NON_LEAD' | 'UNKNOWN';
	serviceLineCount?: number;
}

// GeoJSON feature types
export interface AddressFeature extends Feature<Point> {
	properties: AddressWithServiceLine;
}

export interface TractFeature extends Feature<Polygon> {
	properties: CensusTract;
}

// Collection types
export interface AddressFeatureCollection extends FeatureCollection<Point> {
	type: 'FeatureCollection';
	features: AddressFeature[];
}

export interface TractFeatureCollection extends FeatureCollection<Polygon> {
	type: 'FeatureCollection';
	features: TractFeature[];
}

// Indexed collections for spatial search
export interface IndexedAddressCollection {
	collection: AddressFeatureCollection;
	index: KDBush | null;
	addresses?: AddressWithServiceLine[]; // Simple array for search functionality
}

export interface IndexedTractCollection {
	collection: TractFeatureCollection;
	index: KDBush | null;
}

// Choropleth visualization modes
export type ChoroplethMode = 'pct_requires_replacement' | 'pct_poverty' | 'pct_minority';

// Search index types for optimized address search
export interface CompactAddress {
	id: number;
	display: string;    // "1234 N State St"
	street: string;     // normalized street name
	num1: number;       // start house number
	num2: number;       // end house number
	zip: string;
	leadStatus: string;
}

export interface SearchIndex {
	// Maps for fast lookups
	streetNames: Record<string, number[]>;  // normalized street -> address IDs
	numbers: Record<string, number[]>;      // house number ranges -> address IDs  
	zips: Record<string, number[]>;         // ZIP -> address IDs
	addresses: CompactAddress[];            // compact address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}

// Minimal search index types (no lead status, smaller file size)
export interface MinimalAddress {
	id: number;
	display: string;    // "1234 N State St"
	street: string;     // normalized street name for search
	num1: number;       // start house number
	num2: number;       // end house number
	zip: string;
	row: number;        // row number from source data for inventory lookup
	lat: number;        // Latitude for map zoom
	long: number;       // Longitude for map zoom
	serviceLineCount?: number; // Number of service lines at this address
	// NO leadStatus - fetched on-demand via API
}

export interface MinimalSearchIndex {
	streetNames: Record<string, number[]>;  // normalized street -> address IDs
	addresses: MinimalAddress[];            // minimal address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}

// Inventory API response types
export interface InventoryData {
	fullAddress: string;
	serviceLineMaterial: string;
	customerSideMaterial: string;
	utilitySideMaterial: string;
	overallCode: string;
	gooseneck: string;
	highRisk: string;
	lastUpdated: string;
	additionalNotes: string;
	rowId?: number;
	PublSrvLnMatEPA?: string;
	PrivateSrvLnMatEPA?: string;
	Gooseneck?: string;
	OverallSL_Code?: string;
}

export interface InventoryApiResponse {
	success: boolean;
	address?: string;
	rowId?: number;
	count?: number;
	inventory?: InventoryData;
	inventoryList?: InventoryData[];
	metadata?: {
		timestamp: string;
		source: string;
	};
	error?: string;
}
