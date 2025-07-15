/**
 * DigitalOcean Function for Chicago Water Service Line Inventory Lookup V2
 *
 * This function takes an address and returns all service lines at that address
 * using a pre-indexed, address-based lookup file.
 *
 * Usage:
 *   GET /api/inventory-lookup-v2?address=123%20Main%20St
 */

const https = require('https');
const zlib = require('zlib');

// Global variable to cache the lookup data
let lookupData = null;
let lookupLoadPromise = null;

// Build additional notes from inventory record
function buildAdditionalNotes(serviceLine) {
	const notes = [];

	if (serviceLine.h === 'Y') {
		notes.push('Marked as high risk property');
	}

	return notes.join('; ') || '';
}

// Load the pre-indexed lookup data (cached)
async function loadLookupData() {
	// Return cached data if available
	if (lookupData) {
		return lookupData;
	}

	// Return existing promise if already loading
	if (lookupLoadPromise) {
		return lookupLoadPromise;
	}

	// Start loading
	lookupLoadPromise = new Promise((resolve, reject) => {
		const lookupUrl =
			'https://grist.nyc3.cdn.digitaloceanspaces.com/chi-pb/data/search/inventory-lookup.json.brotli';

		console.log('Loading compressed lookup data from:', lookupUrl);

		https
			.get(lookupUrl, (res) => {
				const chunks = [];

				if (res.statusCode !== 200) {
					reject(new Error(`Failed to load lookup data: ${res.statusCode}`));
					return;
				}

				res.on('data', (chunk) => {
					chunks.push(chunk);
				});

				res.on('end', () => {
					try {
						// Combine all chunks into a single Buffer
						const data = Buffer.concat(chunks);

						console.log(`Downloaded ${data.length} bytes`);

						// Try to decompress as brotli (our .brotli files are always compressed)
						zlib.brotliDecompress(data, (err, decompressedData) => {
							if (err) {
								reject(new Error('Failed to decompress lookup data: ' + err.message));
								return;
							}

							try {
								lookupData = JSON.parse(decompressedData.toString());
								console.log('Lookup data loaded and decompressed successfully:', {
									uniqueAddresses: Object.keys(lookupData).length,
									compressedSize: `${(data.length / 1024 / 1024).toFixed(1)}MB`,
									decompressedSize: `${(decompressedData.length / 1024 / 1024).toFixed(1)}MB`
								});
								resolve(lookupData);
							} catch (parseError) {
								reject(new Error('Failed to parse lookup data: ' + parseError.message));
							}
						});
					} catch (error) {
						reject(new Error('Failed to process lookup data: ' + error.message));
					}
				});
			})
			.on('error', (err) => {
				reject(err);
			});
	});

	return lookupLoadPromise;
}

// Transform compact service line to API response format
function transformServiceLine(compactServiceLine, fullAddress) {
	return {
		fullAddress: fullAddress,
		serviceLineMaterial: compactServiceLine.p || 'Unknown',
		customerSideMaterial: compactServiceLine.r || 'Unknown',
		utilitySideMaterial: compactServiceLine.p || 'Unknown',
		overallCode: compactServiceLine.o || 'Unknown',
		gooseneck: compactServiceLine.g || 'Unknown',
		highRisk: compactServiceLine.h || 'N',
		lastUpdated: 'Data provided by City of Chicago',
		additionalNotes: buildAdditionalNotes(compactServiceLine),
		rowId: compactServiceLine.i,
		PublSrvLnMatEPA: compactServiceLine.p,
		PrivateSrvLnMatEPA: compactServiceLine.r,
		Gooseneck: compactServiceLine.g,
		OverallSL_Code: compactServiceLine.o
	};
}

// Normalize address for lookup
function normalizeAddress(address) {
	return address
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

// Load all inventory records for a specific address
async function loadInventoryByAddress(address) {
	try {
		const lookup = await loadLookupData();
		const normalizedAddr = normalizeAddress(address);

		console.log('Searching for address:', address);
		console.log('Normalized address:', normalizedAddr);

		const serviceLines = lookup[normalizedAddr] || [];

		console.log('Found', serviceLines.length, 'service lines');

		return serviceLines.map((line) => transformServiceLine(line, address));
	} catch (error) {
		console.error('Error loading inventory data:', error);
		throw error;
	}
}

// Main function handler for DigitalOcean Functions
function main(args) {
	// Extract parameters from args
	const { __ow_method: method, __ow_headers: headers, ...params } = args;

	// Response headers (without CORS - DO handles that)
	const responseHeaders = {
		'Content-Type': 'application/json'
	};

	// Handle OPTIONS request for CORS
	if (method === 'OPTIONS') {
		return {
			headers: responseHeaders,
			body: {}
		};
	}

	// Only accept GET requests
	if (method && method.toLowerCase() !== 'get') {
		return {
			headers: responseHeaders,
			body: {
				error: 'Method not allowed',
				method: method
			}
		};
	}

	// Test endpoint
	if (params.test === 'true') {
		return {
			headers: responseHeaders,
			body: {
				success: true,
				message: 'Function is working!',
				timestamp: new Date().toISOString()
			}
		};
	}

	// Get address parameter
	const address = params.address;

	if (!address) {
		return {
			headers: responseHeaders,
			body: {
				error: 'Address parameter is required',
				usage: 'GET /api/inventory-lookup-v2?address=123%20Main%20St'
			}
		};
	}

	// Handle async inventory lookup
	return loadInventoryByAddress(address)
		.then((inventoryDataArray) => {
			console.log('Found', inventoryDataArray ? inventoryDataArray.length : 0, 'service lines');
			if (!inventoryDataArray || inventoryDataArray.length === 0) {
				return {
					headers: responseHeaders,
					body: {
						error: 'Address not found in inventory',
						address: address,
						searchedFor: address,
						suggestion: 'Please verify the address format and try again'
					}
				};
			}

			return {
				headers: responseHeaders,
				body: {
					success: true,
					address: address,
					count: inventoryDataArray.length,
					inventory: inventoryDataArray.length === 1 ? inventoryDataArray[0] : null,
					inventoryList: inventoryDataArray,
					metadata: {
						timestamp: new Date().toISOString(),
						source: 'City of Chicago Water Service Line Inventory'
					}
				}
			};
		})
		.catch((error) => {
			console.error('Function error:', error);
			return {
				headers: responseHeaders,
				body: {
					error: 'Internal server error',
					message: error.message,
					stack: error.stack
				}
			};
		});
}

module.exports.main = main;
