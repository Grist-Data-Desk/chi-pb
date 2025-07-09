/**
 * DigitalOcean Function for Chicago Water Service Line Inventory Lookup
 * 
 * This function takes a row ID or address and returns the corresponding inventory data
 * using a pre-indexed lookup file for fast responses.
 * 
 * Usage: 
 *   GET /api/inventory-lookup?id=12345
 *   GET /api/inventory-lookup?address=123%20Main%20St
 */

const https = require('https');
const zlib = require('zlib');

// Global variable to cache the lookup data
let lookupData = null;
let lookupLoadPromise = null;

// CSV parsing function
function parseCSVLine(line) {
	const result = [];
	let current = '';
	let inQuotes = false;
	
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim().replace(/^"|"$/g, ''));
			current = '';
		} else {
			current += char;
		}
	}
	
	result.push(current.trim().replace(/^"|"$/g, ''));
	return result;
}

// Determine confidence level from inventory record
function getConfidenceLevel(record) {
	const hasUnknown = [
		record['PublSrvLnMatEPA'],
		record['PrivateSrvLnMatEPA'],
		record['Gooseneck']
	].some(field => field === 'U' || !field);
	
	if (hasUnknown) return 'Low - Contains unknown materials';
	return 'Medium - Based on available records';
}

// Build additional notes from inventory record
function buildAdditionalNotes(record) {
	const notes = [];
	
	if (record['High Risk'] === 'Y') {
		notes.push('Marked as high risk property');
	}
	
	if (record['ServiceNewlyIdentified'] === 'Y') {
		notes.push('Service line newly identified');
	}
	
	if (record['PreviousLeadServiceReplaced'] === 'Y') {
		notes.push('Previous lead service line was replaced');
	}
	
	if (record['Customer Notified date']) {
		notes.push(`Customer notified on: ${record['Customer Notified date']}`);
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
		const lookupUrl = 'https://grist.nyc3.cdn.digitaloceanspaces.com/chi-pb/data/search/server-inventory-lookup.json.br';
		
		console.log('Loading compressed lookup data from:', lookupUrl);
		
		https.get(lookupUrl, (res) => {
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
					const compressedData = Buffer.concat(chunks);
					
					// Decompress the brotli data
					zlib.brotliDecompress(compressedData, (err, decompressedData) => {
						if (err) {
							reject(new Error('Failed to decompress lookup data: ' + err.message));
							return;
						}
						
						try {
							lookupData = JSON.parse(decompressedData.toString());
							console.log('Lookup data loaded and decompressed successfully:', {
								totalRecords: lookupData.metadata?.totalRecords,
								uniqueAddresses: lookupData.metadata?.uniqueAddresses,
								compressedSize: `${(compressedData.length / 1024).toFixed(1)}KB`,
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
		}).on('error', (err) => {
			reject(err);
		});
	});
	
	return lookupLoadPromise;
}

// Transform compact inventory record to API response format
function transformInventoryRecord(compactRecord) {
	// Convert compact format back to full format
	const record = {
		idx: compactRecord.i,
		fullAddress: compactRecord.a,
		PublSrvLnMatEPA: compactRecord.p,
		PrivateSrvLnMatEPA: compactRecord.r,
		Gooseneck: compactRecord.g,
		OverallSL_Code: compactRecord.o,
		HighRisk: compactRecord.h
	};
	
	return {
		fullAddress: record.fullAddress,
		serviceLineMaterial: record.PublSrvLnMatEPA || 'Unknown',
		customerSideMaterial: record.PrivateSrvLnMatEPA || 'Unknown',
		utilitySideMaterial: record.PublSrvLnMatEPA || 'Unknown',
		overallCode: record.OverallSL_Code || 'Unknown',
		gooseneck: record.Gooseneck || 'Unknown',
		confidence: getConfidenceLevel(record),
		highRisk: record.HighRisk || 'N',
		lastUpdated: 'Data provided by City of Chicago',
		additionalNotes: buildAdditionalNotes(record),
		rowId: record.idx,
		PublSrvLnMatEPA: record.PublSrvLnMatEPA,
		PrivateSrvLnMatEPA: record.PrivateSrvLnMatEPA,
		Gooseneck: record.Gooseneck,
		OverallSL_Code: record.OverallSL_Code
	};
}

// Load specific inventory row by ID
async function loadInventoryByRowId(rowId) {
	try {
		const lookup = await loadLookupData();
		const record = lookup.byRowId[rowId];
		
		if (!record) {
			return null;
		}
		
		return transformInventoryRecord(record);
		
	} catch (error) {
		console.error('Error loading inventory data:', error);
		throw error;
	}
}

// Normalize address for lookup
function normalizeAddress(address) {
	return address.toLowerCase()
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
		
		const records = lookup.byAddress[normalizedAddr] || [];
		
		console.log('Found', records.length, 'records');
		
		return records.map(record => transformInventoryRecord(record));
		
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
	
	// Handle async inventory lookup
	const rowId = params.id;
	const address = params.address;
	
	// If address is provided, get all service lines for that address
	if (address) {
		console.log('Address search requested for:', address);
		return loadInventoryByAddress(address)
			.then(inventoryDataArray => {
				console.log('Found', inventoryDataArray ? inventoryDataArray.length : 0, 'records');
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
			.catch(error => {
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
	
	// If rowId is provided, get single service line by ID (legacy support)
	if (!rowId) {
		return {
			headers: responseHeaders,
			body: { 
				error: 'Row ID or address parameter is required',
				usage: 'GET /api/inventory-lookup?id=12345 OR GET /api/inventory-lookup?address=123%20Main%20St'
			}
		};
	}
	
	const rowIndex = parseInt(rowId);
	if (isNaN(rowIndex) || rowIndex < 0) {
		return {
			headers: responseHeaders,
			body: {
				error: 'Invalid row ID - must be a positive integer',
				provided: rowId
			}
		};
	}
	
	// For async operations, return a Promise
	return loadInventoryByRowId(rowIndex)
		.then(inventoryData => {
			if (!inventoryData) {
				return {
					headers: responseHeaders,
					body: {
						error: 'Row ID not found in inventory',
						rowId: rowIndex,
						suggestion: 'Please verify the row ID is valid'
					}
				};
			}
			
			return {
				headers: responseHeaders,
				body: {
					success: true,
					rowId: rowIndex,
					inventory: inventoryData,
					count: 1,
					inventoryList: [inventoryData],
					metadata: {
						timestamp: new Date().toISOString(),
						source: 'City of Chicago Water Service Line Inventory'
					}
				}
			};
		})
		.catch(error => {
			console.error('Function error:', error);
			return {
				headers: responseHeaders,
				body: {
					error: 'Internal server error',
					message: error.message
				}
			};
		});
}

module.exports.main = main;