/**
 * DigitalOcean Function for Chicago Water Service Line Inventory Lookup
 *
 * This function takes an address and returns the corresponding inventory data
 * without requiring the client to load the entire inventory file.
 *
 * Usage: GET /api/inventory-lookup?address=1234%20N%20State%20St
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

// Address normalization for matching
function normalizeAddressForMatching(address) {
	return address
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
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

// Load and parse inventory data from DigitalOcean Spaces
async function loadInventoryData() {
	const inventoryUrl =
		'https://grist.nyc3.cdn.digitaloceanspaces.com/chi-pb/data/csv/inventory.csv';

	try {
		const response = await fetch(inventoryUrl);
		if (!response.ok) {
			throw new Error(`Failed to load inventory data: ${response.statusText}`);
		}

		const csvText = await response.text();
		const lines = csvText.split('\n');
		const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

		const inventoryMap = new Map();

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = parseCSVLine(line);
			if (values.length < headers.length) continue;

			const record = {};
			headers.forEach((header, index) => {
				record[header] = values[index] || '';
			});

			if (record.FullAddress) {
				const normalizedAddress = normalizeAddressForMatching(record.FullAddress);
				inventoryMap.set(normalizedAddress, {
					fullAddress: record.FullAddress,
					serviceLineMaterial: record.PublSrvLnMatEPA || 'Unknown',
					customerSideMaterial: record.PrivateSrvLnMatEPA || 'Unknown',
					utilitySideMaterial: record.PublSrvLnMatEPA || 'Unknown',
					overallCode: record['OverallSL Code'] || 'Unknown',
					gooseneck: record.Gooseneck || 'Unknown',
					highRisk: record['High Risk'] || 'N',
					lastUpdated: 'Data provided by City of Chicago',
					additionalNotes: buildAdditionalNotes(record)
				});
			}
		}

		return inventoryMap;
	} catch (error) {
		console.error('Error loading inventory data:', error);
		throw error;
	}
}

// Main function handler
export default async function (req, res) {
	// Handle CORS
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const address = req.query.address;

		if (!address) {
			return res.status(400).json({
				error: 'Address parameter is required',
				usage: 'GET /api/inventory-lookup?address=1234%20N%20State%20St'
			});
		}

		console.log(`Looking up inventory for address: ${address}`);

		// Load inventory data
		const inventoryMap = await loadInventoryData();

		// Normalize the search address
		const normalizedAddress = normalizeAddressForMatching(address);

		// Look up the inventory record
		const inventoryData = inventoryMap.get(normalizedAddress);

		if (!inventoryData) {
			return res.status(404).json({
				error: 'Address not found in inventory',
				address: address,
				suggestion: 'Please verify the address format and try again'
			});
		}

		// Return the inventory data
		return res.status(200).json({
			success: true,
			address: address,
			inventory: inventoryData,
			metadata: {
				timestamp: new Date().toISOString(),
				source: 'City of Chicago Water Service Line Inventory'
			}
		});
	} catch (error) {
		console.error('Function error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			message: error.message
		});
	}
}
