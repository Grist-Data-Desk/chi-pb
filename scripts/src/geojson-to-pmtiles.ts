import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const execAsync = promisify(exec);

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const inputFiles = [
	'../../scripts/data/raw/chi-tracts-filled.geojson',
	'../../scripts/data/raw/chi-comm-areas.geojson',
	'../../scripts/data/raw/service-lines.geojson',
];


/**
 * Generate PMTiles archive for Chicago dataset.
 */
const main = async (): Promise<void> => {
	for await (const file of inputFiles) {
		const name = path.parse(file).name;
		const filePath = path.resolve(__dirname, file);
		// Always output to processed folder
		const outFile = `../../scripts/data/processed/${name}.pmtiles`;
		const outFilePath = path.resolve(__dirname, outFile);
		
		// Create a temporary reprojected file
		const tempFile = path.resolve(__dirname, `../../scripts/data/processed/${name}-wgs84.geojson`);

		try {
			// First, reproject to WGS84 using ogr2ogr
			console.log(`Reprojecting ${file} to WGS84...`);
			const reprojectCmd = `ogr2ogr -f GeoJSON -t_srs EPSG:4326 ${tempFile} ${filePath}`;
			await execAsync(reprojectCmd);

			// Then convert to PMTiles
			console.log(`Generating PMTiles for ${file}...`);
			const tippecanoeCmd = `tippecanoe -zg -o ${outFilePath} -l ${name} --drop-densest-as-needed --extend-zooms-if-still-dropping --force ${tempFile}`;
			
			const { stdout, stderr } = await execAsync(tippecanoeCmd);
			console.log(stdout);
			if (stderr) console.error(stderr);
			
			// Clean up temporary file
			fs.unlinkSync(tempFile);
			console.log(`Successfully created ${outFile}`);
			
		} catch (err) {
			console.error(`Failed to process ${file}:`, err);
			// Clean up temp file if it exists
			if (fs.existsSync(tempFile)) {
				fs.unlinkSync(tempFile);
			}
		}
	}
};

main().catch(console.error);
