import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brotliCompressAsync = promisify(brotliCompress);

interface MinimalAddress {
	id: number;
	display: string;    // "1234 N State St"
	street: string;     // normalized street name for search
	num1: number;       // start house number
	num2: number;       // end house number
	zip: string;
	row: number;        // Original row ID for inventory lookup
	lat: number;        // Latitude for map zoom
	long: number;       // Longitude for map zoom
	// NO lead status - will be fetched on-demand via API
}

interface MinimalSearchIndex {
	// Maps for fast lookups
	streetNames: Record<string, number[]>;  // normalized street -> address IDs
	addresses: MinimalAddress[];            // minimal address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}

// Enhanced normalization for Chicago address variants
function normalizeStreetName(street: string): string {
	let normalized = street.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	// Handle street type variants
	const streetTypeReplacements = {
		'avenue': 'ave',
		'street': 'st',
		'saint': 'st',
		'boulevard': 'blvd',
		'parkway': 'park',
		'terrace': 'ter',
		'plaza': 'plz',
		'place': 'pl',
		'court': 'ct',
		'drive': 'dr',
		'lane': 'ln',
		'road': 'rd',
		'circle': 'cir'
	};

	// Apply street type normalizations
	for (const [full, abbrev] of Object.entries(streetTypeReplacements)) {
		normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
	}

	// Handle specific Chicago street name variants
	const streetNameReplacements = {
		'martin luther king jr': 'king',
		'martin l king jr': 'king',
		'lakeshore': 'lake shore',
		'crestline': 'crest line',
		'blueisland': 'blue island',
		'blue island': 'blueisland',
		'dekoven': 'de koven',
		'de koven': 'dekoven',
		'desplaines': 'des plaines',
		'des plaines': 'desplaines'
	};

	// Apply street name normalizations
	for (const [variant, standard] of Object.entries(streetNameReplacements)) {
		normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), standard);
	}

	// Handle prefix variants (LA, MC, O)
	normalized = normalized
		.replace(/\bla\s+/g, 'la')  // "LA SALLE" -> "lasalle"
		.replace(/\bmc\s+/g, 'mc')  // "MC VICKER" -> "mcvicker"
		.replace(/\bo\s+/g, 'o');   // "O BRIEN" -> "obrien"

	// Handle direction variants (N, S, E, W, NE, NW, SE, SW)
	const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
	const directionAbbrevs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
	
	directions.forEach((dir, i) => {
		normalized = normalized.replace(new RegExp(`\\b${dir}\\b`, 'g'), directionAbbrevs[i]);
	});

	return normalized;
}

async function generateMinimalSearchIndex(addressPath: string, outputPath: string): Promise<void> {
	console.log('Processing address data for minimal search index...');
	const addresses: MinimalAddress[] = [];
	const streetNameIndex: Record<string, number[]> = {};

	return new Promise((resolve, reject) => {
		fs.createReadStream(addressPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (csvRow: any) => {
				const normalizedRow = Object.fromEntries(
					Object.entries(csvRow).map(([key, value]) => [key.replace(/^\uFEFF/, '').trim(), value])
				);

				const id = addresses.length;
				const fullAddress = String(normalizedRow.full_address || '');
				const stnum1 = parseInt(normalizedRow.stnum1 as string) || 0;
				const stnum2 = parseInt(normalizedRow.stnum2 as string) || 0;
				const stdir = String(normalizedRow.stdir || '');
				const stname = String(normalizedRow.stname || '');
				const sttype = String(normalizedRow.sttype || '');
				const zip = String(normalizedRow.zip || '');
				const row = parseInt(normalizedRow.row as string) || 0;
				const lat = parseFloat(normalizedRow.lat as string) || 0;
				const long = parseFloat(normalizedRow.long as string) || 0;

				// Build normalized street name for indexing
				const streetParts = [stdir, stname, sttype].filter(p => p).join(' ');
				const normalizedStreet = normalizeStreetName(streetParts);

				const minimalAddress: MinimalAddress = {
					id,
					display: fullAddress,
					street: normalizedStreet,
					num1: stnum1,
					num2: stnum2,
					zip,
					row,
					lat,
					long
					// NO leadStatus - fetched on-demand
				};

				addresses.push(minimalAddress);

				// Build street name index (more comprehensive than before)
				if (normalizedStreet) {
					// Index full street name
					if (!streetNameIndex[normalizedStreet]) {
						streetNameIndex[normalizedStreet] = [];
					}
					streetNameIndex[normalizedStreet].push(id);

					// Index individual words for partial matching
					const words = normalizedStreet.split(' ');
					const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
					
					words.forEach(word => {
						// Index important short words (directions) and longer words
						if (word.length > 2 || directions.includes(word)) {
							if (!streetNameIndex[word]) {
								streetNameIndex[word] = [];
							}
							streetNameIndex[word].push(id);
						}
					});

					// Index common partial combinations
					if (words.length > 1) {
						for (let i = 0; i < words.length - 1; i++) {
							const partial = words.slice(i, i + 2).join(' ');
							if (!streetNameIndex[partial]) {
								streetNameIndex[partial] = [];
							}
							streetNameIndex[partial].push(id);
						}
					}
					
					// Index partial word matching for street names (for cases like "fr" matching "front")
					words.forEach(word => {
						if (word.length > 3) { // Only for longer words
							// Create prefix indexes for partial matching
							for (let len = 2; len <= word.length - 1; len++) {
								const prefix = word.substring(0, len);
								const indexKey = `${prefix}*`; // Use * to mark as prefix
								if (!streetNameIndex[indexKey]) {
									streetNameIndex[indexKey] = [];
								}
								streetNameIndex[indexKey].push(id);
							}
						}
					});
				}
			})
			.on('end', async () => {
				// Remove duplicates from indexes
				Object.keys(streetNameIndex).forEach(key => {
					streetNameIndex[key] = [...new Set(streetNameIndex[key])];
				});

				const searchIndex: MinimalSearchIndex = {
					streetNames: streetNameIndex,
					addresses,
					metadata: {
						totalAddresses: addresses.length,
						uniqueStreets: Object.keys(streetNameIndex).length,
						generatedAt: new Date().toISOString(),
						version: '2.0.0-minimal'
					}
				};

				// Write uncompressed version
				const jsonString = JSON.stringify(searchIndex);
				fs.writeFileSync(outputPath, jsonString, { encoding: 'utf8' });

				// Write compressed version
				const compressed = await brotliCompressAsync(Buffer.from(jsonString));
				fs.writeFileSync(`${outputPath}.br`, compressed);

				// Write metadata
				const metadata = {
					contentType: 'application/json',
					contentEncoding: 'br',
					originalSize: jsonString.length,
					compressedSize: compressed.length,
					compressionRatio: (compressed.length / jsonString.length * 100).toFixed(1) + '%'
				};
				fs.writeFileSync(`${outputPath}.br.meta`, JSON.stringify(metadata, null, 2));

				console.log(`✓ Minimal search index generated:`);
				console.log(`  - ${addresses.length} addresses`);
				console.log(`  - ${Object.keys(streetNameIndex).length} street name entries`);
				console.log(`  - Original size: ${(jsonString.length / 1024 / 1024).toFixed(1)}MB`);
				console.log(`  - Compressed size: ${(compressed.length / 1024 / 1024).toFixed(1)}MB`);
				console.log(`  - Compression ratio: ${metadata.compressionRatio}`);
				console.log(`  - Size reduction from full index: ~${((8.5 - compressed.length / 1024 / 1024) / 8.5 * 100).toFixed(0)}%`);

				resolve();
			})
			.on('error', reject);
	});
}

// Main execution
const outputDir = path.join(__dirname, '../data/processed');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

const addressPath = path.join(__dirname, '../data/raw/service-lines.csv');
const outputPath = path.join(outputDir, 'minimal-search-index.json');

console.log('Generating minimal search index...');
generateMinimalSearchIndex(addressPath, outputPath)
	.then(() => console.log('Minimal search index generation complete'))
	.catch((err: Error) => console.error('Error:', err.message));