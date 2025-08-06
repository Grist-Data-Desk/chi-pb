import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const SEARCH_INDEX_PATH = 'chi-pb/data/search';

/**
 * Store inventory lookup files in the Grist DigitalOcean Spaces bucket.
 */
async function main(): Promise<void> {
	const s3Client = new S3Client({
		endpoint: 'https://nyc3.digitaloceanspaces.com/',
		forcePathStyle: false,
		region: 'nyc3',
		credentials: {
			accessKeyId: process.env.DO_SPACES_KEY || '',
			secretAccessKey: process.env.DO_SPACES_SECRET || ''
		}
	});
	
	// Upload main lookup files
	const lookupFiles = (await fs.readdir(path.resolve(__dirname, '../../scripts/data/processed')))
		.filter((file) => file.startsWith('inventory-lookup.json'));

	for (const file of lookupFiles) {
		console.log(`Uploading ${file}`);

		const filePath = path.resolve(__dirname, `../../scripts/data/processed/${file}`);
		const fileContent = await fs.readFile(filePath);

		// Determine content type
		let contentType = 'application/json';
		
		if (file.endsWith('.br') || file.endsWith('.brotli')) {
			// Don't set content-encoding for compressed files to prevent CDN auto-decompression
			contentType = 'application/octet-stream';
		}

		// Rename .br to .brotli for DO Spaces compatibility
		const uploadKey = file === 'inventory-lookup.json.br' 
			? `${SEARCH_INDEX_PATH}/inventory-lookup.json.brotli`
			: `${SEARCH_INDEX_PATH}/${file}`;

		const putObjectCommand = new PutObjectCommand({
			Bucket: 'grist',
			Key: uploadKey,
			Body: fileContent,
			ACL: 'public-read',
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000' // Cache for 1 year
		});

		try {
			const response = await s3Client.send(putObjectCommand);
			console.log(`Successfully uploaded ${file} as ${uploadKey}`);
			console.log(`  URL: https://grist.nyc3.cdn.digitaloceanspaces.com/${uploadKey}`);
		} catch (error) {
			console.error(`Failed to upload ${file}:`, error);
		}
	}

	// Also upload metadata files
	const metaFiles = (await fs.readdir(path.resolve(__dirname, '../../scripts/data/processed')))
		.filter((file) => file.startsWith('inventory-lookup-metadata.json'));

	for (const file of metaFiles) {
		console.log(`Uploading ${file}`);

		const filePath = path.resolve(__dirname, `../../scripts/data/processed/${file}`);
		const fileContent = await fs.readFile(filePath);

		// Determine content type
		let contentType = 'application/json';
		
		if (file.endsWith('.br') || file.endsWith('.brotli')) {
			// Don't set content-encoding for compressed files to prevent CDN auto-decompression
			contentType = 'application/octet-stream';
		}

		// Rename .br to .brotli for DO Spaces compatibility  
		const uploadKey = file === 'inventory-lookup-metadata.json.br'
			? `${SEARCH_INDEX_PATH}/inventory-lookup-metadata.json.brotli`
			: `${SEARCH_INDEX_PATH}/${file}`;
			
		const putObjectCommand = new PutObjectCommand({
			Bucket: 'grist',
			Key: uploadKey,
			Body: fileContent,
			ACL: 'public-read',
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000' // Cache for 1 year
		});

		try {
			const response = await s3Client.send(putObjectCommand);
			console.log(`Successfully uploaded ${file}`);
		} catch (error) {
			console.error(`Failed to upload ${file}:`, error);
		}
	}
}

main().catch(console.error);