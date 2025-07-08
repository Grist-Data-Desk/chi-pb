/**
 * DigitalOcean Function for Chicago Water Service Line Inventory Lookup
 * 
 * This function takes a row ID and returns the corresponding inventory data
 * without requiring the client to load the entire inventory file.
 * 
 * Usage: GET /api/inventory-lookup?id=12345
 */

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

// Load specific inventory row by ID
async function loadInventoryByRowId(rowId) {
	const inventoryUrl = 'https://grist.nyc3.cdn.digitaloceanspaces.com/chi-pb/data/csv/inventory.csv';
	
	try {
		const response = await fetch(inventoryUrl);
		if (!response.ok) {
			throw new Error(`Failed to load inventory data: ${response.statusText}`);
		}
		
		const csvText = await response.text();
		const lines = csvText.split('\n');
		const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace(/^\uFEFF/, ''));
		
		// Find the row by Idx field (inventory uses Idx, search index uses row)
		let targetRecord = null;
		
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;
			
			const values = parseCSVLine(line);
			if (values.length < headers.length) continue;
			
			const record = {};
			headers.forEach((header, index) => {
				record[header] = values[index] || '';
			});
			
			// Check if this row's Idx matches our target rowId
			const recordIdx = parseInt(record['Idx']);
			
			if (recordIdx === rowId) {
				targetRecord = record;
				break; // Found it, stop parsing
			}
		}
		
		if (!targetRecord) {
			return null; // Row not found
		}
		
		// Transform to our standard format
		return {
			fullAddress: targetRecord.FullAddress,
			serviceLineMaterial: targetRecord.PublSrvLnMatEPA || 'Unknown',
			customerSideMaterial: targetRecord.PrivateSrvLnMatEPA || 'Unknown',
			utilitySideMaterial: targetRecord.PublSrvLnMatEPA || 'Unknown',
			overallCode: targetRecord['OverallSL Code'] || 'Unknown',
			gooseneck: targetRecord.Gooseneck || 'Unknown',
			confidence: getConfidenceLevel(targetRecord),
			highRisk: targetRecord['High Risk'] || 'N',
			lastUpdated: 'Data provided by City of Chicago',
			additionalNotes: buildAdditionalNotes(targetRecord),
			rowId: recordIdx,
			PublSrvLnMatEPA: targetRecord.PublSrvLnMatEPA,
			PrivateSrvLnMatEPA: targetRecord.PrivateSrvLnMatEPA,
			Gooseneck: targetRecord.Gooseneck,
			OverallSL_Code: targetRecord['OverallSL Code']
		};
		
	} catch (error) {
		console.error('Error loading inventory data:', error);
		throw error;
	}
}

// Load all inventory records for a specific address
async function loadInventoryByAddress(address) {
	const inventoryUrl = 'https://grist.nyc3.cdn.digitaloceanspaces.com/chi-pb/data/csv/inventory.csv';
	
	try {
		const response = await fetch(inventoryUrl);
		if (!response.ok) {
			throw new Error(`Failed to load inventory data: ${response.statusText}`);
		}
		
		const csvText = await response.text();
		const lines = csvText.split('\n');
		const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace(/^\uFEFF/, ''));
		
		// Normalize the search address
		const normalizedSearchAddress = address.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		
		// Find all matching records
		const matchingRecords = [];
		
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;
			
			const values = parseCSVLine(line);
			if (values.length < headers.length) continue;
			
			const record = {};
			headers.forEach((header, index) => {
				record[header] = values[index] || '';
			});
			
			// Normalize the record address
			const recordAddress = record.FullAddress || '';
			const normalizedRecordAddress = recordAddress.toLowerCase()
				.replace(/[^\w\s]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
			
			// Check if addresses match
			if (normalizedRecordAddress === normalizedSearchAddress) {
				const recordIdx = parseInt(record['Idx']);
				matchingRecords.push({
					fullAddress: record.FullAddress,
					serviceLineMaterial: record.PublSrvLnMatEPA || 'Unknown',
					customerSideMaterial: record.PrivateSrvLnMatEPA || 'Unknown',
					utilitySideMaterial: record.PublSrvLnMatEPA || 'Unknown',
					overallCode: record['OverallSL Code'] || 'Unknown',
					gooseneck: record.Gooseneck || 'Unknown',
					confidence: getConfidenceLevel(record),
					highRisk: record['High Risk'] || 'N',
					lastUpdated: 'Data provided by City of Chicago',
					additionalNotes: buildAdditionalNotes(record),
					rowId: recordIdx,
					PublSrvLnMatEPA: record.PublSrvLnMatEPA,
					PrivateSrvLnMatEPA: record.PrivateSrvLnMatEPA,
					Gooseneck: record.Gooseneck,
					OverallSL_Code: record['OverallSL Code']
				});
			}
		}
		
		return matchingRecords;
		
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
		return loadInventoryByAddress(address)
			.then(inventoryDataArray => {
				if (!inventoryDataArray || inventoryDataArray.length === 0) {
					return {
						headers: responseHeaders,
						body: {
							error: 'Address not found in inventory',
							address: address,
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
						message: error.message
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