import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brotliCompressAsync = promisify(brotliCompress);

interface CombinedAddress {
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

interface CombinedIndex {
	// Maps for lookups
	streets: Record<string, number[]>; // normalized street -> address IDs
	addresses: CombinedAddress[]; // combined address data by ID
	metadata: {
		totalAddresses: number;
		uniqueStreets: number;
		generatedAt: string;
		version: string;
	};
}

interface ServiceLinePoint {
	row: number; // Row ID for matching with PMTiles
	lat: number;
	long: number;
	material: string; // Lead status for filtering
}

interface ServiceLineSpatialIndex {
	points: ServiceLinePoint[];
	metadata: {
		totalPoints: number;
		generatedAt: string;
		version: string;
	};
}

// Normalization for address variants
function normalizeStreetName(street: string): string {
	let normalized = street
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	// Some street type variants
	const streetTypeReplacements = {
		avenue: 'ave',
		street: 'st',
		saint: 'st',
		boulevard: 'blvd',
		parkway: 'park',
		terrace: 'ter',
		plaza: 'plz',
		place: 'pl',
		court: 'ct',
		drive: 'dr',
		lane: 'ln',
		road: 'rd',
		circle: 'cir'
	};

	for (const [full, abbrev] of Object.entries(streetTypeReplacements)) {
		normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
	}

	// Some street name variants
	const streetNameReplacements = {
		'martin luther king jr': 'king',
		'martin l king jr': 'king',
		lakeshore: 'lake shore',
		crestline: 'crest line',
		blueisland: 'blue island',
		'blue island': 'blueisland',
		dekoven: 'de koven',
		'de koven': 'dekoven',
		desplaines: 'des plaines',
		'des plaines': 'desplaines'
	};

	for (const [variant, standard] of Object.entries(streetNameReplacements)) {
		normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, 'g'), standard);
	}

	// Some prefix variants (LA, MC, O)
	normalized = normalized
		.replace(/\bla\s+/g, 'la') // "LA SALLE" -> "lasalle"
		.replace(/\bmc\s+/g, 'mc') // "MC VICKER" -> "mcvicker"
		.replace(/\bo\s+/g, 'o'); // "O BRIEN" -> "obrien"

	// Direction variants (N, S, E, W, NE, NW, SE, SW)
	const directions = [
		'north',
		'south',
		'east',
		'west',
		'northeast',
		'northwest',
		'southeast',
		'southwest'
	];
	const directionAbbrevs = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

	directions.forEach((dir, i) => {
		normalized = normalized.replace(new RegExp(`\\b${dir}\\b`, 'g'), directionAbbrevs[i]);
	});

	return normalized;
}

async function generateCombinedIndex(addressPath: string, outputPath: string): Promise<void> {
	console.log('Processing address data for combined index...');
	const addresses: CombinedAddress[] = [];
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
				let fullAddress = String(normalizedRow.matched_address || '');
				const stnum1 = parseInt(normalizedRow.stnum1 as string) || 0;
				const stnum2 = parseInt(normalizedRow.stnum2 as string) || 0;
				const stdir = String(normalizedRow.stdir || '');
				const stname = String(normalizedRow.stname || '');
				const sttype = String(normalizedRow.sttype || '');
				const zip = String(normalizedRow.zip || '');
				const row = parseInt(normalizedRow.row as string) || 0;
				const lat = parseFloat(normalizedRow.lat as string) || 0;
				const long = parseFloat(normalizedRow.long as string) || 0;
				const isIntersection = normalizedRow.is_intersection === 'TRUE';
				const material = String(normalizedRow.classification_for_entire_service_line || 'U');

				// For ranged addresses, reconstruct the address with the range
				if (stnum1 > 0 && stnum2 > 0 && stnum1 !== stnum2) {
					// This is a ranged address - replace the single number with the range
					const addressParts = fullAddress.split(' ');
					if (addressParts[0] && /^\d+$/.test(addressParts[0])) {
						addressParts[0] = `${stnum1}-${stnum2}`;
						fullAddress = addressParts.join(' ');
					}
				}

				// Build normalized street name for indexing
				const streetParts = [stdir, stname, sttype].filter((p) => p).join(' ');
				const normalizedStreet = normalizeStreetName(streetParts);

				// Remove ", CHICAGO, IL" from the address to save space, but keep the zip separate
				// Handle patterns like "123 MAIN ST, CHICAGO, IL, 60601" or "123 MAIN ST, CHICAGO, IL 60601"
				const shortAddress = fullAddress
					.replace(/,\s*CHICAGO,?\s*IL,?\s*(?=\d{5})/gi, ', ')
					.replace(/,\s*CHICAGO,?\s*IL,?\s*$/gi, '')
					.trim();

				const combinedAddress: CombinedAddress = {
					i: id,
					r: row,
					a: shortAddress,
					s: normalizedStreet,
					n1: stnum1,
					n2: stnum2,
					z: zip,
					la: lat,
					lo: long,
					m: material.charAt(0) // Just first character to save space
				};

				addresses.push(combinedAddress);

				// Handle intersection addresses
				if (isIntersection && fullAddress.includes('&')) {
					// Parse intersection from full address
					// Example: "W LAKE & N CALIF, CHICAGO IL 60612"
					const intersectionMatch = fullAddress.match(/^([^,]+),/);
					if (intersectionMatch) {
						const intersectionText = intersectionMatch[1];
						// Split by & and index each street name
						const streets = intersectionText.split('&').map((s) => s.trim());

						streets.forEach((street) => {
							const normalizedIntersectionStreet = normalizeStreetName(street);
							if (normalizedIntersectionStreet) {
								// Index full street name
								if (!streetNameIndex[normalizedIntersectionStreet]) {
									streetNameIndex[normalizedIntersectionStreet] = [];
								}
								streetNameIndex[normalizedIntersectionStreet].push(id);

								// Index individual words
								const words = normalizedIntersectionStreet.split(' ');
								const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

								words.forEach((word) => {
									if (word.length > 2 || directions.includes(word)) {
										if (!streetNameIndex[word]) {
											streetNameIndex[word] = [];
										}
										streetNameIndex[word].push(id);
									}
								});
							}
						});
					}
				}

				// Build street name index
				if (normalizedStreet) {
					// Index full street name
					if (!streetNameIndex[normalizedStreet]) {
						streetNameIndex[normalizedStreet] = [];
					}
					streetNameIndex[normalizedStreet].push(id);

					// Index individual words for partial matching
					const words = normalizedStreet.split(' ');
					const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

					words.forEach((word) => {
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
					words.forEach((word) => {
						if (word.length > 3) {
							// Only for longer words
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
				Object.keys(streetNameIndex).forEach((key) => {
					streetNameIndex[key] = [...new Set(streetNameIndex[key])];
				});

				const combinedIndex: CombinedIndex = {
					streets: streetNameIndex,
					addresses,
					metadata: {
						totalAddresses: addresses.length,
						uniqueStreets: Object.keys(streetNameIndex).length,
						generatedAt: new Date().toISOString(),
						version: '1.0.0-combined'
					}
				};

				const jsonString = JSON.stringify(combinedIndex);
				fs.writeFileSync(outputPath, jsonString, { encoding: 'utf8' });

				const compressed = await brotliCompressAsync(Buffer.from(jsonString));
				fs.writeFileSync(`${outputPath}.br`, compressed);

				const metadata = {
					contentType: 'application/json',
					contentEncoding: 'br',
					originalSize: jsonString.length,
					compressedSize: compressed.length,
					compressionRatio: ((compressed.length / jsonString.length) * 100).toFixed(1) + '%'
				};
				fs.writeFileSync(`${outputPath}.br.meta`, JSON.stringify(metadata, null, 2));

				console.log(`✓ Combined index generated:`);
				console.log(`  - ${addresses.length} addresses`);
				console.log(`  - ${Object.keys(streetNameIndex).length} street name entries`);
				console.log(`  - Original size: ${(jsonString.length / 1024 / 1024).toFixed(1)}MB`);
				console.log(`  - Compressed size: ${(compressed.length / 1024 / 1024).toFixed(1)}MB`);
				console.log(`  - Compression ratio: ${metadata.compressionRatio}`);

				resolve();
			})
			.on('error', reject);
	});
}

const outputDir = path.join(__dirname, '../data/processed');

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

const addressPath = path.join(__dirname, '../data/raw/service-lines.csv');
const outputPath = path.join(outputDir, 'combined-index.json');

console.log('Generating combined search and spatial index...');
generateCombinedIndex(addressPath, outputPath)
	.then(() => console.log('Combined index generation complete'))
	.catch((err: Error) => console.error('Error:', err.message));
