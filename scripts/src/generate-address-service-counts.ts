import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AddressServiceCount {
	address: string;
	count: number;
}

async function generateAddressServiceCounts(): Promise<void> {
	const inventoryPath = path.join(__dirname, '../data/processed/inventory.csv');
	const outputPath = path.join(__dirname, '../data/processed/address-service-counts.json');
	
	const addressCounts: Map<string, number> = new Map();
	
	return new Promise((resolve, reject) => {
		fs.createReadStream(inventoryPath)
			.pipe(
				parse({
					columns: true,
					skip_empty_lines: true
				})
			)
			.on('data', (row: any) => {
				const fullAddress = row.FullAddress?.trim();
				if (fullAddress) {
					const normalizedAddress = fullAddress.toLowerCase()
						.replace(/[^\w\s]/g, ' ')
						.replace(/\s+/g, ' ')
						.trim();
					
					addressCounts.set(normalizedAddress, (addressCounts.get(normalizedAddress) || 0) + 1);
				}
			})
			.on('end', () => {
				// Convert to array and filter for addresses with multiple service lines
				const multiServiceAddresses: AddressServiceCount[] = [];
				addressCounts.forEach((count, address) => {
					if (count > 1) {
						multiServiceAddresses.push({ address, count });
					}
				});
				
				// Sort by count descending
				multiServiceAddresses.sort((a, b) => b.count - a.count);
				
				// Create output object
				const output = {
					totalAddresses: addressCounts.size,
					addressesWithMultipleLines: multiServiceAddresses.length,
					counts: Object.fromEntries(addressCounts),
					metadata: {
						generatedAt: new Date().toISOString(),
						source: 'inventory.csv'
					}
				};
				
				// Write to file
				fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
				
				console.log(`✓ Address service counts generated:`);
				console.log(`  - Total unique addresses: ${addressCounts.size}`);
				console.log(`  - Addresses with multiple service lines: ${multiServiceAddresses.length}`);
				console.log(`  - Top 5 addresses by service line count:`);
				multiServiceAddresses.slice(0, 5).forEach(({ address, count }) => {
					console.log(`    - ${address}: ${count} service lines`);
				});
				
				resolve();
			})
			.on('error', reject);
	});
}

// Run the script
generateAddressServiceCounts()
	.then(() => console.log('Done!'))
	.catch(err => console.error('Error:', err));