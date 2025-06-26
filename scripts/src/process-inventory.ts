import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { brotliCompress } from 'zlib';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brotliCompressAsync = promisify(brotliCompress);

interface ServiceLineRow {
	Idx: number;
	FullAddress: string;
	LCRSiteID: string;
	'High Risk': string;
	ServiceNewlyIdentified: string;
	'PWS Service Install Dates': string;
	'Customer Service Install Dates': string;
	CombinedSourceDescription: string;
	Gooseneck: string;
	PublSrvLnMatEPA: string;
	PrivateSrvLnMatEPA: string;
	'OverallSL Code': string;
	GalDownstreamofLead: string;
	'Customer Notified date': string;
	PreviousLeadServiceReplaced: string;
	'Final Service Install Dates': string;
	MaterialOfServiceLineReplacement: string;
	WaiverCustomerRefusedAccessToProperty: string;
	IDPHWaiverDate: string;
}

function cleanFieldName(key: string): string {
	return key.replace(/^\uFEFF/, '').trim();
}

function determineLeadStatus(overallCode: string): 'LEAD' | 'GRR' | 'NON_LEAD' | 'UNKNOWN' {
	const code = overallCode?.trim().toUpperCase() || '';
	
	switch (code) {
		case 'L':
			return 'LEAD';
		case 'GRR':
			return 'GRR';
		case 'NL':
			return 'NON_LEAD';
		case 'U':
		default:
			return 'UNKNOWN';
	}
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

async function processInventory(): Promise<void> {
	const inventoryPath = path.join(__dirname, '../data/raw/inventory.csv');
	const outputDir = path.join(__dirname, '../data/processed');
	
	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log('Processing service line inventory...');
	const processedData: Array<ServiceLineRow & { leadStatus: string }> = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream(inventoryPath)
			.pipe(parse({ columns: true, skip_empty_lines: true }))
			.on('data', (row: any) => {
				const normalizedRow = Object.fromEntries(
					Object.entries(row).map(([key, value]) => [cleanFieldName(key), value])
				);

				const serviceLineRow: ServiceLineRow = {
					Idx: parseInt(normalizedRow.Idx as string) || 0,
					FullAddress: String(normalizedRow.FullAddress || ''),
					LCRSiteID: String(normalizedRow.LCRSiteID || ''),
					'High Risk': String(normalizedRow['High Risk'] || ''),
					ServiceNewlyIdentified: String(normalizedRow.ServiceNewlyIdentified || ''),
					'PWS Service Install Dates': String(normalizedRow['PWS Service Install Dates'] || ''),
					'Customer Service Install Dates': String(normalizedRow['Customer Service Install Dates'] || ''),
					CombinedSourceDescription: String(normalizedRow.CombinedSourceDescription || ''),
					Gooseneck: String(normalizedRow.Gooseneck || ''),
					PublSrvLnMatEPA: String(normalizedRow.PublSrvLnMatEPA || ''),
					PrivateSrvLnMatEPA: String(normalizedRow.PrivateSrvLnMatEPA || ''),
					'OverallSL Code': String(normalizedRow['OverallSL Code'] || ''),
					GalDownstreamofLead: String(normalizedRow.GalDownstreamofLead || ''),
					'Customer Notified date': String(normalizedRow['Customer Notified date'] || ''),
					PreviousLeadServiceReplaced: String(normalizedRow.PreviousLeadServiceReplaced || ''),
					'Final Service Install Dates': String(normalizedRow['Final Service Install Dates'] || ''),
					MaterialOfServiceLineReplacement: String(normalizedRow.MaterialOfServiceLineReplacement || ''),
					WaiverCustomerRefusedAccessToProperty: String(normalizedRow.WaiverCustomerRefusedAccessToProperty || ''),
					IDPHWaiverDate: String(normalizedRow.IDPHWaiverDate || '')
				};

				const leadStatus = determineLeadStatus(serviceLineRow['OverallSL Code']);

				processedData.push({
					...serviceLineRow,
					leadStatus
				});
			})
			.on('end', async () => {
				console.log(`Processed ${processedData.length} service line records`);

				const outputPath = path.join(outputDir, 'service-lines.json');
				await writeCompressedJSON(outputPath, processedData);

				// Generate summary stats
				const leadCount = processedData.filter(d => d.leadStatus === 'LEAD').length;
				const grrCount = processedData.filter(d => d.leadStatus === 'GRR').length;
				const nonLeadCount = processedData.filter(d => d.leadStatus === 'NON_LEAD').length;
				const unknownCount = processedData.filter(d => d.leadStatus === 'UNKNOWN').length;

				console.log(`\nService Line Summary:`);
				console.log(`Total processed: ${processedData.length}`);
				console.log(`Lead (L): ${leadCount} (${((leadCount / processedData.length) * 100).toFixed(1)}%)`);
				console.log(`Galvanized Requiring Replacement (GRR): ${grrCount} (${((grrCount / processedData.length) * 100).toFixed(1)}%)`);
				console.log(`Non-Lead (NL): ${nonLeadCount} (${((nonLeadCount / processedData.length) * 100).toFixed(1)}%)`);
				console.log(`Unknown (U): ${unknownCount} (${((unknownCount / processedData.length) * 100).toFixed(1)}%)`);

				resolve();
			})
			.on('error', reject);
	});
}

processInventory()
	.then(() => console.log('Inventory processing complete'))
	.catch((err: Error) => console.error('Error:', err.message));