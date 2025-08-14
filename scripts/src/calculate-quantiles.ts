import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, any>;
    geometry: any;
  }>;
}

// Calculate values at specific percentile points
function calculatePercentiles(values: number[], percentiles: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const results: number[] = [];
  
  for (const percentile of percentiles) {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sorted.length - 1));
    results.push(sorted[safeIndex]);
  }
  
  return results;
}

async function processGeoJSON() {
  const modes = ['pct_requires_replacement', 'pct_poverty', 'pct_minority'];
  const results: Record<string, any> = {};
  const percentilePoints = [1, 5, 20, 40, 60, 80, 95, 99];
  
  // Process census tracts
  const tractsPath = path.join(__dirname, '../data/raw/chi-tracts-filled.geojson');
  const tractsData = await fs.readFile(tractsPath, 'utf-8');
  const tractsGeoJSON: FeatureCollection = JSON.parse(tractsData);
  
  for (const mode of modes) {
    const values: number[] = [];
    tractsGeoJSON.features.forEach(feature => {
      const value = feature.properties?.[mode];
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    });
    
    const quantiles = calculatePercentiles(values, percentilePoints);
    results[`tract-${mode}`] = {
      quantiles,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
    
    console.log(`Census Tracts - ${mode}:`);
    console.log(`  Count: ${values.length}`);
    console.log(`  Min: ${Math.min(...values).toFixed(2)}%`);
    console.log(`  Max: ${Math.max(...values).toFixed(2)}%`);
    console.log(`  Percentiles (${percentilePoints.join(', ')}): ${quantiles.map(q => q.toFixed(2)).join('%, ')}%`);
    console.log('');
  }
  
  // Process community areas
  const commPath = path.join(__dirname, '../data/raw/chi-comm-areas.geojson');
  const commData = await fs.readFile(commPath, 'utf-8');
  const commGeoJSON: FeatureCollection = JSON.parse(commData);
  
  for (const mode of modes) {
    const values: number[] = [];
    commGeoJSON.features.forEach(feature => {
      const value = feature.properties?.[mode];
      if (typeof value === 'number' && !isNaN(value)) {
        values.push(value);
      }
    });
    
    if (values.length > 0) {
      const quantiles = calculatePercentiles(values, percentilePoints);
      results[`community-${mode}`] = {
        quantiles,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
      
      console.log(`Community Areas - ${mode}:`);
      console.log(`  Count: ${values.length}`);
      console.log(`  Min: ${Math.min(...values).toFixed(2)}%`);
      console.log(`  Max: ${Math.max(...values).toFixed(2)}%`);
      console.log(`  Percentiles (${percentilePoints.join(', ')}): ${quantiles.map(q => q.toFixed(2)).join('%, ')}%`);
      console.log('');
    } else {
      console.log(`Community Areas - ${mode}: No data available`);
      console.log('');
    }
  }
  
  const outputPath = path.join(__dirname, '../../src/lib/utils/quantile-data.ts');
  const output = `// Auto-generated quantile data
// Generated on ${new Date().toISOString()}

export const QUANTILE_DATA = ${JSON.stringify(results, null, 2)} as const;
`;
  
  await fs.writeFile(outputPath, output);
  console.log(`Quantile data written to ${outputPath}`);
}

processGeoJSON().catch(console.error);