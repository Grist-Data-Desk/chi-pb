import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brotliCompressAsync = promisify(brotliCompress);

// Compact service line format
interface CompactServiceLine {
	i: number; // row ID
	p: string; // pws_owned_service_line_material
	r: string; // customer_side_service_line_material  
	g: string; // gooseneck_pigtail
	o: string; // classification_for_entire_service_line
}

// Address-indexed lookup structure
interface InventoryLookup {
	// Each address maps to an array of service lines
	[normalizedAddress: string]: CompactServiceLine[];
}

interface LookupMetadata {
	totalRecords: number;
	uniqueAddresses: number;
	generatedAt: string;
	version: string;
}

// Normalize address for consistent lookups
function normalizeAddress(address: string): string {
	return address.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

async function generateInventoryLookup(): Promise<void> {
	const inventoryPath = path.join(__dirname, '../data/raw/service-lines.csv');
	const lookupOutputPath = path.join(__dirname, '../data/processed/inventory-lookup.json');
	const metadataOutputPath = path.join(__dirname, '../data/processed/inventory-lookup-metadata.json');
	
	const lookup: InventoryLookup = {};
	let totalRecords = 0;
	
	return new Promise((resolve, reject) => {
		fs.createReadStream(inventoryPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (csvRow: any) => {
				// Normalize column names
				const normalizedRow = Object.fromEntries(
					Object.entries(csvRow).map(([key, value]) => [key.replace(/^\uFEFF/, '').trim(), value])
				);
				
				const row = parseInt(normalizedRow.row as string) || 0;
				const matchedAddress = String(normalizedRow.matched_address || '').trim();
				const stnum1 = parseInt(normalizedRow.stnum1 as string) || 0;
				const stnum2 = parseInt(normalizedRow.stnum2 as string) || 0;
				
				if (matchedAddress && row) {
					// For ranged addresses, reconstruct the address with the range
					let fullAddress = matchedAddress;
					if (stnum1 > 0 && stnum2 > 0 && stnum1 !== stnum2) {
						// This is a ranged address - replace the single number with the range
						// matched_address typically has just the first number, e.g., "5408 N KENMORE AVE"
						// We need to make it "5408-5412 N KENMORE AVE"
						const addressParts = matchedAddress.split(' ');
						if (addressParts[0] && /^\d+$/.test(addressParts[0])) {
							addressParts[0] = `${stnum1}-${stnum2}`;
							fullAddress = addressParts.join(' ');
						}
					}
					
					const normalizedAddr = normalizeAddress(fullAddress);
					
					// Create compact service line record
					const serviceLine: CompactServiceLine = {
						i: row,
						p: String(normalizedRow.pws_owned_service_line_material || 'U'),
						r: String(normalizedRow.customer_side_service_line_material || 'U'),
						g: String(normalizedRow.gooseneck_pigtail || 'U'),
						o: String(normalizedRow.classification_for_entire_service_line || 'U')
					};
					
					// Add to address-indexed lookup
					if (!lookup[normalizedAddr]) {
						lookup[normalizedAddr] = [];
					}
					lookup[normalizedAddr].push(serviceLine);
					
					totalRecords++;
				}
			})
			.on('end', async () => {
				const uniqueAddresses = Object.keys(lookup).length;
				
				// Create metadata separately
				const metadata: LookupMetadata = {
					totalRecords,
					uniqueAddresses,
					generatedAt: new Date().toISOString(),
					version: '2.0.0'
				};
				
				// Write metadata file
				fs.writeFileSync(metadataOutputPath, JSON.stringify(metadata, null, 2));
				
				// Write uncompressed lookup
				const lookupJson = JSON.stringify(lookup);
				fs.writeFileSync(lookupOutputPath, lookupJson);
				
				// Write compressed lookup for server
				const compressed = await brotliCompressAsync(Buffer.from(lookupJson));
				fs.writeFileSync(`${lookupOutputPath}.br`, compressed);
				
				// Write compressed metadata
				const metadataJson = JSON.stringify(metadata);
				const compressedMeta = await brotliCompressAsync(Buffer.from(metadataJson));
				fs.writeFileSync(`${metadataOutputPath}.br`, compressedMeta);
				
				console.log(`✓ Inventory lookup generated:`)
				console.log(`  - Total records: ${totalRecords}`);
				console.log(`  - Unique addresses: ${uniqueAddresses}`);
				console.log(`  - Lookup size: ${(lookupJson.length / 1024 / 1024).toFixed(1)}MB uncompressed`);
				console.log(`  - Lookup size: ${(compressed.length / 1024 / 1024).toFixed(1)}MB compressed`);
				
				// Show addresses with most service lines
				const addressCounts = Object.entries(lookup)
					.map(([addr, lines]) => ({ addr, count: lines.length }))
					.sort((a, b) => b.count - a.count);
				
				console.log(`  - Top 5 addresses by service line count:`);
				addressCounts.slice(0, 5).forEach(({ addr, count }) => {
					console.log(`    - ${addr}: ${count} service lines`);
				});
				
				resolve();
			})
			.on('error', reject);
	});
}

// Run the script
generateInventoryLookup()
	.then(() => console.log('Done!'))
	.catch(err => console.error('Error:', err));