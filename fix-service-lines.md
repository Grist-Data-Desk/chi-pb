# Service Line Issue Fix

## Problem
Addresses with multiple service lines only show 1 line when searched. For example:
- "641 W WILLOW ST" should have 63 service lines but only shows 1

## Root Cause
The inventory lookup file on the CDN is outdated:
- CDN file: Last modified July 8, 2025
- Local file: Generated July 11, 2025

The local file has all 63 service lines, but the CDN file only has 1.

## Solution
Re-upload the inventory lookup files to the CDN:

```bash
# Upload the inventory lookup files
pnpm upload:inventory-lookup

# Or if that script doesn't exist, use:
cd scripts
npm run upload-inventory-lookup
```

## Verification
After uploading, test with:
```bash
curl -s "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-f47822c0-7b7f-4248-940b-9249f4f51915/inventory/lookup-v2?address=641%20W%20WILLOW%20ST%2C%20CHICAGO%20IL%2060614" | jq '.count'
```

This should return `63` instead of `1`.

## Additional Notes
- The code is working correctly
- The search deduplication is working correctly  
- The API is working correctly
- Only the data file needs to be updated on the CDN