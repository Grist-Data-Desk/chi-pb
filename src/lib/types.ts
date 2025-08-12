import type { Point, FeatureCollection } from 'geojson';

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
	mIsIntersection: boolean;
	mStnum1: number;
	mStnum2: number;
	mStdir: string;
	mStname: string;
	mZip: string;
}

interface ServiceLineStatistics {
	GRR: number;
	L: number;
	NL: number;
	pct_grr: number;
	pct_lead: number;
	pct_not_lead: number;
	pct_requires_replacement: number;
	pct_suspected_lead: number;
	requires_replacement: number;
	total: number;
	U: number;
}

interface DemographicStatistics {
	median_household_income: number;
	pct_asian_nonhispanic: number;
	pct_black_nonhispanic: number;
	pct_minority: number;
	pct_poverty: number;
	pct_white_nonhispanic: number;
}

export interface CensusTract extends ServiceLineStatistics, DemographicStatistics {
	geoid: string;
}

export interface CommunityArea extends ServiceLineStatistics, DemographicStatistics {
	area_num_1: string;
	community: string;
}

export interface AddressWithServiceLine extends Address {
	hasLead: boolean;
	leadStatus: 'LEAD' | 'NON_LEAD' | 'UNKNOWN';
	serviceLineCount?: number;
}

export interface IndexedAddressCollection {
	collection: FeatureCollection<Point>;
	index: null;
	addresses?: AddressWithServiceLine[];
}

/**
 * Represents the core attribute used for the main choropleth map visualization.
 */
export type ChoroplethMode = 'pct_requires_replacement' | 'pct_poverty' | 'pct_minority';

/**
 * Represents the level of aggregation used for the main choropleth map visualization.
 */
export type AggregationLevel = 'tract' | 'community';

export interface MinimalAddress {
	id: number;
	display: string; // "1234 N State St"
	street: string; // normalized street name for search
	num1: number; // start house number
	num2: number; // end house number
	zip: string;
	row: number; // row number from source data for inventory lookup
	lat: number; // Latitude for map zoom
	long: number; // Longitude for map zoom
	serviceLineCount?: number; // Number of service lines at this address
}

export interface MinimalSearchIndex {
	streetNames: Record<string, number[]>; // normalized street -> address IDs
	addresses: MinimalAddress[]; // minimal address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}

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

// Spatial Index
export interface ServiceLinePoint {
	row: number;
	lat: number;
	long: number;
	material: string;
}

export interface ServiceLineSpatialIndex {
	points: ServiceLinePoint[];
	metadata: {
		totalPoints: number;
		generatedAt: string;
		version: string;
	};
}

// Combined index types (optimized for space)
export interface CombinedAddress {
	i: number; // id (shortened field name)
	r: number; // row
	a: string; // address without ", CHICAGO, IL," to save space
	s: string; // street (normalized for search)
	n1: number; // num1
	n2: number; // num2
	z: string; // zip
	la: number; // latitude
	lo: number; // longitude
	m: string; // material (single char)
}

export interface CombinedIndex {
	streets: Record<string, number[]>; // normalized street -> address IDs
	addresses: CombinedAddress[]; // combined address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}
