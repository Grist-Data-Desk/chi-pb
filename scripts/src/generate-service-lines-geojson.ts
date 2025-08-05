import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import type { Feature, FeatureCollection, Point } from 'geojson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServiceLineProperties {
	row: number;
	fullAddress: string;
	gooseneck_pigtail: string;
	pws_owned_service_line_material: string;
	customer_side_service_line_material: string;
	material: string; // Overall classification
	is_intersection: boolean;
	stnum1: number;
	stnum2: number;
	stdir: string;
	stname: string;
	sttype: string;
	zip: string;
	lat: number;
	long: number;
}

type ServiceLineFeature = Feature<Point, ServiceLineProperties>;
type ServiceLineFeatureCollection = FeatureCollection<Point, ServiceLineProperties>;

async function generateServiceLinesGeoJSON(): Promise<void> {
	const inputPath = path.join(__dirname, '../data/raw/service-lines.csv');
	const outputPath = path.join(__dirname, '../data/raw/service-lines.geojson');
	
	const features: ServiceLineFeature[] = [];
	let recordCount = 0;
	let skippedCount = 0;
	
	return new Promise((resolve, reject) => {
		fs.createReadStream(inputPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (csvRow: any) => {
				// Normalize column names (remove BOM if present)
				const normalizedRow = Object.fromEntries(
					Object.entries(csvRow).map(([key, value]) => [key.replace(/^\uFEFF/, '').trim(), value])
				);
				
				recordCount++;
				
				// Parse coordinates
				const lat = parseFloat(normalizedRow.lat as string);
				const long = parseFloat(normalizedRow.long as string);
				
				// Skip records without valid coordinates
				if (!lat || !long || isNaN(lat) || isNaN(long)) {
					skippedCount++;
					return;
				}
				
				// Create GeoJSON feature
				const feature: ServiceLineFeature = {
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [long, lat] // GeoJSON uses [longitude, latitude]
					},
					properties: {
						row: parseInt(normalizedRow.row as string) || 0,
						fullAddress: String(normalizedRow.matched_address || ''),
						gooseneck_pigtail: String(normalizedRow.gooseneck_pigtail || 'U'),
						pws_owned_service_line_material: String(normalizedRow.pws_owned_service_line_material || 'U'),
						customer_side_service_line_material: String(normalizedRow.customer_side_service_line_material || 'U'),
						material: String(normalizedRow.classification_for_entire_service_line || 'U'),
						is_intersection: normalizedRow.is_intersection === 'TRUE',
						stnum1: parseInt(normalizedRow.stnum1 as string) || 0,
						stnum2: parseInt(normalizedRow.stnum2 as string) || 0,
						stdir: String(normalizedRow.stdir || ''),
						stname: String(normalizedRow.stname || ''),
						sttype: String(normalizedRow.sttype || ''),
						zip: String(normalizedRow.zip || ''),
						lat: lat,
						long: long
					}
				};
				
				features.push(feature);
			})
			.on('end', () => {
				// Create FeatureCollection
				const featureCollection: ServiceLineFeatureCollection = {
					type: 'FeatureCollection',
					features: features
				};
				
				// Write to file
				fs.writeFileSync(outputPath, JSON.stringify(featureCollection, null, 2));
				
				console.log('✓ Service lines GeoJSON generated:');
				console.log(`  - Total records processed: ${recordCount}`);
				console.log(`  - Valid features created: ${features.length}`);
				console.log(`  - Skipped (no coordinates): ${skippedCount}`);
				console.log(`  - Output: ${outputPath}`);
				
				// Show sample of material types
				const materialTypes = new Set(features.map(f => f.properties.material));
				console.log(`  - Material classifications: ${Array.from(materialTypes).join(', ')}`);
				
				resolve();
			})
			.on('error', reject);
	});
}

// Run the script
console.log('Generating service lines GeoJSON...');
generateServiceLinesGeoJSON()
	.then(() => console.log('Service lines GeoJSON generation complete'))
	.catch((err: Error) => console.error('Error:', err.message));