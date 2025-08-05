// Nominatim API integration for fallback address search

export interface NominatimResult {
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	class: string;
	type: string;
	place_rank: number;
	importance: number;
	addresstype: string;
	name: string;
	display_name: string;
	boundingbox: string[];
}

export interface NominatimError {
	error: string;
}

// Format Nominatim address to match inventory format
export function formatNominatimAddress(displayName: string): string {
	// Split by comma and trim each part
	const parts = displayName.split(',').map(p => p.trim());
	
	// Try to extract the essential parts
	let streetNumber = '';
	let streetName = '';
	let city = 'CHICAGO';
	let state = 'IL';
	let zip = '';
	
	// First part is just the number, second part is usually the street name
	if (parts[0] && parts[1]) {
		// Check if first part is just a number
		if (/^\d+$/.test(parts[0])) {
			streetNumber = parts[0];
			streetName = parts[1].toUpperCase();
		} else {
			// First part might contain both number and street
			const streetMatch = parts[0].match(/^(\d+)\s+(.+)$/);
			if (streetMatch) {
				streetNumber = streetMatch[1];
				streetName = streetMatch[2].toUpperCase();
			} else {
				// No street number, just street name
				streetName = parts[0].toUpperCase();
			}
		}
	} else if (parts[0]) {
		// Only one part, try to parse it
		const streetMatch = parts[0].match(/^(\d+)\s+(.+)$/);
		if (streetMatch) {
			streetNumber = streetMatch[1];
			streetName = streetMatch[2].toUpperCase();
		} else {
			streetName = parts[0].toUpperCase();
		}
	}
	
	// Look for Chicago and zip code in the parts
	for (const part of parts) {
		if (part.toLowerCase().includes('chicago') && !part.toLowerCase().includes('township')) {
			city = 'CHICAGO';
		} else if (/^\d{5}$/.test(part)) {
			zip = part;
		} else if (part.toLowerCase() === 'illinois') {
			state = 'IL';
		}
	}
	
	// Format the address
	if (streetNumber && streetName) {
		return `${streetNumber} ${streetName}, ${city}, ${state}${zip ? ' ' + zip : ''}`;
	} else if (streetName) {
		return `${streetName}, ${city}, ${state}${zip ? ' ' + zip : ''}`;
	} else {
		// Fallback to a simplified version
		return `${parts[0] || 'Unknown'}, ${city}, ${state}`;
	}
}


// Check if a string is a valid coordinate pair
export function isCoordinatePair(input: string): { lat: number; lon: number } | null {
	// Try various coordinate formats
	// Format 1: "lat,lon" or "lat, lon"
	const commaMatch = input.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);
	if (commaMatch) {
		const lat = parseFloat(commaMatch[1]);
		const lon = parseFloat(commaMatch[2]);
		if (isValidLatitude(lat) && isValidLongitude(lon)) {
			return { lat, lon };
		}
	}

	// Format 2: "lat lon" (space separated)
	const spaceMatch = input.match(/^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/);
	if (spaceMatch) {
		const lat = parseFloat(spaceMatch[1]);
		const lon = parseFloat(spaceMatch[2]);
		if (isValidLatitude(lat) && isValidLongitude(lon)) {
			return { lat, lon };
		}
	}

	return null;
}

function isValidLatitude(lat: number): boolean {
	return lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: number): boolean {
	return lon >= -180 && lon <= 180;
}

// Search for an address using Nominatim (optimized for speed)
export async function searchNominatim(query: string): Promise<NominatimResult | null> {
	try {
		// Simpler, faster query
		const params = new URLSearchParams({
			q: query,
			format: 'json',
			limit: '1',
			countrycodes: 'us',
			addressdetails: '1'
		});

		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?${params.toString()}`,
			{
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'Chicago Water Service Line Map'
				}
			}
		);

		if (!response.ok) {
			console.error('Nominatim API error:', response.status, response.statusText);
			return null;
		}

		const data = await response.json();
		
		// Nominatim returns an array, we requested limit=1
		if (Array.isArray(data) && data.length > 0) {
			// Prioritize Chicago results
			const chicagoResult = data.find((result: NominatimResult) => 
				result.display_name.includes('Chicago') || 
				result.display_name.includes('IL')
			);
			return chicagoResult || data[0];
		}

		return null;
	} catch (error) {
		console.error('Error searching Nominatim:', error);
		return null;
	}
}

// Reverse geocode coordinates to get address
export async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
	try {
		const params = new URLSearchParams({
			lat: lat.toString(),
			lon: lon.toString(),
			format: 'json',
			addressdetails: '1'
		});

		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
			{
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'Chicago Water Service Line Map'
				}
			}
		);

		if (!response.ok) {
			console.error('Nominatim reverse geocode error:', response.status, response.statusText);
			return null;
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error reverse geocoding:', error);
		return null;
	}
}