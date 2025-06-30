import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';
import type { FeatureCollection } from 'geojson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brotliCompressAsync = promisify(brotliCompress);

interface AddressRow {
	row: number;
	full_address: string;
	is_intersection: boolean;
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
	m_is_intersection: boolean;
	m_stnum1: number;
	m_stnum2: number;
	m_stdir: string;
	m_stname: string;
	m_zip: string;
	// Inventory data fields
	overallSLCode?: string;
	highRisk?: string;
	publSrvLnMatEPA?: string;
	privateSrvLnMatEPA?: string;
	gooseneck?: string;
	combinedSourceDescription?: string;
}

interface InventoryRow {
	idx: number;
	fullAddress: string;
	lcrSiteID: string;
	highRisk: string;
	serviceNewlyIdentified: string;
	gooseneck: string;
	publSrvLnMatEPA: string;
	privateSrvLnMatEPA: string;
	overallSLCode: string;
	combinedSourceDescription: string;
}

function cleanFieldName(key: string): string {
	return key.replace(/^\uFEFF/, '').trim();
}

async function compressWithBrotli(data: string): Promise<Buffer> {
	return brotliCompressAsync(Buffer.from(data));
}

async function writeCompressedJSON(filePath: string, data: any): Promise<void> {
	const jsonString = JSON.stringify(data);

	fs.writeFileSync(filePath, jsonString, {
		encoding: 'utf8'
	});

	const compressed = await compressWithBrotli(jsonString);
	fs.writeFileSync(`${filePath}.br`, compressed, {
		encoding: 'binary'
	});

	const metadata = {
		contentType: 'application/json',
		contentEncoding: 'br',
		originalSize: jsonString.length,
		compressedSize: compressed.length
	};
	fs.writeFileSync(`${filePath}.br.meta`, JSON.stringify(metadata, null, 2));
}

async function loadInventoryData(inventoryPath: string): Promise<Map<number, InventoryRow>> {
	const inventoryMap = new Map<number, InventoryRow>();

	return new Promise((resolve, reject) => {
		fs.createReadStream(inventoryPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (row: any) => {
				const normalizedRow = Object.fromEntries(
					Object.entries(row).map(([key, value]) => [cleanFieldName(key), value])
				);

				const inventoryRow: InventoryRow = {
					idx: parseInt(normalizedRow.Idx as string) || 0,
					fullAddress: String(normalizedRow.FullAddress || ''),
					lcrSiteID: String(normalizedRow.LCRSiteID || ''),
					highRisk: String(normalizedRow['High Risk'] || ''),
					serviceNewlyIdentified: String(normalizedRow.ServiceNewlyIdentified || ''),
					gooseneck: String(normalizedRow.Gooseneck || ''),
					publSrvLnMatEPA: String(normalizedRow.PublSrvLnMatEPA || ''),
					privateSrvLnMatEPA: String(normalizedRow.PrivateSrvLnMatEPA || ''),
					overallSLCode: String(normalizedRow['OverallSL Code'] || ''),
					combinedSourceDescription: String(normalizedRow.CombinedSourceDescription || '')
				};

				inventoryMap.set(inventoryRow.idx, inventoryRow);
			})
			.on('end', () => {
				console.log(`Loaded ${inventoryMap.size} inventory records`);
				resolve(inventoryMap);
			})
			.on('error', reject);
	});
}

async function processAddressCSV(inputPath: string, outputDir: string, inventoryPath: string): Promise<void> {
	const rows: AddressRow[] = [];

	// Load inventory data first
	console.log('Loading inventory data...');
	const inventoryMap = await loadInventoryData(inventoryPath);

	return new Promise((resolve, reject) => {
		fs.createReadStream(inputPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (row: any) => {
				const normalizedRow = Object.fromEntries(
					Object.entries(row).map(([key, value]) => [cleanFieldName(key), value])
				);

				const rowId = parseInt(normalizedRow.row as string) || 0;
				const inventoryData = inventoryMap.get(rowId);

				const addressRow: AddressRow = {
					row: rowId,
					full_address: String(normalizedRow.full_address || ''),
					is_intersection: String(normalizedRow.is_intersection).toLowerCase() === 'true',
					stnum1: parseInt(normalizedRow.stnum1 as string) || 0,
					stnum2: parseInt(normalizedRow.stnum2 as string) || 0,
					stdir: String(normalizedRow.stdir || ''),
					stname: String(normalizedRow.stname || ''),
					sttype: String(normalizedRow.sttype || ''),
					zip: String(normalizedRow.zip || ''),
					geocoder: String(normalizedRow.geocoder || ''),
					lat: parseFloat(normalizedRow.lat as string) || 0,
					long: parseFloat(normalizedRow.long as string) || 0,
					geoid: String(normalizedRow.geoid || ''),
					m_is_intersection: String(normalizedRow.m_is_intersection).toLowerCase() === 'true',
					m_stnum1: parseInt(normalizedRow.m_stnum1 as string) || 0,
					m_stnum2: parseInt(normalizedRow.m_stnum2 as string) || 0,
					m_stdir: String(normalizedRow.m_stdir || ''),
					m_stname: String(normalizedRow.m_stname || ''),
					m_zip: String(normalizedRow.m_zip || ''),
					// Join inventory data if available
					overallSLCode: inventoryData?.overallSLCode,
					highRisk: inventoryData?.highRisk,
					publSrvLnMatEPA: inventoryData?.publSrvLnMatEPA,
					privateSrvLnMatEPA: inventoryData?.privateSrvLnMatEPA,
					gooseneck: inventoryData?.gooseneck,
					combinedSourceDescription: inventoryData?.combinedSourceDescription
				};

				rows.push(addressRow);
			})
			.on('end', async () => {
				const addressGeoJSON = createAddressGeoJSON(rows);
				const baseName = path.basename(inputPath, '.csv');
				const outputPath = path.join(outputDir, `${baseName}.geojson`);
				
				await writeCompressedJSON(outputPath, addressGeoJSON);
				console.log(`Processed ${rows.length} addresses`);
				const withInventory = rows.filter(r => r.overallSLCode).length;
				console.log(`${withInventory} addresses matched with inventory data`);
				resolve();
			})
			.on('error', reject);
	});
}

function createAddressGeoJSON(rows: AddressRow[]): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: rows.map((row) => ({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [row.long, row.lat]
			},
			properties: {
				row: row.row,
				fullAddress: row.full_address,
				isIntersection: row.is_intersection,
				stnum1: row.stnum1,
				stnum2: row.stnum2,
				stdir: row.stdir,
				stname: row.stname,
				sttype: row.sttype,
				zip: row.zip,
				geocoder: row.geocoder,
				geoid: row.geoid,
				mIsIntersection: row.m_is_intersection,
				mStnum1: row.m_stnum1,
				mStnum2: row.m_stnum2,
				mStdir: row.m_stdir,
				mStname: row.m_stname,
				mZip: row.m_zip,
				// Inventory data
				overallSLCode: row.overallSLCode || null,
				highRisk: row.highRisk || null,
				publSrvLnMatEPA: row.publSrvLnMatEPA || null,
				privateSrvLnMatEPA: row.privateSrvLnMatEPA || null,
				gooseneck: row.gooseneck || null,
				combinedSourceDescription: row.combinedSourceDescription || null
			}
		}))
	};
}

// Main execution
const outputDir = path.join(__dirname, '../../scripts/data/processed');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

const addressPath = path.join(__dirname, '../../scripts/data/raw/geocoded-addresses.csv');
const inventoryPath = path.join(__dirname, '../../scripts/data/processed/inventory.csv');
console.log(`Processing Chicago addresses: ${path.basename(addressPath)}...`);
processAddressCSV(addressPath, outputDir, inventoryPath)
	.then(() => console.log('Address CSV processing complete'))
	.catch((err: Error) => console.error('Error:', err.message));