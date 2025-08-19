#!/usr/bin/env python3
"""
Clip community areas and census tracts GeoJSON files to Chicago boundary.
This ensures all geographic data is properly constrained to the city limits.
"""

import sys
import json
from pathlib import Path
import geopandas as gpd
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

def main():
    script_dir = Path(__file__).parent
    raw_data_dir = script_dir.parent / "data" / "raw"
    
    print("Loading Chicago boundary...")
    boundary_path = raw_data_dir / "chi-boundary.geojson"
    boundary_gdf = gpd.read_file(boundary_path)
    
    # Reproject boundary to WGS84 if needed
    if boundary_gdf.crs and boundary_gdf.crs != "EPSG:4326":
        print(f"Reprojecting boundary from {boundary_gdf.crs} to EPSG:4326...")
        boundary_gdf = boundary_gdf.to_crs("EPSG:4326")
    
    # Ensure we have a single geometry for clipping
    boundary_geom = boundary_gdf.union_all()
    
    # Files to clip - always read from -original files
    files_to_clip = [
        ("chi-comm-areas-original.geojson", "chi-comm-areas.geojson", "Community Areas"),
        ("chi-tracts-filled-original.geojson", "chi-tracts-filled.geojson", "Census Tracts")
    ]
    
    for input_filename, output_filename, description in files_to_clip:
        input_path = raw_data_dir / input_filename
        output_path = raw_data_dir / output_filename
        
        print(f"\nProcessing {description}...")
        
        # Check if original file exists
        if not input_path.exists():
            print(f"  ERROR: Original file {input_filename} not found!")
            print(f"  Please ensure the original unclipped files exist with -original suffix")
            return 1
        
        # Load the data
        print(f"  Loading from: {input_filename}")
        gdf = gpd.read_file(input_path)
        original_count = len(gdf)
        print(f"  Original features: {original_count}")
        
        # Reproject to WGS84 if needed
        if gdf.crs and gdf.crs != "EPSG:4326":
            print(f"  Reprojecting from {gdf.crs} to EPSG:4326...")
            gdf = gdf.to_crs("EPSG:4326")
        
        # Clip to boundary
        print(f"  Clipping to Chicago boundary...")
        clipped_gdf = gpd.clip(gdf, boundary_geom)
        clipped_count = len(clipped_gdf)
        print(f"  Clipped features: {clipped_count}")
        
        # Save clipped version
        print(f"  Saving clipped version to {output_filename}...")
        
        # Preserve the original GeoJSON structure as much as possible
        # Load original to get CRS format
        with open(input_path, 'r') as f:
            original_json = json.load(f)
        
        # Convert to GeoJSON dict
        clipped_json = json.loads(clipped_gdf.to_json())
        
        # Preserve original CRS format if it exists
        if 'crs' in original_json:
            # Since we're outputting in WGS84, update the CRS
            clipped_json['crs'] = {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            }
        
        # Preserve name if it exists
        if 'name' in original_json:
            clipped_json['name'] = original_json['name']
        
        # Write with formatting
        with open(output_path, 'w') as f:
            json.dump(clipped_json, f, indent=0, separators=(',', ':'))
        
        print(f"  ✓ Saved {clipped_count} features (removed {original_count - clipped_count})")
    
    print("\n✓ Clipping complete!")
    print("  Input: *-original.geojson files")
    print("  Output: Clipped files without suffix")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)