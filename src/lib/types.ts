import type { Feature, Point, Polygon, FeatureCollection } from 'geojson';
import type KDBush from 'kdbush';

// Legacy Project interface (to be removed after refactoring)
export interface Project {
	uid: string;
	dataSource: string;
	fundingSource: string;
	programId: string;
	programName: string;
	projectName: string;
	projectDescription: string;
	projectLocationType: string;
	city: string;
	county: string;
	tribe: string;
	state: string;
	congressionalDistrict: string;
	fundingAmount: string;
	outlayedAmountFromIIJASupplemental: string;
	obligatedAmountFromIIJASupplemental: string;
	percentIIJAOutlayed: string;
	link: string;
	agencyName: string;
	bureauName: string;
	category: string;
	subcategory: string;
	programType: string;
	latitude: number;
	longitude: number;
}

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
}

// GeoJSON feature types
export interface AddressFeature extends Feature<Point> {
	properties: AddressWithServiceLine;
}

export interface TractFeature extends Feature<Polygon> {
	properties: CensusTract;
}

export interface ProjectFeature extends Feature<Point> {
	coordinates: [number, number];
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

export interface ProjectFeatureCollection extends FeatureCollection<Point> {
	type: 'FeatureCollection';
	features: Feature<Point>[];
}

// Indexed collections for spatial search
export interface IndexedAddressCollection {
	collection: AddressFeatureCollection;
	index: KDBush | null;
}

export interface IndexedTractCollection {
	collection: TractFeatureCollection;
	index: KDBush | null;
}

export interface IndexedFeatureCollection {
	collection: ProjectFeatureCollection;
	index: KDBush | null;
}

// Choropleth visualization modes
export type ChoroplethMode = 'median_household_income' | 'pct_black' | 'pct_minority' | 'pct_poverty';
