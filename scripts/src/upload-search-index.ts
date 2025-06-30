import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const SEARCH_INDEX_PATH = 'chi-pb/data/search';

/**
 * Store search index files in the Grist DigitalOcean Spaces bucket.
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

	const searchIndexFiles = (await fs.readdir(path.resolve(__dirname, '../../scripts/data/processed')))
		.filter((file) => file.startsWith('minimal-search-index.json'));

	for (const file of searchIndexFiles) {
		console.log(`Uploading ${file}`);

		const filePath = path.resolve(__dirname, `../../scripts/data/processed/${file}`);
		const fileContent = await fs.readFile(filePath);

		// Determine content type and encoding
		let contentType = 'application/json';
		let contentEncoding: string | undefined;
		
		if (file.endsWith('.br')) {
			contentEncoding = 'br';
		}

		const putObjectCommand = new PutObjectCommand({
			Bucket: 'grist',
			Key: `${SEARCH_INDEX_PATH}/${file}`,
			Body: fileContent,
			ACL: 'public-read',
			ContentType: contentType,
			ContentEncoding: contentEncoding,
			CacheControl: 'public, max-age=31536000' // Cache for 1 year
		});

		try {
			const response = await s3Client.send(putObjectCommand);
			console.log(`Successfully uploaded ${file}`);
			console.log(response);
		} catch (error) {
			console.error(`Failed to upload ${file}:`, error);
		}
	}

	// Also upload metadata files
	const metaFiles = (await fs.readdir(path.resolve(__dirname, '../../scripts/data/processed')))
		.filter((file) => (
			
			file.startsWith('minimal-search-index.json')) && file.endsWith('.meta'));

	for (const file of metaFiles) {
		console.log(`Uploading ${file}`);

		const filePath = path.resolve(__dirname, `../../scripts/data/processed/${file}`);
		const fileContent = await fs.readFile(filePath);

		const putObjectCommand = new PutObjectCommand({
			Bucket: 'grist',
			Key: `${SEARCH_INDEX_PATH}/${file}`,
			Body: fileContent,
			ACL: 'public-read',
			ContentType: 'application/json',
			CacheControl: 'public, max-age=31536000' // Cache for 1 year
		});

		try {
			const response = await s3Client.send(putObjectCommand);
			console.log(`Successfully uploaded ${file}`);
			console.log(response);
		} catch (error) {
			console.error(`Failed to upload ${file}:`, error);
		}
	}
}

main().catch(console.error);