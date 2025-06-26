import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import 'dotenv/config';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const CSV_PATH = 'chi-pb/data/csv';

/**
 * Store CSV files in the Grist DigitalOcean Spaces bucket.
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

	const csvFiles = (await fs.readdir(path.resolve(__dirname, '../../scripts/data/processed')))
		.filter((file) => path.extname(file) === '.csv');

	for (const file of csvFiles) {
		console.log(`Uploading ${file}`);

		const filePath = path.resolve(__dirname, `../../scripts/data/processed/${file}`);
		const fileContent = await fs.readFile(filePath);

		const putObjectCommand = new PutObjectCommand({
			Bucket: 'grist',
			Key: `${CSV_PATH}/${file}`,
			Body: fileContent,
			ACL: 'public-read',
			ContentType: 'text/csv',
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